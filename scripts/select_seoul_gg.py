"""전국 키워드(31,023) 중 서울·경기 약 6천 개 선정 → data/site-pages.json + keywords/커튼블라인드_서울경기_6000.xlsx

  python -I scripts/select_seoul_gg.py

선정 순서 = 오픈 단계(wave)
  1 = 서울·경기 시도·시군·구 × 전체 단어 14종
  2 = 동·읍면 × 커튼·블라인드·커튼블라인드
  3 = 동·읍면 × 암막커튼·롤스크린·콤비블라인드
표기만 다른 쌍(강남구 커튼 / 강남 커튼, 수원 커튼 / 수원시 …)은 variantOf 로 대표 페이지를 표시한다.
"""
import json, os, re, sys
from collections import Counter
from openpyxl import Workbook, load_workbook
from openpyxl.styles import Font, PatternFill

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'keywords', '커튼블라인드_전국키워드.xlsx')
SIDOS = ('서울특별시', '경기도')
DONG_W2 = ['커튼', '블라인드', '커튼블라인드']
DONG_W3 = ['암막커튼', '롤스크린', '콤비블라인드']

allrows = list(load_workbook(SRC, read_only=True)['키워드'].iter_rows(min_row=2, values_only=True))
# 상위 지역은 엑셀 대신 전국 지역 데이터에서 (엑셀은 빈 칸이 잘려 읽히는 경우가 있다)
REG = {r['name']: r for r in json.load(open(os.path.join(ROOT, 'data', 'regions-kr.json'), encoding='utf-8'))['regions']}
# 열: No, 키워드, 단어, 구분, 지역, 지역 단위, 시도, 상위 지역, …
picked, wave_of = [], {}
for r in allrows:
    no, kw, word, grp, region, level, sido, parent = (list(r) + [None] * 8)[:8]
    if sido not in SIDOS:
        continue
    if level in ('시도', '시군', '구'):
        w = 1
    elif word in DONG_W2:
        w = 2
    elif word in DONG_W3:
        w = 3
    else:
        continue
    wave_of[kw] = w
    parent = (REG.get(region) or {}).get('parent') or parent or region
    picked.append(dict(no=no, kw=kw, slug=kw.replace(' ', '-'), word=word, region=region, level=level, sido=sido, parent=parent, wave=w))
picked.sort(key=lambda p: (p['wave'], p['no']))

# 표기 변형 묶음: 같은 시도·단어, 지역명에서 '구/시/군' 과 '서울 ' '경기 ' 접두를 떼면 같은 경우
norm = lambda n: re.sub(r'(구|시|군)$', '', re.sub(r'^(서울|경기) ', '', n))
main = {}
for p in picked:
    key = (p['sido'], p['word'], norm(p['region']), p['level'] in ('동', '읍면'))
    if key in main:
        p['variantOf'] = main[key]
    else:
        main[key] = p['slug']
assert len({p['slug'] for p in picked}) == len(picked)

json.dump({'pages': picked}, open(os.path.join(ROOT, 'data', 'site-pages.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)

# ---- 엑셀 ----
HEAD = PatternFill('solid', fgColor='23483D')
SEL = PatternFill('solid', fgColor='E3ECE8')
wb = Workbook()
ws = wb.active; ws.title = '요약'
c = Counter(p['wave'] for p in picked)
v = sum(1 for p in picked if 'variantOf' in p)
rows = [['구분', '개수', '설명'],
        ['선정 합계', len(picked), '서울·경기'],
        ['1단계', c[1], '시도·시군·구 × 14단어'],
        ['2단계', c[2], '동·읍면 × 커튼·블라인드·커튼블라인드'],
        ['3단계', c[3], '동·읍면 × 암막커튼·롤스크린·콤비블라인드'],
        ['표기 변형', v, '강남/강남구처럼 표기만 다른 페이지 — 대표 페이지로 canonical'],
        ['서울', sum(1 for p in picked if p['sido'] == '서울특별시'), ''],
        ['경기', sum(1 for p in picked if p['sido'] == '경기도'), '']]
for r in rows: ws.append(r)
for cell in ws[1]: cell.font, cell.fill = Font(bold=True, color='FFFFFF'), HEAD
ws.column_dimensions['A'].width = 14; ws.column_dimensions['C'].width = 60

s1 = wb.create_sheet('선정 키워드')
s1.append(['순번', '키워드', '페이지 URL', '오픈 단계', '단어', '지역', '지역 단위', '시도', '상위 지역', '대표 페이지(표기 변형)', '원본 No', '월검색수 PC', '월검색수 모바일'])
for cell in s1[1]: cell.font, cell.fill = Font(bold=True, color='FFFFFF'), HEAD
for i, p in enumerate(picked, 1):
    s1.append([i, p['kw'], f"/{p['slug']}/", p['wave'], p['word'], p['region'], p['level'], p['sido'], p['parent'], p.get('variantOf', ''), p['no'], None, None])
for col, w in zip('ABCDEFGHIJKLM', [7, 28, 32, 9, 13, 18, 9, 12, 12, 28, 9, 12, 14]): s1.column_dimensions[col].width = w
s1.freeze_panes = 'A2'; s1.auto_filter.ref = s1.dimensions

s2 = wb.create_sheet('전국 전체(선정 표시)')
s2.append(['No', '키워드', '단어', '구분', '지역', '지역 단위', '시도', '상위 지역', '서울경기 선정', '오픈 단계'])
for cell in s2[1]: cell.font, cell.fill = Font(bold=True, color='FFFFFF'), HEAD
for r in allrows:
    w = wave_of.get(r[1])
    s2.append((list(r) + [None] * 8)[:8] + (['O', w] if w else ['', '']))
    if w:
        for cell in s2[s2.max_row]: cell.fill = SEL
for col, w in zip('ABCDEFGHIJ', [8, 30, 14, 7, 22, 9, 16, 12, 12, 9]): s2.column_dimensions[col].width = w
s2.freeze_panes = 'A2'; s2.auto_filter.ref = s2.dimensions

out = os.path.join(ROOT, 'keywords', '커튼블라인드_서울경기_6000.xlsx')
wb.save(out)
sys.stdout.reconfigure(encoding='utf-8')
for r in rows[1:]: print(*r[:2])
print('->', out)
