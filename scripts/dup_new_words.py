"""새 축(stage 5) 페이지 유사도 — 두 축으로 잰다 (2026-11-16, 3부 보고용. 통과 조건이 아니라 측정값).

  python -I scripts/dup_new_words.py [out 폴더]

  1. 같은 지역의 축 간: 한 지역 안 새 단어 페이지끼리 + 새 단어 ↔ 기존 9단어 페이지. 같은 문장 비율(교집합 ÷ 작은 쪽).
  2. 같은 단어의 지역 간: 새 단어 하나를 여러 지역에서 비교.
빌드에 있는 페이지만 잰다 (SAMPLE_REGIONS 표본 빌드면 그 지역들).
"""
import collections, html, itertools, json, os, random, re, statistics, sys
sys.stdout.reconfigure(encoding='utf-8')
OUT = sys.argv[1] if len(sys.argv) > 1 else 'out'
P = [p for p in json.load(open('data/site-pages.json', encoding='utf-8'))['pages'] if not p.get('variantOf')]
have = {p['slug']: p for p in P if os.path.exists(os.path.join(OUT, p['slug'], 'index.html'))}
cache = {}


def sents(slug):
    if slug in cache: return cache[slug]
    s = open(os.path.join(OUT, slug, 'index.html'), encoding='utf-8').read()
    m = re.search(r'<main[^>]*>(.*?)</main>', s, re.S); s = m.group(1) if m else s
    s = re.sub(r'<script.*?</script>', '', s, flags=re.S); t = html.unescape(re.sub(r'<[^>]+>', '\n', s))
    cache[slug] = {x.strip() for x in re.split(r'[\n.!?]', t) if len(x.strip()) >= 12}
    return cache[slug]


def ratio(a, b):
    A, B = sents(a), sents(b); return len(A & B) / max(1, min(len(A), len(B)))


by_region = collections.defaultdict(list)
for p in have.values(): by_region[p['region']].append(p)
new_in = {r: [p for p in ps if p['stage'] == 5] for r, ps in by_region.items()}
regions = [r for r, ps in new_in.items() if len(ps) >= 2]
random.seed(7); regions = random.sample(regions, min(30, len(regions)))
nn, no = [], []
pair_w = collections.defaultdict(list)
for r in regions:
    news = new_in[r]; olds = [p for p in by_region[r] if p['stage'] != 5]
    for a, b in itertools.combinations(news, 2):
        v = ratio(a['slug'], b['slug']); nn.append(v); pair_w[tuple(sorted([a['word'], b['word']]))].append(v)
    for a in news:
        for b in olds: no.append(ratio(a['slug'], b['slug']))
lens = [len(''.join(sents(p['slug'])).replace(' ', '')) for r in regions for p in new_in[r]]
f = lambda v: f'평균 {statistics.mean(v):.0%} 중앙값 {statistics.median(v):.0%} 최대 {max(v):.0%} 50%초과 {sum(x > 0.5 for x in v)}/{len(v)}' if v else '표본 없음'
print(f'지역 {len(regions)}곳 · 새 축 페이지 본문 평균 {statistics.mean(lens):.0f}자 (최소 {min(lens)})')
print('1a. 같은 지역, 새 단어끼리:', f(nn))
print('1b. 같은 지역, 새 단어 ↔ 기존 9단어:', f(no))
for k, v in sorted(pair_w.items(), key=lambda x: -statistics.mean(x[1]))[:8]: print(f'   {statistics.mean(v):.0%}  {k[0]} ↔ {k[1]} (n={len(v)})')

by_word = collections.defaultdict(list)
for p in have.values():
    if p['stage'] == 5: by_word[p['word']].append(p)
ww = []; per = {}
for w, ps in by_word.items():
    if len(ps) < 2: continue
    vs = [ratio(a['slug'], b['slug']) for a, b in itertools.combinations(random.sample(ps, min(12, len(ps))), 2)]
    per[w] = statistics.mean(vs); ww += vs
print('2. 같은 단어, 지역 간:', f(ww))
for w, v in sorted(per.items(), key=lambda x: -x[1]): print(f'   {v:.0%}  {w}')
