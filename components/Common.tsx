// 커튼명장 공통 UI — 각진 버튼, 선 아이콘, 번호 머리, 공식 판매처 고정 띠, 전후 비교 슬라이더, 빛 투과 눈금.
import Link from 'next/link';
import { BRAND, BRAND_EN, CONTACT, BUSINESS, LINKS, tel, smsHref } from '../lib/site';
import { LIGHT, baCaption } from '../lib/compose';

export const JsonLd = ({ data }: { data: object | object[] }) => (
  <>{(Array.isArray(data) ? data : [data]).map((d, i) => <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(d) }} />)}</>
);

const Svg = ({ d, size = 18 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);
export const IconPhone = () => <Svg d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />;
export const IconMsg = () => <Svg d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />;
export const IconArrow = () => <Svg d="M5 12h14M13 6l6 6-6 6" size={16} />;
export const IconExt = () => <Svg d="M14 4h6v6M20 4l-9 9M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" size={15} />;

export const Actions = ({ dark }: { dark?: boolean }) => (
  <div className={`actions ${dark ? 'on-dark' : ''}`}>
    <a className="btn-primary" href={tel}><IconPhone /><span>{CONTACT.phone}</span></a>
    <a className="btn-text" href={smsHref}><IconMsg /><span>문자 상담 {CONTACT.sms}</span><IconArrow /></a>
  </div>
);

// SEO 페이지마다 고정으로 들어가는 공식 판매처 링크
export const OfficialLinks = ({ compact }: { compact?: boolean }) => (
  <div className={`official ${compact ? 'compact' : ''}`}>
    <span className="official-label">공식 판매처</span>
    <a href={LINKS.home} target="_blank" rel="noopener"><b>커튼명장 공식몰</b><span>curtainmaster.co.kr</span><IconExt /></a>
    <a href={LINKS.store} target="_blank" rel="noopener"><b>네이버 스마트스토어</b><span>smartstore.naver.com/curtainmaster</span><IconExt /></a>
  </div>
);

export const SectionHead = ({ no, title, sub }: { no: string; title: React.ReactNode; sub?: string }) => (
  <header className="sh" data-reveal>
    <span className="sh-no">{no}</span>
    <h2>{title}</h2>
    {sub && <p>{sub}</p>}
  </header>
);

// 시공 전후 비교 — 끌어서 비교, 화면에 들어오면 한 번 쓸고 지나간다
export const BeforeAfter = ({ k, label }: { k: string; label?: string }) => (
  <figure className="ba" data-reveal style={{ ['--pos' as any]: '50%' }}>
    <img src={`/images/ba-${k}-after.webp`} alt={`${label ? label + ' ' : ''}${baCaption(k)} 시공 후`} />
    <div className="ba-before"><img src={`/images/ba-${k}-before.webp`} alt={`${label ? label + ' ' : ''}시공 전 창`} /></div>
    <span className="ba-tag before">BEFORE</span><span className="ba-tag after">AFTER</span>
    <span className="ba-handle" aria-hidden="true" />
    <input className="ba-range" type="range" min="0" max="100" defaultValue="50" aria-label="시공 전후 비교 위치" />
    <figcaption>{baCaption(k)}</figcaption>
  </figure>
);

// 빛 투과 눈금 — 비침 쉬폰부터 100% 암막까지
export const LightScale = ({ on = [] as string[] }) => (
  <div className="light" data-reveal aria-label="빛 투과 정도">
    <div className="light-bar"><span className="light-fill" /></div>
    {LIGHT.map((l) => (
      <span key={l.key} className={`light-tick ${on.includes(l.key) ? 'on' : ''}`} style={{ left: `${l.pos}%` }}><i />{l.label}</span>
    ))}
    <span className="light-end l">빛이 들어옴</span><span className="light-end r">빛을 막음</span>
  </div>
);

export const Header = () => (
  <header className="site-header">
    <div className="wrap header-inner">
      <Link href="/" className="logo"><b>{BRAND}</b><small>{BRAND_EN}</small></Link>
      <nav className="nav">
        <Link href="/#products">제품</Link>
        <Link href="/area/">지역</Link>
        <a href={LINKS.home} target="_blank" rel="noopener">공식몰</a>
        <a href={LINKS.store} target="_blank" rel="noopener">스마트스토어</a>
        <a href={tel} className="nav-call"><IconPhone />{CONTACT.phone}</a>
      </nav>
    </div>
  </header>
);

export const Footer = () => (
  <footer className="site-footer">
    <div className="wrap foot-grid">
      <div>
        <strong className="foot-brand">{BRAND}</strong>
        <p>형상기억 맞춤제작 커튼·블라인드. 국내 맞춤제작, 레일포함 풀세트.</p>
        <p className="foot-links"><a href={LINKS.home} target="_blank" rel="noopener">공식몰 curtainmaster.co.kr</a><a href={LINKS.store} target="_blank" rel="noopener">네이버 스마트스토어</a></p>
      </div>
      <ul className="foot-info">
        <li><span>대표전화</span>{CONTACT.phone}</li>
        <li><span>문자상담</span>{CONTACT.sms}</li>
        <li><span>사업자</span>{BUSINESS.bizNumber}</li>
        <li><span>통신판매</span>{BUSINESS.mailOrder}</li>
        <li><span>주소</span>{BUSINESS.address}</li>
        <li><span>메일</span>{BUSINESS.email}</li>
      </ul>
    </div>
    <div className="wrap foot-bottom">© {new Date().getFullYear()} {BRAND} · 상품 가격과 구성은 공식몰 표기 기준입니다.</div>
  </footer>
);

export const StickyBar = () => (
  <div className="sticky-bar">
    <a href={tel} className="sb-call"><IconPhone /><span><b>전화상담</b><small>{CONTACT.phone}</small></span></a>
    <a href={smsHref} className="sb-sms"><IconMsg /><span><b>문자상담</b><small>{CONTACT.sms}</small></span></a>
    <a href={LINKS.store} target="_blank" rel="noopener" className="sb-store"><IconExt /><span><b>네이버 스토어</b><small>공식 판매처</small></span></a>
  </div>
);
