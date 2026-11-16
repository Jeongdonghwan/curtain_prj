#!/usr/bin/env bash
# 빌드 결과(out/)만 deploy 브랜치로 올린다. 서버는 deploy 브랜치를 받아 nginx로 서빙.
#   bash scripts/deploy.sh <단계> <주소>   예) bash scripts/deploy.sh 38 https://curtainblind.co.kr
# 서버 갱신: cd /var/www/curtain && git fetch -q origin deploy && git reset -q --hard origin/deploy
# (2026-11-16) 2만 쪽(약 3GB)이 되면서 매번 전체를 새로 밀어 넣지 않고, deploy 브랜치를 blob 없이 받아 바뀐 파일만 올린다.
set -euo pipefail
WAVE=${1:?단계}; URL=${2:?주소}
cd "$(dirname "$0")/.."
rm -rf ./out
OPEN_WAVE=$WAVE SITE_URL=$URL npx next build
grep -q "$URL" out/sitemap.xml || { echo "sitemap에 주소가 없음"; exit 1; }
REMOTE=$(git remote get-url origin)
# deploy 브랜치를 파일 내용(blob) 없이 받는다 — 트리만 있으면 바뀐 파일을 가릴 수 있다. 처음이면 빈 저장소
rm -rf .deploy && mkdir .deploy
if git clone -q --depth 1 --filter=blob:none --no-checkout -b deploy "$REMOTE" .deploy 2>/dev/null; then
  git -C .deploy reset -q           # 인덱스만 HEAD 트리로 채운다 (작업 트리는 비어 있음)
  git -C .deploy show HEAD:.lastmod.json > out/.lastmod.json 2>/dev/null || true
else
  rm -rf .deploy && git init -q -b deploy .deploy
fi
# lastmod 상태(.lastmod.json)는 deploy 브랜치에 같이 실어 이어 쓴다 — GitHub Actions 는 매번 새 환경이라 로컬 파일이 없다
[ -f .lastmod.json ] && cp .lastmod.json out/.lastmod.json
python -I scripts/postbuild.py out out/.lastmod.json   # lastmod·sitemap split·llms.txt·.ops.json
cp out/.lastmod.json .lastmod.json
# out/ 을 .deploy 작업 트리로 옮기고 전부 add — 내용이 같은 파일은 인덱스와 해시가 같아 새 객체가 생기지 않는다
find out -mindepth 1 -maxdepth 1 -exec mv -t .deploy {} +
cd .deploy
git add -A
NAME=$(git -C .. config user.name || echo deploy-bot); MAIL=$(git -C .. config user.email || echo deploy-bot@users.noreply.github.com)
if git -c user.name="$NAME" -c user.email="$MAIL" commit -q -m "deploy: ${WAVE}단계 $URL $(date +%F)"; then
  git push -q "$REMOTE" deploy
else
  echo "바뀐 파일 없음 — 푸시 생략"
fi
echo "deploy 브랜치 갱신 완료: ${WAVE}단계, $(find . -name '*.html' -not -path './.git/*' | wc -l) html, $(du -sh --exclude=.git . | cut -f1), 이번에 바뀐 파일 $(git diff --stat HEAD~1 2>/dev/null | tail -1 || echo '(첫 배포)')"
cd .. && rm -rf .deploy out
