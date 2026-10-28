"""동·읍면 페이지별 고유 사실 → data/dong-apts.json (단지 + 주민등록 세대)

출처: K-apt 공동주택관리정보시스템 '단지 기본정보'(data/raw/kapt_basic_20261026.xlsx,
      k-apt.go.kr 자료실 > 기본정보, 2026.10.26 추출). 단지명·법정동·사용승인일·세대수·복도유형·최고층수만 쓴다.
페이지의 동 이름은 행정동이고 K-apt는 법정동이라 이름으로 맞춘다:
  같은 이름 / '○○로동'·'○○동' → '○○로1가'·'○○1동' 같은 번호 법정동 / '청운효자동' → 청운동+효자동.
  못 맞춘 동(교남동처럼 법정동 이름이 전혀 다른 곳)은 빈 값으로 두고 조합기가 다른 문장을 쓴다.
세대: 행정안전부 '지역별(행정동) 세대원수별 주민등록 세대수' 2026.09.30 (data/raw/mois_households_20260930.csv,
      data.go.kr/data/15097974). 행정동 이름이라 696곳 거의 다 맞는다 — 창신동 = 창신제1·2·3동 합계.

  python -I scripts/build_dong_apts.py
"""
import csv, json, os, re, sys
from collections import Counter
import openpyxl

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'data', 'raw', 'kapt_basic_20261026.xlsx')
HH_SRC = os.path.join(ROOT, 'data', 'raw', 'mois_households_20260930.csv')
OUT = os.path.join(ROOT, 'data', 'dong-apts.json')


def load():
    ws = openpyxl.load_workbook(SRC, read_only=True)['sheet1']
    ws.reset_dimensions()  # 이 파일은 dimension 정보가 1행으로 잘못 박혀 있다
    it = ws.iter_rows(values_only=True)
    next(it)  # 안내 문구
    head = next(it)
    return [r for r in (dict(zip(head, x)) for x in it) if r['시도'] in ('서울특별시', '경기도') and r['단지명']]


def num(v):
    try: return int(float(v))
    except (TypeError, ValueError): return 0


def bases(name):  # 면목본동 → 면목동 먼저, 산본동처럼 '본'이 이름 일부면 산본으로
    b = name[:-1] if name.endswith('동') else name
    return [b[:-1], b] if b.endswith('본') and len(b) >= 3 else [b]


def match(rows, name, level):
    if level == '읍면':
        return [r for r in rows if r['읍면'] == name]
    def hit(b):  # 사직 → 사직동 / 금호 → 금호동1가 / 한강로 → 한강로1가 / 여의 → 여의도동
        return [r for r in rows if not r['읍면'] and (r['동리'] or '').startswith(b)
                and re.fullmatch(r'도?동?(\d+(가|동)?)?', r['동리'][len(b):])]
    got = []
    for base in bases(name):
        got = got or hit(base)
    if not got and len(base) >= 4:  # 청운효자동 → 청운 + 효자
        got = [r for i in range(0, len(base), 2) for r in hit(base[i:i + 2])]
    return got


def households():
    rows = [r for r in csv.DictReader(open(HH_SRC, encoding='cp949')) if r['시도명'] in ('서울특별시', '경기도') and r['읍면동명']]
    for r in rows:
        r['n'] = [int(r[k]) for k in ('전체세대수', '1인세대', '2인세대', '3인세대', '4인세대')]
    return rows


def hh_match(rows, name):
    exact = [r for r in rows if r['읍면동명'] == name]
    if exact: return exact
    for base in bases(name):  # 창신 → 창신제1동 / 종로 → 종로1.2.3.4가동 / 성수 → 성수1가제1동
        got = [r for r in rows if r['읍면동명'].startswith(base) and re.fullmatch(r'제?[\d.·]+가?(제?\d+)?동', r['읍면동명'][len(base):])]
        if got: return got
    return []


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    allrows = load()
    pages = json.load(open(os.path.join(ROOT, 'data', 'site-pages.json'), encoding='utf-8'))['pages']
    dongs = {}
    for p in pages:
        if p['level'] in ('동', '읍면'):
            dongs[p['region']] = p
    hhrows = households()
    out, miss, hmiss = {}, [], []
    for region, p in dongs.items():
        name = region.split(' ')[-1]
        par = p['parent'].replace('경기 ', '')
        rows = [r for r in allrows if r['시도'] == p['sido'] and (par == '서울' or r['시군구'].startswith(par))]
        hrows = [r for r in hhrows if r['시도명'] == p['sido'] and (par == '서울' and r['시군구명'] == '중구' or r['시군구명'].startswith(par))]
        h = hh_match(hrows, name)
        item = {}
        if h:
            t = [sum(r['n'][i] for r in h) for i in range(5)]
            g = [sum(r['n'][i] for r in hrows) for i in range(5)]
            item['hh'] = {'total': t[0], 'one': round(t[1] / t[0] * 100), 'two': round(t[2] / t[0] * 100),
                          'family': round((t[3] + t[4]) / t[0] * 100), 'guOne': round(g[1] / g[0] * 100), 'guName': '중구' if par == '서울' else h[0]['시군구명'].split(' ')[0], 'units': [r['읍면동명'] for r in h]}
        else:
            hmiss.append(region)
        got = match(rows, name, p['level'])
        if not got:
            miss.append(region)
            if item: out[region] = item
            continue
        got.sort(key=lambda r: -num(r['세대수']))
        years = [int(r['사용승인일'][:4]) for r in got if r['사용승인일'] and r['사용승인일'][:4].isdigit()]
        hall = Counter(r['복도유형'] for r in got if r['복도유형'])
        out[region] = {
            **item,
            'gu': got[0]['시군구'],
            'legal': sorted({r['동리'] or r['읍면'] for r in got}),
            'count': len(got),
            'households': sum(num(r['세대수']) for r in got),
            'oldest': min(years) if years else None,
            'newest': max(years) if years else None,
            'since2010': sum(y >= 2010 for y in years),
            'before2000': sum(y < 2000 for y in years),
            'hall': dict(hall),
            'mixed': sum(r['단지분류'].startswith('주상복합') or r['단지분류'] == '도시형 생활주택(주상복합)' for r in got),
            'maxFloor': max((num(r['최고층수']) for r in got), default=0),
            'complexes': [{'name': r['단지명'], 'year': int(r['사용승인일'][:4]) if r['사용승인일'] and r['사용승인일'][:4].isdigit() else None,
                           'hh': num(r['세대수']), 'hall': r['복도유형'] or '', 'floor': num(r['최고층수']), 'legal': r['동리'] or r['읍면']}
                          for r in got[:8]],
        }
    json.dump({'_source': 'K-apt 공동주택관리정보시스템 단지 기본정보 2026.10.26 추출 (k-apt.go.kr 자료실)', 'dongs': out},
              open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
    print(f'동·읍면 {len(dongs)}곳 중 단지 매칭 {len(dongs) - len(miss)}곳, 못 맞춤 {len(miss)}곳')
    print('못 맞춤:', ' '.join(miss))
    print(f'세대 매칭 {len(dongs) - len(hmiss)}곳, 못 맞춤 {len(hmiss)}곳:', ' '.join(hmiss))


if __name__ == '__main__':
    main()
