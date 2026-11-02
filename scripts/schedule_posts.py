"""커튼 가이드 글 공개일 배정 — 오픈일이 정해지면 한 번 실행.
  python -I scripts/schedule_posts.py 2026-11-10            # content/blog/*.md (파일 이름순) 에 하루 1·2편 번갈아 date 를 쓴다
  python -I scripts/schedule_posts.py 2026-11-10 --dry      # 바꾸지 않고 표만
post-launch 기준: 30일 · 하루 1.5편(1·2편 번갈아) = 45편. 공개일이 지난 글만 사이트에 보인다(lib/blog.ts).
"""
import datetime, glob, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def dates(launch, n):
    d, out, k = datetime.date.fromisoformat(launch), [], 0
    while len(out) < n:
        out += [d.isoformat()] * (1 if k % 2 == 0 else 2)
        d += datetime.timedelta(days=1); k += 1
    return out[:n]


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    if len(sys.argv) < 2:  # 자체 검사
        ds = dates('2026-11-10', 45)
        assert ds[0] == '2026-11-10' and ds[1] == ds[2] == '2026-11-11' and len(set(ds)) == 30, ds
        print('자체 검사 통과: 45편 → 30일'); return
    files = sorted(f for f in glob.glob(os.path.join(ROOT, 'content', 'blog', '*.md')) if not os.path.basename(f).startswith('_'))
    for f, d in zip(files, dates(sys.argv[1], len(files))):
        print(d, os.path.basename(f))
        if '--dry' not in sys.argv:
            s = open(f, encoding='utf-8').read()
            open(f, 'w', encoding='utf-8').write(re.sub(r'^date:.*$', f'date: {d}', s, count=1, flags=re.M))


if __name__ == '__main__':
    main()
