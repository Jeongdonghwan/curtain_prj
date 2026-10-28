import type { Metadata } from 'next';
import Link from 'next/link';
import { OPEN_PAGES, pagePath, pageEncodedPath } from '../../lib/data';
import { pageListJsonLd } from '../../lib/jsonld';
import { BRAND } from '../../lib/site';
import { JsonLd, OfficialLinks } from '../../components/Common';

export const metadata: Metadata = {
  title: `서울·경기 지역별 커튼·블라인드 | ${BRAND}`,
  description: '서울·경기 지역별 커튼·암막커튼·블라인드·롤스크린 안내 페이지 모음.',
  alternates: { canonical: '/area/' },
};

// 열린 모든 키워드 페이지로 가는 크롤 경로 (시도 → 상위 지역)
export default function AreaIndex() {
  const pages = OPEN_PAGES.filter((p) => !p.variantOf);
  const groups = new Map<string, typeof pages>();
  for (const p of pages) {
    const key = `${p.sido === '서울특별시' ? '서울' : '경기'}|${p.level === '동' || p.level === '읍면' ? p.parent : p.region}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(p);
  }
  return (
    <main>
      <div className="wrap content page-top">
        <JsonLd data={pageListJsonLd('서울·경기 지역별 커튼·블라인드', pages.map((x) => ({ name: x.kw, path: pageEncodedPath(x) })))} />
        <p className="hero-label dark">AREA</p>
        <h1 className="page-title">서울·경기 지역별 안내</h1>
        <p className="prose-p">{BRAND} 커튼·블라인드 지역 안내 페이지입니다. 지금 {pages.length.toLocaleString()}개가 열려 있습니다.</p>
        <OfficialLinks />
        {['서울', '경기'].map((sd) => (
          <section key={sd} className="sec">
            <h2 className="area-h">{sd}</h2>
            {Array.from(groups.entries()).filter(([k]) => k.startsWith(sd + '|')).map(([k, list]) => (
              <div key={k} className="area-block" data-reveal>
                <h3>{k.split('|')[1]}</h3>
                <ul className="area-list">{list.map((p) => <li key={p.slug}><Link href={pagePath(p)}>{p.kw}</Link></li>)}</ul>
              </div>
            ))}
          </section>
        ))}
      </div>
    </main>
  );
}
