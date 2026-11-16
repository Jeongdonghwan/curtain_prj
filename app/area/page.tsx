import type { Metadata } from 'next';
import Link from 'next/link';
import { OPEN_PAGES, pagePath, pageEncodedPath } from '../../lib/data';
import { pageListJsonLd } from '../../lib/jsonld';
import { BRAND } from '../../lib/site';
import { JsonLd } from '../../components/Common';

export const metadata: Metadata = {
  title: `서울·경기 지역별 커튼·블라인드 | ${BRAND}`,
  description: '서울·경기 시·군·구와 동네별 커튼·암막커튼·블라인드·롤스크린 안내 페이지 모음. 시·군·구 페이지에서 동네별 표로 이어집니다.',
  alternates: { canonical: '/area/' },
};

// 크롤 경로: /area/ → 시군구 단어 페이지 → (동네별 표) 동 페이지. 동 페이지까지 다 넣으면 2만 링크라 시군구 단계만 싣는다 (2026-11-16)
export default function AreaIndex() {
  const all = OPEN_PAGES.filter((p) => !p.variantOf);
  const pages = all.filter((p) => p.level !== '동' && p.level !== '읍면');
  const dongCount = all.length - pages.length;
  const groups = new Map<string, typeof pages>();
  for (const p of pages) {
    const key = `${p.sido === '서울특별시' ? '서울' : '경기'}|${p.region}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(p);
  }
  return (
    <main>
      <div className="wrap content page-top">
        <JsonLd data={pageListJsonLd('서울·경기 지역별 커튼·블라인드', pages.slice(0, 500).map((x) => ({ name: x.kw, path: pageEncodedPath(x) })))} />
        <p className="hero-label dark">AREA</p>
        <h1 className="page-title">서울·경기 지역별 안내</h1>
        <p className="prose-p">{BRAND} 커튼·블라인드 지역 안내 페이지입니다. 시·군·구 페이지 {pages.length.toLocaleString()}개{dongCount ? `와 동·읍면 페이지 ${dongCount.toLocaleString()}개` : ''}가 열려 있고, 동네별 안내는 각 시·군·구 페이지의 동네별 표에서 이어집니다.</p>
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
