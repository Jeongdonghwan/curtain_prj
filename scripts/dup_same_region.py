"""같은 지역의 다른 키워드 페이지끼리 같은 문장 비율 (dup_check.py 가 못 재던 축 — 2026-11-16 추가)

  python -I scripts/dup_same_region.py [out 폴더]
지역 40곳 표본, 지역 안 모든 키워드 쌍. 기준: 평균 30% 이하. 2026-11-16 보강 전 44%(최대 94%) → 보강 뒤 24%(최대 56%).
"""
import json,re,os,sys,random,html,collections,statistics,itertools
sys.stdout.reconfigure(encoding='utf-8')
OUT=sys.argv[1] if len(sys.argv)>1 else 'out'
ps=[p for p in json.load(open('data/site-pages.json',encoding='utf-8'))['pages'] if not p.get('variantOf')]
by=collections.defaultdict(list)
for p in ps: by[(p['region'],p['level'])].append(p)
def text(slug):
    f=os.path.join(OUT,slug,'index.html')
    if not os.path.exists(f): return None
    s=open(f,encoding='utf-8').read()
    m=re.search(r'<main[^>]*>(.*?)</main>',s,re.S); s=m.group(1) if m else s
    s=re.sub(r'<script.*?</script>','',s,flags=re.S); t=html.unescape(re.sub(r'<[^>]+>','\n',s))
    return [x.strip() for x in re.split(r'[\n.!?]',t) if len(x.strip())>=12]
random.seed(7); groups=[g for g in by.values() if len(g)>=3 and all(os.path.exists(os.path.join(OUT,p['slug'],'index.html')) for p in g)]; smp=random.sample(groups,min(40,len(groups))); print('측정 가능한 지역 묶음',len(groups))
pw=collections.defaultdict(list); allr=[]; lens=[]
for g in smp:
    T={p['slug']:text(p['slug']) for p in g}
    if any(v is None for v in T.values()): continue
    for p in g: lens.append(len(''.join(T[p['slug']]).replace(' ','')))
    for a,b in itertools.combinations(g,2):
        A,B=set(T[a['slug']]),set(T[b['slug']]); r=len(A&B)/max(1,min(len(A),len(B)))
        pw[tuple(sorted([a['word'],b['word']]))].append(r); allr.append(r)
print(f'쌍 {len(allr)}  평균 {statistics.mean(allr):.0%}  중앙값 {statistics.median(allr):.0%}  최대 {max(allr):.0%}  50%초과 {sum(r>0.5 for r in allr)}  본문평균 {statistics.mean(lens):.0f}자')
for k,v in sorted(pw.items(),key=lambda x:-statistics.mean(x[1]))[:40]: print(f'  {statistics.mean(v):.0%}  {k[0]} ↔ {k[1]}  (n={len(v)})')
