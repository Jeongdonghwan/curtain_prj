import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { OPEN_PAGES, getPage, pagePath, pageEncodedPath, canonicalPath, related, Page } from '../../lib/data';
import { compose } from '../../lib/compose';
import { composeAxis, isAxisPage, Section } from '../../lib/axes';
import { breadcrumbJsonLd, faqJsonLd, pageListJsonLd } from '../../lib/jsonld';
import { Actions, BeforeAfter, CallButton, IconArrow, JsonLd, LightScale, SectionHead } from '../../components/Common';

export const dynamicParams = false;

// 순차 오픈: lib/site.ts OPEN_WAVE 이하만 생성
export function generateStaticParams() {
  return OPEN_PAGES.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const p = getPage(params.slug);
  if (!p) return {};
  const c = isAxisPage(p) ? composeAxis(p) : compose(p);
  const url = canonicalPath(p);
  return { title: c.title, description: c.description, alternates: { canonical: url }, openGraph: { title: c.title, description: c.description, url, images: [`/images/ba-${c.baKey}-after.webp`] } };
}

const Related = ({ p, rel }: { p: Page; rel: ReturnType<typeof related> }) => (
  <section className="sec related">
    {rel.samePlace.length > 0 && <div><h3>{p.region} 다른 제품·공간</h3><ul>{rel.samePlace.map((x) => <li key={x.slug}><Link href={pagePath(x)}>{x.kw}<IconArrow /></Link></li>)}</ul></div>}
    {rel.sameWord.length > 0 && <div><h3>가까운 동네 {p.word}</h3><ul>{rel.sameWord.map((x) => <li key={x.slug}><Link href={pagePath(x)}>{x.kw}<IconArrow /></Link></li>)}</ul></div>}
    {rel.wider.length > 0 && <div><h3>{p.sido === '서울특별시' ? '서울' : '경기'} 다른 지역 {p.word}</h3><ul>{rel.wider.map((x) => <li key={x.slug}><Link href={pagePath(x)}>{x.kw}<IconArrow /></Link></li>)}</ul></div>}
  </section>
);

// 시군구 페이지: 동네별 공동주택·세대 표 (같은 키워드의 동 페이지로 링크 — 허브 → 동 3클릭)
const DongTable = ({ t, word, no, caption }: { t: { heading: string; note: string; rows: { name: string; count: number; households: number; hhTotal: number; one?: number | null; slug: string }[] }; word: string; no: string; caption: string }) => (
  <section className="sec">
    <SectionHead no={no} title={t.heading} sub={t.note} />
    <div className="apt-wrap" data-reveal>
      <table className="apt-table">
        <caption>{caption}</caption>
        <thead><tr><th scope="col">동네</th><th scope="col">등록 단지</th><th scope="col">단지 세대</th><th scope="col">주민등록 세대</th>{t.rows[0].one !== undefined && <th scope="col">1인 세대</th>}</tr></thead>
        <tbody>{t.rows.map((r) => (
          <tr key={r.name}><th scope="row">{r.slug ? <Link href={`/${r.slug}/`}>{r.name} {word}</Link> : r.name}</th><td>{r.count ? `${r.count}곳` : '-'}</td><td>{r.households ? r.households.toLocaleString() : '-'}</td><td>{r.hhTotal ? r.hhTotal.toLocaleString() : '-'}</td>{r.one !== undefined && <td>{r.one !== null ? `${r.one}%` : '-'}</td>}</tr>
        ))}</tbody>
      </table>
    </div>
  </section>
);

// ---- 새 축 페이지 (lib/axes.ts): 축마다 섹션 구성이 다르다 ----
function AxisSection({ sec, no, alt, first, baKey, area }: { sec: Section; no: string; alt: boolean; first?: boolean; baKey: string; area: string }) {
  const cls = `sec${alt ? ' alt' : ''}`;
  switch (sec.kind) {
    case 'prose':
      return first ? (
        <section className="sec"><div className="cols intro-cols"><div className="prose" data-reveal><h2 className="prose-h">{sec.heading}</h2>{sec.paras.map((t, i) => <p key={i} className={i === 0 ? 'first' : ''}>{t}</p>)}</div><BeforeAfter k={baKey} label={area} /></div></section>
      ) : (
        <section className={cls}><SectionHead no={no} title={sec.heading} sub={sec.sub} /><div className="prose" data-reveal>{sec.paras.map((t, i) => <p key={i}>{t}</p>)}</div></section>
      );
    case 'items':
      return <section className={cls}><SectionHead no={no} title={sec.heading} sub={sec.sub} /><ol className="rooms reveal-group">{sec.items.map((r, i) => <li key={r.t}><span>{String(i + 1).padStart(2, '0')}</span><h3>{r.t}</h3><p>{r.d}</p></li>)}</ol></section>;
    case 'dl':
      return <section className={cls}><SectionHead no={no} title={sec.heading} sub={sec.sub} /><dl className="types reveal-group">{sec.rows.map((x) => <div key={x.name}><dt>{x.name}</dt><dd>{x.d}</dd></div>)}</dl></section>;
    case 'table':
      return (
        <section className={cls}><SectionHead no={no} title={sec.heading} sub={sec.sub} />
          <div className="apt-wrap" data-reveal><table className="apt-table"><caption>{sec.caption}</caption>
            <thead><tr>{sec.cols.map((c) => <th key={c} scope="col">{c}</th>)}</tr></thead>
            <tbody>{sec.rows.map((r, i) => <tr key={i}><th scope="row">{r[0]}</th>{r.slice(1).map((v, k) => <td key={k}>{v}</td>)}</tr>)}</tbody>
          </table></div>
        </section>
      );
    case 'steps':
      return <section className={cls}><SectionHead no={no} title={sec.heading} sub={sec.sub} /><ol className="timeline reveal-group">{sec.steps.map((st) => <li key={st.t}><strong>{st.t}</strong><p>{st.d}</p></li>)}</ol></section>;
    case 'photos':
      return <section className={cls}><SectionHead no={no} title={sec.heading} sub={sec.sub} /><div className="mosaic">{sec.srcs.map((src, i) => <figure key={src} data-reveal style={{ transitionDelay: `${i * 70}ms` }}><img src={src} alt={sec.alt} loading="lazy" /></figure>)}</div></section>;
    case 'products':
      return (
        <section className={cls} id="products"><SectionHead no={no} title={sec.heading} sub={sec.sub} />
          <div className="rail">{sec.products.map((x, i) => (
            <div className="prod" key={x.id} data-reveal style={{ transitionDelay: `${i * 70}ms` }}>
              <div className="prod-img"><img src={`/images/${x.img}.webp`} alt={`${area} ${x.short}`} loading="lazy" /><span className="prod-light">{x.light}</span></div>
              <div className="prod-body"><strong>{x.short}</strong><span>레일포함 풀세트 · 형상기억</span><b>{x.price.toLocaleString()}원~</b></div>
            </div>
          ))}</div>
          <CallButton />
        </section>
      );
    case 'faq':
      return <section className={cls} id="faq"><SectionHead no={no} title={sec.heading} /><div className="faq">{sec.faqs.map((f) => <details key={f.q} data-reveal><summary>{f.q}<i /></summary><p>{f.a}</p></details>)}</div></section>;
  }
}

function AxisPage({ p }: { p: Page }) {
  const c = composeAxis(p);
  const rel = related(p);
  const path = pageEncodedPath(p);
  let n = 0;
  const no = () => String(++n).padStart(2, '0');
  const mid = Math.floor(c.sections.length / 2);
  return (
    <main>
      <JsonLd data={[
        breadcrumbJsonLd([{ name: '홈', path: '/' }, { name: '지역', path: '/area/' }, { name: p.kw, path }]),
        faqJsonLd(c.faq),
        pageListJsonLd(`${p.kw} 관련 페이지`, [...rel.samePlace, ...rel.sameWord, ...rel.wider].map((x) => ({ name: x.kw, path: pageEncodedPath(x) }))),
      ]} />
      <section className="hero">
        <img className="hero-bg" src={`/images/ba-${c.heroKey}-after.webp`} alt={`${c.area} ${p.word} 시공 사진`} fetchPriority="high" />
        <div className="wrap"><div className="hero-copy">
          <nav className="crumbs" aria-label="경로"><Link href="/">홈</Link><span>/</span><Link href="/area/">지역</Link><span>/</span>{p.kw}</nav>
          <p className="hero-label">{c.eyebrow}</p>
          <h1 className="hero-title"><span>{p.kw}</span>{' '}<span className="hero-sub">{c.h1sub}</span></h1>
          <p className="hero-lead">{c.lead}</p>
          <Actions />
          <dl className="hero-specs">{c.specs.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
        </div></div>
      </section>
      <div className="wrap content">
        {c.sections.slice(0, mid).map((sec, i) => <AxisSection key={i} sec={sec} no={sec.kind === 'prose' && i === 0 ? '' : no()} alt={i % 2 === 0 && i > 0} first={i === 0} baKey={c.baKey} area={c.area} />)}
        {c.dongTable && <DongTable t={c.dongTable} word={p.word} no={no()} caption={`${c.facts.name} 동네별 공동주택 단지(K-apt 2026.10) · 주민등록 세대(행정안전부 2026.09) · 세대수 많은 순`} />}
      </div>
      <section className="cta-band" data-reveal><div className="wrap cta-band-in"><p>{c.cta}</p><Actions /></div></section>
      <div className="wrap content">
        {c.sections.slice(mid).map((sec, i) => <AxisSection key={i} sec={sec} no={no()} alt={i % 2 === 1} baKey={c.baKey} area={c.area} />)}
        <Related p={p} rel={rel} />
      </div>
      <section className="closing"><div className="wrap" data-reveal><h2>{c.closing.heading}</h2><p>{c.closing.text}</p><Actions dark /></div></section>
    </main>
  );
}

export default function KeywordPage({ params }: { params: { slug: string } }) {
  const p = getPage(params.slug);
  if (!p) notFound();
  if (isAxisPage(p)) return <AxisPage p={p} />;
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
      ]} />

      <section className="hero">
        <img className="hero-bg" src={`/images/ba-${c.heroKey}-after.webp`} alt={`${c.area} ${p.word} 쉬폰 커튼 시공 사진`} fetchPriority="high" />
        <div className="wrap">
          <div className="hero-copy">
            <nav className="crumbs" aria-label="경로"><Link href="/">홈</Link><span>/</span><Link href="/area/">지역</Link><span>/</span>{p.kw}</nav>
            <p className="hero-label">{c.eyebrow}</p>
            <h1 className="hero-title"><span>{p.kw}</span>{' '}<span className="hero-sub">{c.h1sub}</span></h1>
            <p className="hero-lead">{c.lead}</p>
            <Actions />
            <dl className="hero-specs">{c.specs.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
          </div>
        </div>
      </section>

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

        {c.dongTable && <DongTable t={c.dongTable} word={p.word} no={no()} caption={`${c.facts.name} 동네별 공동주택 단지(K-apt 2026.10) · 주민등록 세대(행정안전부 2026.09) · 세대수 많은 순`} />}

        <section className="sec">
          <SectionHead no={no()} title={c.roomsHeading} />
          <ol className="rooms reveal-group">{c.rooms.map((r, i) => <li key={r.room}><span>{String(i + 1).padStart(2, '0')}</span><h3>{r.room}</h3><p>{r.text}</p></li>)}</ol>
        </section>

        {c.topic !== 'blind' && (
          <section className="sec">
            <SectionHead no={no()} title="빛을 얼마나 막을지부터" sub={c.lightSub} />
            <LightScale on={c.lightOn} />
          </section>
        )}

        {c.products.length > 0 ? (
          <section className="sec" id="products">
            <SectionHead no={no()} title={c.topic === 'blackout' ? '암막커튼 제품' : c.productsHeading} sub={c.priceNote} />
            <div className="rail-nav">
              <button type="button" data-scroll="-1" data-target="prod-rail" aria-label="이전 제품">←</button>
              <button type="button" data-scroll="1" data-target="prod-rail" aria-label="다음 제품">→</button>
            </div>
            <div className="rail" id="prod-rail">
              {c.products.map((x, i) => (
                <div className="prod" key={x.id} data-reveal style={{ transitionDelay: `${i * 70}ms` }}>
                  <div className="prod-img"><img src={`/images/${x.img}.webp`} alt={`${c.area} ${p.word} ${x.short}`} loading="lazy" /><span className="prod-light">{x.light}</span></div>
                  <div className="prod-body"><strong>{x.short}</strong><span>레일포함 풀세트 · 형상기억</span><b>{x.price.toLocaleString()}원~</b></div>
                </div>
              ))}
            </div>
            <CallButton />
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
          <p>{c.cta}</p>
          <Actions />
        </div>
      </section>

      <div className="wrap content">
        <section className="sec">
          <SectionHead no={no()} title={c.stepsHeading} />
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

        <Related p={p} rel={rel} />
      </div>

      <section className="closing">
        <div className="wrap" data-reveal>
          <h2>{c.closing.heading}</h2>
          <p>{c.closing.text}</p>
          <Actions dark />
        </div>
      </section>
    </main>
  );
}
