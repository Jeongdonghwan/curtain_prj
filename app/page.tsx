import Link from 'next/link';
import { PRODUCTS, pagePath, pageEncodedPath, regionHubs } from '../lib/data';
import { BA_KEYS } from '../lib/compose';
import { BRAND, FACTS } from '../lib/site';
import { faqJsonLd, pageListJsonLd, productListJsonLd } from '../lib/jsonld';
import { Actions, BeforeAfter, IconArrow, IconExt, JsonLd, LightScale, OfficialLinks, SectionHead } from '../components/Common';

const WHY = [
  ['국내 맞춤제작', '가로 사이즈를 고르면 높이는 해피콜 상담 뒤 공간에 맞춰 만듭니다.'],
  ['평균 3일 이내 출고', '국내 맞춤제작 기준입니다. 일반 맞춤 커튼이 1~2주 걸리는 것과 다릅니다.'],
  ['형상기억·나비주름', '겉지는 형상기억으로 주름이 일정하게, 쉬폰은 나비주름으로 떨어집니다.'],
  ['레일포함 풀세트', '자석끈과 커튼레일을 무료로 함께 보냅니다.'],
  ['무료 방문 실측', '방문 가능 지역은 담당자가 실측과 견적 상담을 합니다.'],
  ['전문 설치', '지역별 설치 일정은 상담 뒤 안내합니다.'],
];
const FAQ = [
  { q: '주문은 어떻게 하나요?', a: '가로 실측 사이즈를 골라 공식몰이나 스마트스토어에서 구매하시면, 높이는 해피콜 상담 뒤 맞춤 제작합니다.' },
  { q: '제작 기간은요?', a: '국내 맞춤제작 기준 평균 3일 이내 출고됩니다.' },
  { q: '레일도 같이 오나요?', a: '레일포함 풀세트이고 자석끈과 커튼레일이 무료로 제공됩니다.' },
  { q: '방문 실측이 되나요?', a: '방문 가능 지역은 지역별 담당자가 무료 실측과 견적 상담을 진행합니다.' },
];

export default function Home() {
  const hubs = regionHubs();
  const groups = [
    { key: '암막', title: '암막커튼', note: '침실·아이방. 빛을 거의 다 막는 겉지' },
    { key: '거실', title: '거실커튼', note: '거실 겉지. 쉬폰과 함께 이중으로' },
    { key: '쉬폰', title: '쉬폰커튼', note: '속지. 비침 정도 세 단계' },
  ];
  return (
    <main>
      <JsonLd data={[faqJsonLd(FAQ), productListJsonLd(PRODUCTS), pageListJsonLd('서울·경기 지역별 커튼', hubs.flatMap((h) => h.pages).slice(0, 30).map((x) => ({ name: x.kw, path: pageEncodedPath(x) })))]} />
      <section className="hero hero-home">
        <img className="hero-bg" src="/images/ba-f-after.webp" alt="커튼명장 거실 쉬폰 커튼 시공 사진" fetchPriority="high" />
        <div className="wrap">
          <div className="hero-copy">
            <p className="hero-label">CURTAIN MASTER · SEOUL · GYEONGGI</p>
            <h1 className="hero-title"><span>창 크기에 맞춰,</span><span>3일 만에 도착하는 커튼</span></h1>
            <p className="hero-lead">{BRAND}는 형상기억 맞춤제작 커튼과 블라인드를 만듭니다. 가로 사이즈만 고르면 높이는 상담으로 맞추고, 국내 맞춤제작 {FACTS.leadDays}합니다.</p>
            <Actions />
          </div>
        </div>
      </section>

      <div className="official-band"><div className="wrap"><OfficialLinks /></div></div>

      <div className="wrap content">
        <section className="sec">
          <SectionHead no="01" title="커튼명장이 다른 점" sub="공식몰 안내 그대로입니다." />
          <ol className="why reveal-group">{WHY.map(([t, d], i) => <li key={t}><span>{String(i + 1).padStart(2, '0')}</span><h3>{t}</h3><p>{d}</p></li>)}</ol>
        </section>

        <section className="sec alt">
          <SectionHead no="02" title="빛을 얼마나 막을지부터" sub="쉬폰 세 단계, 거실커튼, 암막커튼까지. 공간마다 고르는 기준이 다릅니다." />
          <LightScale on={['비침', '중간 비침', '비침 없는', '거실', '암막', '100% 암막']} />
        </section>

        <section className="sec" id="products">
          <SectionHead no="03" title="제품" sub="공식몰 표기 가격, 레일포함 풀세트 · 가로 사이즈 기준." />
          {groups.map((g) => (
            <div key={g.key} className="prod-group">
              <div className="prod-group-head" data-reveal><h3>{g.title}</h3><p>{g.note}</p></div>
              <div className="rail">
                {PRODUCTS.filter((x) => x.kind === g.key).map((x, i) => (
                  <a className="prod" key={x.id} href={x.url} target="_blank" rel="noopener" data-reveal style={{ transitionDelay: `${(i % 4) * 70}ms` }}>
                    <div className="prod-img"><img src={`/images/${x.img}.webp`} alt={`${BRAND} ${x.short}`} loading="lazy" /><span className="prod-light">{x.light}</span></div>
                    <div className="prod-body"><strong>{x.short}</strong><span>레일포함 풀세트 · 형상기억</span><b>{x.price.toLocaleString()}원~</b><em>공식몰에서 보기 <IconExt /></em></div>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>

      <section className="sec dark-band">
        <div className="wrap">
          <SectionHead no="04" title="커튼 하나로 달라지는 방" sub="손잡이를 끌어 시공 전과 후를 비교해 보세요." />
          <div className="ba-grid">{BA_KEYS.map((k) => <BeforeAfter key={k} k={k} />)}</div>
        </div>
      </section>

      <div className="wrap content">
        <section className="sec">
          <SectionHead no="05" title="실제 시공 현장" sub="주거와 병원·학교·체육관 같은 상업 공간까지." />
          <div className="mosaic">{[48, 9, 53, 29, 36].map((n, i) => <figure key={n} data-reveal style={{ transitionDelay: `${i * 70}ms` }}><img src={`/images/case-${n}.webp`} alt={`${BRAND} 시공 사례`} loading="lazy" /></figure>)}</div>
        </section>

        <section className="sec alt">
          <SectionHead no="06" title="지역별 안내" sub="서울·경기 지역별 커튼·블라인드 안내입니다." />
          <div className="regions">
            {hubs.map((h) => (
              <div key={h.sido} className="region-col" data-reveal>
                <h3>{h.label}</h3>
                <ul>{h.pages.map((p) => <li key={p.slug}><Link href={pagePath(p)}><span>{p.region}</span><IconArrow /></Link></li>)}</ul>
              </div>
            ))}
          </div>
          <p data-reveal><Link href="/area/" className="more">전체 지역 페이지 <IconArrow /></Link></p>
        </section>

        <section className="sec">
          <SectionHead no="07" title="자주 묻는 질문" />
          <div className="faq">{FAQ.map((f) => <details key={f.q} data-reveal><summary>{f.q}<i /></summary><p>{f.a}</p></details>)}</div>
        </section>
      </div>

      <section className="closing">
        <div className="wrap" data-reveal>
          <h2>3일 후, 창이 달라집니다</h2>
          <p>창 사진과 가로 길이를 문자로 보내주시면 제품과 사이즈를 골라 드립니다.</p>
          <Actions dark />
          <OfficialLinks compact />
        </div>
      </section>
    </main>
  );
}
