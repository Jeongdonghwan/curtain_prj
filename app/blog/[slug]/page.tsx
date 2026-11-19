import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPosts, getPost, postPath, postEncPath, postImage } from '../../../lib/blog';
import { BRAND, BUSINESS, SITE_URL } from '../../../lib/site';
import { OPEN_PAGES, pagePath, hash, type Page } from '../../../lib/data';
import { breadcrumbJsonLd, pageListJsonLd } from '../../../lib/jsonld';
import { Actions, IconArrow, JsonLd, SectionHead } from '../../../components/Common';

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

// 글 키워드에 든 단어(암막커튼·롤스크린…)의 지역 페이지 — 서울·경기 시도 + 시군구를 글마다 다르게 돌려 건다
const WORDS = Array.from(new Set(OPEN_PAGES.map((x) => x.word))).sort((a, b) => b.length - a.length);
function areaLinks(p: { slug: string; keyword: string; title: string }) {
  const k = (p.keyword + p.title).replace(/\s/g, '');
  const w = WORDS.find((x) => k.includes(x)) || (k.includes('블라인드') ? '블라인드' : '커튼');
  const pick = (sido: string): Page[] => {
    const pool = OPEN_PAGES.filter((x) => x.word === w && x.sido === sido && !x.variantOf);
    const top = pool.filter((x) => x.level === '시도'), sub = pool.filter((x) => x.level === '구' || x.level === '시군');
    const r = sub.length ? hash(p.slug) % sub.length : 0;
    return [...top, ...sub.slice(r), ...sub.slice(0, r)].slice(0, 7);
  };
  return { w, seoul: pick('서울특별시'), gg: pick('경기도') };
}

// 문단 안 내부 링크 `[글자](/경로/)` 만 링크로 (그 외 마크다운은 쓰지 않는다)
function rich(t: string) {
  return t.split(/(\[[^\]]+\]\(\/[^)]*\))/g).map((s, i) => { const m = s.match(/^\[([^\]]+)\]\((\/[^)]*)\)$/); return m ? <Link key={i} href={m[2]}>{m[1]}</Link> : s; });
}

export default function PostPage({ params }: { params: { slug: string } }) {
  const p = getPost(params.slug);
  if (!p) notFound();
  const all = getPosts(), at = all.indexOf(p);
  const others = [...all.slice(at + 1), ...all.slice(0, at)].slice(0, 6); // 글마다 바로 다음 글들 — 모두 같은 최신 6편을 걸면 글끼리 같은 문장이 늘어난다
  const path = postEncPath(p);
  const area = areaLinks(p);
  return (
    <main>
      <JsonLd data={[
        { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title, description: p.description, datePublished: p.date, dateModified: p.date,
          mainEntityOfPage: `${SITE_URL}${path}`, image: `${SITE_URL}${postImage(p)}`,
          author: { '@type': 'Organization', name: BUSINESS.name }, publisher: { '@type': 'Organization', name: BUSINESS.name } },
        breadcrumbJsonLd([{ name: '홈', path: '/' }, { name: '커튼 가이드', path: '/blog/' }, { name: p.title, path }]),
        pageListJsonLd(`${BRAND} 커튼 가이드 다른 글`, others.map((x) => ({ name: x.title, path: postEncPath(x), image: postImage(x) }))),
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
              {x.p.map((t) => <p key={t}>{rich(t)}</p>)}
              {x.list.length > 0 && <ul className="post-ul">{x.list.map((t) => <li key={t}>{rich(t)}</li>)}</ul>}
            </section>
          ))}
        </article>
        <section className="sec related">
          <div><h3>서울 {area.w}</h3><ul>{area.seoul.map((x) => <li key={x.slug}><Link href={pagePath(x)}>{x.kw}<IconArrow /></Link></li>)}</ul></div>
          <div><h3>경기 {area.w}</h3><ul>{area.gg.map((x) => <li key={x.slug}><Link href={pagePath(x)}>{x.kw}<IconArrow /></Link></li>)}</ul></div>
          {others.length > 0 && <div><h3>다른 커튼 가이드</h3><ul>{others.map((x) => <li key={x.slug}><Link href={postPath(x)}>{x.title}<IconArrow /></Link></li>)}</ul></div>}
        </section>
      </div>
      <section className="closing">
        <div className="wrap" data-reveal>
          <h2>창 크기만 알려주시면 견적을 드립니다</h2>
          <p>가로·세로 실측값과 공간을 전화나 문자로 보내주세요. 원단과 레일까지 맞춰 안내합니다.</p>
          <Actions dark />
        </div>
      </section>
    </main>
  );
}
