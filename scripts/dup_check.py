"""색인 지표 — 빌드된 out/ 에서 본문 글자 수와 '똑같은 문장 비율'을 잰다.

  python -I scripts/dup_check.py            # out/ 기준
똑같은 문장 비율 = A 페이지 문장 중 B 페이지에도 그대로 있는 문장의 비율.
  · 대표 표본: 1단계 시군구 페이지 40개를 무작위 쌍으로
  · 같은 구 안 동 페이지끼리: 같은 상위 지역·같은 단어의 동 페이지 쌍 (2·3단계 오픈 기준 30% 이하)
"""
import json, os, random, re, sys
from itertools import combinations

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'out')
sys.path.insert(0, os.path.expanduser('~/.claude/skills/programmatic-seo/scripts'))
from pseo_lint import text_of  # 같은 본문 추출 규칙(nav·header·footer 제외)


def sentences(t):
    return {s.strip() for s in re.split(r'(?<=[.?!다요])\s+', t) if len(s.strip()) >= 12}


def load(slug):
    f = os.path.join(OUT, slug, 'index.html')
    return text_of(open(f, encoding='utf-8').read()) if os.path.exists(f) else None


def ratio(a, b):
    return len(a & b) / len(a) if a else 0


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    random.seed(7)
    pages = json.load(open(os.path.join(ROOT, 'data', 'site-pages.json'), encoding='utf-8'))['pages']
    pages = [p for p in pages if not p.get('variantOf')]

    top = random.sample([p for p in pages if p['level'] not in ('동', '읍면')], 40)
    texts = {p['slug']: load(p['slug']) for p in top}
    n = [len(re.sub(r'\s', '', t)) for t in texts.values() if t]
    print(f'대표 표본 {len(n)}개 — 본문 평균 {sum(n) // len(n):,}자 · 최소 {min(n):,}자')
    S = {k: sentences(t) for k, t in texts.items() if t}
    r = [ratio(S[a], S[b]) for a, b in combinations(S, 2)]
    print(f'  똑같은 문장 비율 평균 {sum(r) / len(r):.0%} · 최대 {max(r):.0%}')

    dong = [p for p in pages if p['level'] in ('동', '읍면')]
    groups = {}
    for p in dong:
        groups.setdefault((p['parent'], p['word']), []).append(p)
    keys = random.sample(sorted(groups), 60)
    rs, worst, lens = [], (0, ''), []
    for k in keys:
        g = random.sample(groups[k], min(5, len(groups[k])))
        T = {p['region']: load(p['slug']) for p in g}
        T = {a: t for a, t in T.items() if t}
        lens += [len(re.sub(r'\s', '', t)) for t in T.values()]
        S = {a: sentences(t) for a, t in T.items()}
        for a, b in combinations(S, 2):
            x = ratio(S[a], S[b])
            rs.append(x)
            if x > worst[0]: worst = (x, f'{k[1]}: {a} vs {b}')
    print(f'같은 구 안 동 페이지 {len(rs)}쌍 — 똑같은 문장 비율 평균 {sum(rs) / len(rs):.0%} · 최대 {worst[0]:.0%} ({worst[1]})')
    print(f'  동 페이지 본문 평균 {sum(lens) // len(lens):,}자 · 최소 {min(lens):,}자')


if __name__ == '__main__':
    main()
