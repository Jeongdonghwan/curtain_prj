#!/usr/bin/env bash
# 빌드 결과(out/)만 deploy 브랜치로 올린다. 서버는 deploy 브랜치를 받아 nginx로 서빙.
#   bash scripts/deploy.sh <단계 1~3> <주소>   예) bash scripts/deploy.sh 3 http://172.237.20.244:8101
# 서버 갱신: cd /var/www/curtain && git fetch -q origin deploy && git reset -q --hard origin/deploy
set -euo pipefail
WAVE=${1:?단계(1~3)}; URL=${2:?주소}
cd "$(dirname "$0")/.."
rm -rf ./out
OPEN_WAVE=$WAVE SITE_URL=$URL npx next build
grep -q "$URL" out/sitemap.xml || { echo "sitemap에 주소가 없음"; exit 1; }
REMOTE=$(git remote get-url origin)
# lastmod 상태(.lastmod.json)는 deploy 브랜치에 같이 실어 이어 쓴다 — GitHub Actions 는 매번 새 환경이라 로컬 파일이 없다
if [ -f .lastmod.json ]; then cp .lastmod.json out/.lastmod.json
elif git fetch -q "$REMOTE" deploy 2>/dev/null; then git show FETCH_HEAD:.lastmod.json > out/.lastmod.json 2>/dev/null || rm -f out/.lastmod.json; fi
python -I scripts/postbuild.py out out/.lastmod.json   # lastmod·sitemap split·llms.txt
cp out/.lastmod.json .lastmod.json
cd out
git init -q -b deploy && git add -A
git -c user.name="$(git -C .. config user.name || echo deploy-bot)" -c user.email="$(git -C .. config user.email || echo deploy-bot@users.noreply.github.com)" commit -q -m "deploy: ${WAVE}단계 $URL $(date +%F)"
git push -q -f "$REMOTE" deploy
rm -rf ./.git
echo "deploy 브랜치 갱신 완료: ${WAVE}단계, $(find . -name '*.html' | wc -l) html, $(du -sh . | cut -f1)"
