import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { OPEN_PAGES, getPage, pagePath, pageEncodedPath, canonicalPath, related } from '../../lib/data';
import { compose } from '../../lib/compose';
import { BRAND } from '../../lib/site';
import { breadcrumbJsonLd, faqJsonLd, pageListJsonLd, productListJsonLd } from '../../lib/jsonld';
import { Actions, BeforeAfter, IconArrow, IconExt, JsonLd, LightScale, OfficialLinks, SectionHead } from '../../components/Common';

export const dynamicParams = false;

// 순차 오픈: lib/site.ts OPEN_WAVE 이하만 생성
export function generateStaticParams() {
  return OPEN_PAGES.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const p = getPage(params.slug);
  if (!p) return {};
  const c = compose(p);
  const url = canonicalPath(p);
  return { title: c.title, description: c.description, alternates: { canonical: url }, openGraph: { title: c.title, description: c.description, url, images: [`/images/ba-${c.baKey}-after.webp`] } };
}

export default function KeywordPage({ params }: { params: { slug: string } }) {
  const p = getPage(params.slug);
  if (!p) notFound();
  const c = compose(p);
  const rel = related(p);
  const path = pageEncodedPath(p);
  let n = 0;
  const no = () => String(++n).padStart(2, '0');

  return (
    <main>
      <JsonLd data={[
        breadcrumbJsonLd([{ name: '홈', path: '/' }, { name: '지역', path: '/area/' }, { name: p.kw, path }]),
        faqJsonLd(c.faq),
        pageListJsonLd(`${p.kw} 관련 페이지`, [...rel.samePlace, ...rel.sameWord, ...rel.wider].map((x) => ({ name: x.kw, path: pageEncodedPath(x) }))),
        ...(c.products.length ? [productListJsonLd(c.products)] : []),
      ]} />

      <section className="hero">
        <img className="hero-bg" src={`/images/ba-${c.heroKey}-after.webp`} alt={`${c.area} ${p.word} 쉬폰 커튼 시공 사진`} fetchPriority="high" />
        <div className="wrap">
          <div className="hero-copy">
            <nav className="crumbs" aria-label="경로"><Link href="/">홈</Link><span>/</span><Link href="/area/">지역</Link><span>/</span>{p.kw}</nav>
            <p className="hero-label">{c.eyebrow}</p>
            <h1 className="hero-title"><span>{p.kw}</span></h1>
            <p className="hero-lead">{c.lead}</p>
            <Actions />
            <dl className="hero-specs">{c.specs.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
          </div>
        </div>
      </section>

      <div className="official-band"><div className="wrap"><OfficialLinks /></div></div>

      <div className="wrap content">
        <section className="sec">
          <div className="cols intro-cols">
            <div className="prose" data-reveal>{c.intro.map((t, i) => <p key={i} className={i === 0 ? 'first' : ''}>{t}</p>)}</div>
            <BeforeAfter k={c.baKey} label={c.area} />
          </div>
        </section>

        <section className="sec alt">
          <SectionHead no={no()} title={c.region.heading} />
          <div className="cols">
            <div data-reveal><p className="region-body">{c.region.body}</p>{c.region.nearLine && <p className="region-near">{c.region.nearLine}</p>}</div>
            <dl className="info" data-reveal>{c.region.dl.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
          </div>
          {c.region.complexes.length > 0 && (
            <div className="apt-wrap" data-reveal>
              <table className="apt-table">
                <caption>{c.area} 공동주택 단지 · 세대수 많은 순 · K-apt 단지 기본정보(2026.10.26 추출)</caption>
                <thead><tr><th scope="col">단지명</th><th scope="col">사용승인</th><th scope="col">세대</th><th scope="col">복도</th><th scope="col">최고층</th></tr></thead>
                <tbody>{c.region.complexes.map((x) => (
                  <tr key={x.name + x.legal}><th scope="row">{x.name}<small>{x.legal}</small></th><td>{x.year ? `${x.year}년` : '-'}</td><td>{x.hh.toLocaleString()}</td><td>{x.hall || '-'}</td><td>{x.floor ? `${x.floor}층` : '-'}</td></tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </section>

        <section className="sec">
          <SectionHead no={no()} title={c.roomsHeading} />
          <ol className="rooms reveal-group">{c.rooms.map((r, i) => <li key={r.room}><span>{String(i + 1).padStart(2, '0')}</span><h3>{r.room}</h3><p>{r.text}</p></li>)}</ol>
        </section>

        {c.topic !== 'blind' && (
          <section className="sec">
            <SectionHead no={no()} title="빛을 얼마나 막을지부터" sub="쉬폰은 비침 정도가 세 단계, 겉지는 거실커튼과 암막으로 나뉩니다. 이 페이지에서 소개하는 제품이 진하게 표시됩니다." />
            <LightScale on={c.lightOn} />
          </section>
        )}

        {c.products.length > 0 ? (
          <section className="sec" id="products">
            <SectionHead no={no()} title={c.topic === 'blackout' ? '암막커튼 제품' : `${c.area}에 많이 맞추는 제품`} sub={c.priceNote} />
            <div className="rail-nav">
              <button type="button" data-scroll="-1" data-target="prod-rail" aria-label="이전 제품">←</button>
              <button type="button" data-scroll="1" data-target="prod-rail" aria-label="다음 제품">→</button>
            </div>
            <div className="rail" id="prod-rail">
              {c.products.map((x, i) => (
                <a className="prod" key={x.id} href={x.url} target="_blank" rel="noopener" data-reveal style={{ transitionDelay: `${i * 70}ms` }}>
                  <div className="prod-img"><img src={`/images/${x.img}.webp`} alt={`${c.area} ${p.word} ${x.short}`} loading="lazy" /><span className="prod-light">{x.light}</span></div>
                  <div className="prod-body"><strong>{x.short}</strong><span>레일포함 풀세트 · 형상기억</span><b>{x.price.toLocaleString()}원~</b><em>공식몰에서 보기 <IconExt /></em></div>
                </a>
              ))}
            </div>
          </section>
        ) : (
          <section className="sec" id="products">
            <SectionHead no={no()} title="블라인드 시공 사례" sub={c.priceNote} />
            <div className="mosaic">{c.cases.map((src, i) => <figure key={src} data-reveal style={{ transitionDelay: `${i * 70}ms` }}><img src={src} alt={`${c.area} ${p.word} 시공 사례`} loading="lazy" /></figure>)}</div>
          </section>
        )}
      </div>

      <div className="wrap content">
        <section className="sec">
          <SectionHead no={no()} title={c.typesHeading} />
          <dl className="types reveal-group">{c.types.map((x) => <div key={x.name}><dt>{x.name}</dt><dd>{x.d}</dd></div>)}</dl>
        </section>
      </div>

      <section className="cta-band" data-reveal>
        <div className="wrap cta-band-in">
          <p>창 사진과 <em>가로 길이</em>만 보내주세요.</p>
          <Actions />
        </div>
      </section>

      <div className="wrap content">
        <section className="sec">
          <SectionHead no={no()} title="주문부터 설치까지" />
          <ol className="timeline reveal-group">{c.steps.map((st) => <li key={st.t}><strong>{st.t}</strong><p>{st.d}</p></li>)}</ol>
        </section>

        {c.products.length > 0 && (
          <section className="sec alt">
            <SectionHead no={no()} title="실제 시공 현장" />
            <div className="mosaic">{c.cases.map((src, i) => <figure key={src} data-reveal style={{ transitionDelay: `${i * 70}ms` }}><img src={src} alt={`${c.area} ${p.word} 시공 사례`} loading="lazy" /></figure>)}</div>
          </section>
        )}

        <section className="sec" id="faq">
          <SectionHead no={no()} title="자주 묻는 질문" />
          <div className="faq">{c.faq.map((f) => <details key={f.q} data-reveal><summary>{f.q}<i /></summary><p>{f.a}</p></details>)}</div>
        </section>

        <section className="sec related">
          {rel.samePlace.length > 0 && <div><h3>{p.region} 다른 제품</h3><ul>{rel.samePlace.map((x) => <li key={x.slug}><Link href={pagePath(x)}>{x.kw}<IconArrow /></Link></li>)}</ul></div>}
          {rel.sameWord.length > 0 && <div><h3>가까운 동네 {p.word}</h3><ul>{rel.sameWord.map((x) => <li key={x.slug}><Link href={pagePath(x)}>{x.kw}<IconArrow /></Link></li>)}</ul></div>}
          {rel.wider.length > 0 && <div><h3>{p.sido === '서울특별시' ? '서울' : '경기'} 다른 지역 {p.word}</h3><ul>{rel.wider.map((x) => <li key={x.slug}><Link href={pagePath(x)}>{x.kw}<IconArrow /></Link></li>)}</ul></div>}
        </section>
      </div>

      <section className="closing">
        <div className="wrap" data-reveal>
          <h2>{c.closing.heading}</h2>
          <p>{c.closing.text}</p>
          <Actions dark />
          <OfficialLinks compact />
        </div>
      </section>
    </main>
  );
}
