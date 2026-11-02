import type { Metadata } from 'next';
import Link from 'next/link';
import { getPosts, postPath, postEncPath, postImage } from '../../lib/blog';
import { BRAND } from '../../lib/site';
import { pageListJsonLd } from '../../lib/jsonld';
import { IconArrow, JsonLd, OfficialLinks } from '../../components/Common';

export const metadata: Metadata = {
  title: `커튼 가이드 | 커튼·블라인드 고르는 법과 실측 · ${BRAND}`,
  description: `${BRAND}가 정리한 커튼·블라인드 가이드. 실측하는 법, 원단 고르는 법, 레일·설치, 세탁과 관리처럼 맞춤 주문 전에 자주 묻는 것들.`,
  alternates: { canonical: '/blog/' },
  openGraph: { url: '/blog/', images: ['/images/ba-a-after.webp'] },
};

export default function Blog() {
  const posts = getPosts();
  return (
    <main>
      <div className="wrap content page-top">
        <JsonLd data={pageListJsonLd(`${BRAND} 커튼 가이드`, posts.map((p) => ({ name: p.title, path: postEncPath(p) })))} />
        <p className="hero-label dark">GUIDE</p>
        <h1 className="page-title">커튼 가이드</h1>
        <p className="prose-p">맞춤 커튼·블라인드를 주문하기 전에 자주 묻는 것들을 {BRAND}가 정리했습니다.</p>
        <ul className="post-list">
          {posts.map((p) => (
            <li key={p.slug} data-reveal>
              <Link href={postPath(p)}>
                <img src={postImage(p)} alt={p.keyword} loading="lazy" />
                <span><small>{p.date.replace(/-/g, '.')}</small><b>{p.title}</b><em>{p.description}</em></span>
                <IconArrow />
              </Link>
            </li>
          ))}
        </ul>
        <OfficialLinks />
      </div>
    </main>
  );
}
