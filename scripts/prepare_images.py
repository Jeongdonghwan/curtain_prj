"""curtainmaster.co.kr 에서 받은 사진 → public/images/*.webp

  python -I scripts/prepare_images.py <다운로드 폴더(raw/·urls.txt 가 있는 곳)>

- 시공 전후 6쌍: section13_a1~f2 → ba-a-before / ba-a-after …
- 상품 17개: data/products.json 의 src 번호 → p-<상품id>
- 시공 사례 썸네일(230px, 실제 현장): case-NN
- 공간 연출(section09·10), 상담 배경(section24), 로고
"""
import json, os, re, sys
from PIL import Image

SRC = sys.argv[1]
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'public', 'images')
os.makedirs(OUT, exist_ok=True)
urls = open(os.path.join(SRC, 'urls.txt')).read().split()
raw = {f[:3]: os.path.join(SRC, 'raw', f) for f in os.listdir(os.path.join(SRC, 'raw'))}


def save(idx, name, width, q=80):
    im = Image.open(raw[idx]).convert('RGB')
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    im.save(os.path.join(OUT, f'{name}.webp'), 'WEBP', quality=q, method=6)


n = 0
for i, u in enumerate(urls, 1):
    idx = f'{i:03d}'
    fn = u.split('/')[-1]
    m = re.match(r'section13_([a-f])([12])\.png', fn)
    if m:
        save(idx, f"ba-{m.group(1)}-{'before' if m.group(2) == '1' else 'after'}", 1200, 78); n += 1
    elif re.match(r'section09_best_0(\d)', fn):
        save(idx, f"best-{fn[-5]}", 900); n += 1
    elif re.match(r'section10_space_0(\d)', fn):
        save(idx, f"space-{fn[-5]}", 900); n += 1
    elif fn.startswith('section24_expert_bg'):
        save(idx, 'expert-bg', 1600); n += 1
    elif fn == '1759052963.png':
        save(idx, 'logo-large', 800); n += 1
    elif '_230x230' in fn and 8 <= i <= 58 and i != 45:  # 45 = 교회 외관(커튼 없음)
        save(idx, f'case-{i:02d}', 460, 82); n += 1

for p in json.load(open(os.path.join(ROOT, 'data', 'products.json'), encoding='utf-8'))['products']:
    save(p['src'], p['img'], 600, 82); n += 1
print('saved', n, '->', OUT)
