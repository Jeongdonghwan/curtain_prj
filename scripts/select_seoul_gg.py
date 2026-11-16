"""전국 키워드(31,023) 중 서울·경기 8,070개 선정 → data/site-pages.json + keywords/커튼블라인드_서울경기_8000.xlsx

  python -I scripts/select_seoul_gg.py

묶음(stage) — 오픈 순서
  1 = 서울·경기 시도·시군·구 × 전체 단어 14종
  2 = 동·읍면 × 커튼·블라인드·커튼블라인드
  3 = 동·읍면 × 암막커튼·롤스크린·콤비블라인드
  4 = 동·읍면 × 커튼집·커튼설치·블라인드설치 (새 페이지)
  5 = (2026-11-16) 새 축 21단어 — 제품 6·공간 8·목적 7 × 동·읍면 696 + 시군구에 없던 17단어 × 129 (lib/axes.ts 가 조합)
      wave 32~38 = 2026-11-17 부터 7일 (날짜는 data/drip.json 의 extra), 사이트맵 기준 하루 약 2,290쪽. 월검색수는 조회 수단이 없어 비움
wave = 오픈일(D0)부터 며칠째에 여는지 + 1. 빌드는 OPEN_WAVE 이하만 (scripts/drip/drip_status.py 가 날짜로 계산)
  묶음 1~3 (5,982): 25·50·75·100% 를 D0·D3·D6·D9 에 → wave 1·4·7·10
  묶음 4 (2,088): D1~D30 하루 약 70개 → wave 2~31
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
DONG_W4 = ['커튼집', '커튼설치', '블라인드설치']
AXIS_W = ['우드블라인드', '버티컬블라인드', '전동커튼', '맞춤커튼', '쉬폰커튼', '형상기억커튼',
          '거실커튼', '안방커튼', '아이방커튼', '베란다블라인드', '주방블라인드', '욕실블라인드', '사무실블라인드', '상가블라인드',
          '단열커튼', '방한커튼', '사생활보호커튼', '햇빛차단커튼', '결로커튼', '입주커튼', '이사커튼']
AXIS_SGG_SKIP = {'우드블라인드', '버티컬블라인드', '전동커튼', '맞춤커튼'}   # 시군구에 이미 있음 → 동·읍면만
EXTRA_START, EXTRA_DAYS = '2026-11-17', 7

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
    elif word in DONG_W4:
        w = 4
    else:
        continue
    wave_of[kw] = w
    parent = (REG.get(region) or {}).get('parent') or parent or region
    picked.append(dict(no=no, kw=kw, slug=kw.replace(' ', '-'), word=word, region=region, level=level, sido=sido, parent=parent, stage=w))
picked.sort(key=lambda p: (p['stage'], p['no']))

# 오픈일 배정 (표기 변형의 대표 페이지는 순서상 항상 앞 → 같은 날이나 먼저 열린다)
old = [p for p in picked if p['stage'] <= 3]
new = [p for p in picked if p['stage'] == 4]
for i, p in enumerate(old):
    p['wave'] = 1 + 3 * (4 * i // len(old))
for i, p in enumerate(new):
    p['wave'] = 2 + 30 * i // len(new)

# 새 축(stage 5): 시군구 먼저(허브), 그다음 동·읍면. 표기 변형은 대표와 같은 날.
import datetime as _dt
no5 = max(p['no'] for p in picked)
sgg = [r for r in REG.values() if r['sido'] in SIDOS and r['level'] in ('시도', '시군', '구')]
dongs = [r for r in REG.values() if r['sido'] in SIDOS and r['level'] in ('동', '읍면')]
axis = []
for r in sgg:
    for w in AXIS_W:
        if w not in AXIS_SGG_SKIP: axis.append((r, w))
for r in dongs:
    for w in AXIS_W: axis.append((r, w))
for r, w in axis:
    no5 += 1
    picked.append(dict(no=no5, kw=f"{r['name']} {w}", slug=f"{r['name']} {w}".replace(' ', '-'), word=w, region=r['name'], level=r['level'], sido=r['sido'], parent=r.get('parent') or r['name'], stage=5))

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
# stage 5 wave: 사이트맵에 들어가는(변형 아닌) 페이지를 7일로 균등 분할, 변형은 대표의 날
mains5 = [p for p in picked if p['stage'] == 5 and 'variantOf' not in p]
slug_wave = {}
for i, p in enumerate(mains5):
    p['wave'] = 32 + EXTRA_DAYS * i // len(mains5); slug_wave[p['slug']] = p['wave']
for p in picked:
    if p['stage'] == 5 and 'variantOf' in p: p['wave'] = slug_wave[p['variantOf']]
EXTRA = [{'wave': 32 + i, 'date': (_dt.date.fromisoformat(EXTRA_START) + _dt.timedelta(i)).isoformat()} for i in range(EXTRA_DAYS)]
drip_path = os.path.join(ROOT, 'data', 'drip.json')
drip = json.load(open(drip_path, encoding='utf-8')); drip['extra'] = EXTRA
json.dump(drip, open(drip_path, 'w', encoding='utf-8', newline=chr(10)), ensure_ascii=False, indent=1)
day_of = {e['wave']: e['date'] for e in EXTRA}

json.dump({'pages': picked}, open(os.path.join(ROOT, 'data', 'site-pages.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)

# ---- 엑셀 ----
HEAD = PatternFill('solid', fgColor='23483D')
SEL = PatternFill('solid', fgColor='E3ECE8')
wb = Workbook()
c = Counter(p['stage'] for p in picked)
v = sum(1 for p in picked if 'variantOf' in p)
s1 = wb.active; s1.title = '선정 키워드'
s1.append(['순번', '키워드', '페이지 URL', '묶음', '오픈일(D+ 또는 날짜)', '단어', '지역', '지역 단위', '시도', '상위 지역', '대표 페이지(표기 변형)', '원본 No', '월검색수 PC', '월검색수 모바일'])
for cell in s1[1]: cell.font, cell.fill = Font(bold=True, color='FFFFFF'), HEAD
for i, p in enumerate(picked, 1):
    s1.append([i, p['kw'], f"/{p['slug']}/", p['stage'], day_of.get(p['wave'], p['wave'] - 1) if p['stage'] == 5 else p['wave'] - 1, p['word'], p['region'], p['level'], p['sido'], p['parent'], p.get('variantOf', ''), p['no'], None, None])
for col, w in zip('ABCDEFGHIJKLMN', [7, 28, 32, 7, 9, 13, 18, 9, 12, 12, 28, 9, 12, 14]): s1.column_dimensions[col].width = w
s1.freeze_panes = 'A2'; s1.auto_filter.ref = s1.dimensions

s2 = wb.create_sheet('전국 전체(선정 표시)')
s2.append(['No', '키워드', '단어', '구분', '지역', '지역 단위', '시도', '상위 지역', '서울경기 선정', '묶음'])
for cell in s2[1]: cell.font, cell.fill = Font(bold=True, color='FFFFFF'), HEAD
for r in allrows:
    w = wave_of.get(r[1])
    s2.append((list(r) + [None] * 8)[:8] + (['O', w] if w else ['', '']))
    if w:
        for cell in s2[s2.max_row]: cell.fill = SEL
for col, w in zip('ABCDEFGHIJ', [8, 30, 14, 7, 22, 9, 16, 12, 12, 9]): s2.column_dimensions[col].width = w
s2.freeze_panes = 'A2'; s2.auto_filter.ref = s2.dimensions

out = os.path.join(ROOT, 'keywords', '커튼블라인드_서울경기_8000.xlsx')
wb.save(out)
sys.stdout.reconfigure(encoding='utf-8')
print('합계', len(picked), '묶음', dict(sorted(c.items())), '표기 변형', v)
print('오픈일별', dict(sorted(Counter(p['wave'] - 1 for p in picked).items())))
print('새 축(stage 5) 단어별', dict(Counter(p['word'] for p in picked if p['stage'] == 5)))
print('새 축 날짜별(사이트맵 기준 / 전체)', {day_of[w]: (sum(1 for p in mains5 if p['wave'] == w), sum(1 for p in picked if p['stage'] == 5 and p['wave'] == w)) for w in sorted(day_of)})
print('->', out)
