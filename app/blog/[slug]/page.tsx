import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPosts, getPost, postPath, postEncPath, postImage } from '../../../lib/blog';
import { BRAND, BUSINESS, SITE_URL } from '../../../lib/site';
import { breadcrumbJsonLd, pageListJsonLd } from '../../../lib/jsonld';
import { Actions, IconArrow, JsonLd, OfficialLinks, SectionHead } from '../../../components/Common';

export const dynamicParams = false;
export function generateStaticParams() {
  return getPosts().map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const p = getPost(params.slug);
  if (!p) return { robots: { index: false } };
  const url = postEncPath(p);
  return { title: `${p.title} | ${BRAND}`, description: p.description, alternates: { canonical: url },
    openGraph: { type: 'article', title: p.title, description: p.description, url, publishedTime: p.date, images: [postImage(p)] } };
}

export default function PostPage({ params }: { params: { slug: string } }) {
  const p = getPost(params.slug);
  if (!p) notFound();
  const all = getPosts(), at = all.indexOf(p);
  const others = [...all.slice(at + 1), ...all.slice(0, at)].slice(0, 6); // 글마다 바로 다음 글들 — 모두 같은 최신 6편을 걸면 글끼리 같은 문장이 늘어난다
  const path = postEncPath(p);
  return (
    <main>
      <JsonLd data={[
        { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title, description: p.description, datePublished: p.date, dateModified: p.date,
          mainEntityOfPage: `${SITE_URL}${path}`, image: `${SITE_URL}${postImage(p)}`,
          author: { '@type': 'Organization', name: BUSINESS.name }, publisher: { '@type': 'Organization', name: BUSINESS.name } },
        breadcrumbJsonLd([{ name: '홈', path: '/' }, { name: '커튼 가이드', path: '/blog/' }, { name: p.title, path }]),
        pageListJsonLd(`${BRAND} 커튼 가이드 다른 글`, others.map((x) => ({ name: x.title, path: postEncPath(x) }))),
      ]} />
      <div className="wrap content page-top">
        <nav className="crumbs" aria-label="경로"><Link href="/">홈</Link><span>/</span><Link href="/blog/">커튼 가이드</Link></nav>
        <p className="hero-label dark">{p.date.replace(/-/g, '.')}</p>
        <h1 className="page-title">{p.title}</h1>
        <p className="prose-p">{p.description}</p>
        <figure className="post-fig"><img src={postImage(p)} alt={`${p.keyword} — ${BRAND} 커튼 시공 사진`} /></figure>
        <article className="prose">
          {p.sections.map((x, i) => (
            <section key={x.h} className="sec">
              <SectionHead no={String(i + 1).padStart(2, '0')} title={x.h} />
              {x.p.map((t) => <p key={t}>{t}</p>)}
              {x.list.length > 0 && <ul className="post-ul">{x.list.map((t) => <li key={t}>{t}</li>)}</ul>}
            </section>
          ))}
        </article>
        {others.length > 0 && (
          <section className="sec related">
            <div><h3>다른 커튼 가이드</h3><ul>{others.map((x) => <li key={x.slug}><Link href={postPath(x)}>{x.title}<IconArrow /></Link></li>)}</ul></div>
          </section>
        )}
      </div>
      <section className="closing">
        <div className="wrap" data-reveal>
          <h2>창 크기만 알려주시면 견적을 드립니다</h2>
          <p>가로·세로 실측값과 공간을 전화나 문자로 보내주세요. 원단과 레일까지 맞춰 안내합니다.</p>
          <Actions dark />
          <OfficialLinks compact />
        </div>
      </section>
    </main>
  );
}
