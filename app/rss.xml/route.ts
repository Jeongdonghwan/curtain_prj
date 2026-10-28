// RSS 2.0 — 열린 페이지(사이트맵과 같은 기준). 서치어드바이저 RSS 제출용
import { OPEN_PAGES, pageEncodedPath, inSitemap } from '../../lib/data';
import { compose } from '../../lib/compose';
import { SITE_URL, BRAND } from '../../lib/site';

export const dynamic = 'force-static';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function GET() {
  const date = new Date().toUTCString();
  const items = OPEN_PAGES.filter(inSitemap).map((p) => {
    const c = compose(p);
    const url = `${SITE_URL}${pageEncodedPath(p)}`;
    return `<item><title>${esc(c.title)}</title><link>${url}</link><description>${esc(c.description)}</description><pubDate>${date}</pubDate><guid isPermaLink="true">${url}</guid></item>`;
  });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>${esc(BRAND)} 서울·경기 커튼·블라인드</title><link>${SITE_URL}/</link><description>${esc(BRAND)} 지역별 커튼·암막커튼·블라인드 안내</description><language>ko</language><lastBuildDate>${date}</lastBuildDate>
${items.join('\n')}
</channel></rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
