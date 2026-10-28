"""전국 행정동 geojson(vuski/admdongkor) → data/regions-kr.json (검색용 지역명으로 정규화)

  python -I scripts/build_regions.py <HangJeongDong_verYYYYMMDD.geojson>

정규화 규칙
- 시도: 약칭(서울·경기·전남 …). 통합특별시는 구성 지역 약칭 둘 다.
- 시군구: '고양시덕양구' → 시 '고양'과 구 '덕양구'로 분리. 구 약칭('강남')은 전국에서 유일할 때만.
- 동: '역삼1동'·'성수2가1동'처럼 번호 붙은 행정동은 사람이 검색하는 '역삼동'·'성수동'으로 합친다.
  '원효로1동'처럼 '로'로 끝나면 '원효로'.
- 같은 이름이 전국에 둘 이상이거나 읍·면이면 시군구 약칭을 붙인다('부산 중앙동', '가평 청평면').
"""
import json, os, re, sys
from collections import Counter, defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SIDO_SHORT = {'서울특별시': ['서울'], '부산광역시': ['부산'], '대구광역시': ['대구'], '인천광역시': ['인천'], '대전광역시': ['대전'],
              '울산광역시': ['울산'], '세종특별자치시': ['세종'], '경기도': ['경기'], '강원특별자치도': ['강원'], '충청북도': ['충북'],
              '충청남도': ['충남'], '전북특별자치도': ['전북'], '전남광주통합특별시': ['광주', '전남'], '경상북도': ['경북'],
              '경상남도': ['경남'], '제주특별자치도': ['제주'], '광주광역시': ['광주'], '전라남도': ['전남']}


def dong_names(raw):
    """'역삼1동'→[역삼동], '종로1·2·3·4가동'→[종로], '화수1·화평동'→[화수동, 화평동], '용담·명암·산성동'→[용담동, 명암동, 산성동]"""
    if not re.search(r'[\d·,.]', raw):
        return [raw]
    out = []
    for part in re.split(r'[·,.]', raw[:-1]):  # 끝의 '동'을 떼고 가운뎃점·쉼표로 분리
        base = re.sub(r'\d+(가\d*)?$', '', part.strip())
        if base:
            out.append(base if base.endswith('로') else base + '동')
    return list(dict.fromkeys(out))


def short(name):
    return re.sub(r'(특별자치시|시|군|구)$', '', name)


feats = [f['properties'] for f in json.load(open(sys.argv[1], encoding='utf-8'))['features']]
unknown = {p['sidonm'] for p in feats} - set(SIDO_SHORT)
assert not unknown, f'시도 약칭 매핑 없음: {unknown}'

# 시군구 단위: (sido, city, gu)
rows = []
for p in feats:
    sgg = p['sggnm'] or p['sidonm']
    m = re.match(r'^(.+?시)(.+구)$', sgg)
    city, gu = (m.group(1), m.group(2)) if m else ((sgg, None) if not sgg.endswith('구') else (None, sgg))
    rows.append(dict(sido=p['sidonm'], city=city, gu=gu, raw=p['adm_nm'].split()[-1], code=p['adm_cd2']))

# 시 약칭 충돌(강원·경남 고성, 경기 광주 vs 광주) → 시도 약칭 접두
city_sido = {(r['sido'], r['city']) for r in rows if r['city'] and r['city'] != r['sido']}
city_short_n = Counter(short(c) for _, c in city_sido)
sido_shorts = {s for v in SIDO_SHORT.values() for s in v}


def cshort(sido, city):
    s = short(city)
    if s in SIDO_SHORT[sido]:  # 제주시·세종시: 시도와 같은 이름이면 정식 명칭
        return city
    return f'{SIDO_SHORT[sido][-1]} {s}' if city_short_n[s] > 1 or s in sido_shorts else s


gu_count = Counter((r['gu']) for r in {(r['sido'], r['city'], r['gu']): r for r in rows if r['gu']}.values())
gu_short_count = Counter(short(g) for g in gu_count)

regions = []  # {name, level, sido, parent}
seen = set()


def add(name, level, sido, parent):
    if name and name not in seen:
        seen.add(name)
        regions.append(dict(name=name, level=level, sido=sido, parent=parent))


for sido in dict.fromkeys(r['sido'] for r in rows):
    for s in SIDO_SHORT[sido]:
        add(s, '시도', sido, '')
for r in rows:
    sd = SIDO_SHORT[r['sido']][0]
    if r['city'] and r['city'] != r['sido']:
        add(cshort(r['sido'], r['city']), '시군', r['sido'], sd)
    if r['gu']:
        city_s = cshort(r['sido'], r['city']) if r['city'] else sd
        dup = gu_count[r['gu']] > 1
        add(f'{city_s} {r["gu"]}' if dup else r['gu'], '구', r['sido'], city_s)
        gs = short(r['gu'])
        if not dup and len(gs) >= 2 and gu_short_count[gs] == 1:
            add(gs, '구', r['sido'], city_s)

# 동·읍·면
dongs = defaultdict(set)  # 정규화 동명 → {상위 약칭}
meta = {}
for r in rows:
    gs = short(r['gu']) if r['gu'] else ''
    if r['gu'] and not r['city']:  # 광역시 자치구: 유일한 두 글자 이상 약칭이면 구 약칭, 아니면 시도 약칭
        parent = gs if len(gs) >= 2 and gu_short_count[gs] == 1 else SIDO_SHORT[r['sido']][0]
    elif r['city'] and r['city'] != r['sido']:
        parent = cshort(r['sido'], r['city'])
    else:
        parent = SIDO_SHORT[r['sido']][0]
    for n in dong_names(r['raw']):
        dongs[n].add(parent)
        meta[(n, parent)] = r
for n, parents in dongs.items():
    for parent in sorted(parents):
        r = meta[(n, parent)]
        prefix = len(parents) > 1 or n.endswith(('읍', '면')) or n in seen
        level = '읍면' if n.endswith(('읍', '면')) else '동'
        add(f'{parent} {n}' if prefix else n, level, r['sido'], parent)

os.makedirs(os.path.join(ROOT, 'data'), exist_ok=True)
json.dump({'source': os.path.basename(sys.argv[1]), 'regions': regions},
          open(os.path.join(ROOT, 'data', 'regions-kr.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
sys.stdout.reconfigure(encoding='utf-8')
print(Counter(r['level'] for r in regions), len(regions))
