// 소개 — 사실만 평서문으로 (무엇을·어디서·어떻게 연락). site.ts 에 있는 것만 쓴다. 없는 정보는 줄을 내지 않는다.
import type { Metadata } from 'next';
import Link from 'next/link';
import { BRAND, BUSINESS, CONTACT, FACTS, UPDATED, tel, smsHref } from '../../lib/site';
import { breadcrumbJsonLd } from '../../lib/jsonld';
import { JsonLd } from '../../components/Common';

const TITLE = `소개 | ${BRAND}`;
const DESC = '커튼명장은 형상기억 맞춤제작 커튼·블라인드를 공식몰과 네이버 스마트스토어에서 판매합니다. 하는 일과 연락 방법을 정리했습니다.';
const OG = ['/images/ba-a-after.webp'];
export const metadata: Metadata = {
  title: TITLE, description: DESC, alternates: { canonical: '/about/' },
  openGraph: { type: 'website', siteName: BRAND, locale: 'ko_KR', title: TITLE, description: DESC, url: '/about/', images: OG },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESC, images: OG },
};

// 업체 구조화 데이터(Store)는 layout 에서 전 페이지에 들어간다
export default function About() {
  return (
    <main>
      <div className="wrap content page-top">
        <JsonLd data={breadcrumbJsonLd([{ name: '홈', path: '/' }, { name: '소개', path: '/about/' }])} />
        <nav className="crumbs" aria-label="경로"><Link href="/">홈</Link><span>/</span>소개</nav>
        <h1 className="page-title">{BUSINESS.name || BRAND} 소개</h1>
        <p className="prose-p">{BUSINESS.name || BRAND}은 형상기억 맞춤제작 커튼·블라인드를 국내에서 맞춤제작해 판매합니다.</p>
        <section className="sec">
          <h2 className="area-h">하는 일</h2>
          <p className="prose-p">커튼·블라인드를 주문 치수에 맞춰 제작하고 공식몰(curtainmaster.co.kr)과 네이버 스마트스토어에서 판매합니다. 상담은 전화 {CONTACT.phone}, 문자 {CONTACT.sms}로 받습니다.</p>
          <p className="prose-p">공식몰 표기로는 국내 맞춤제작 기준 {FACTS.leadDays}이고, {FACTS.freeItems}입니다. 상품 가격과 구성은 공식몰 표기 기준입니다.</p>
        </section>
        <section className="sec">
          <h2 className="area-h">이 사이트가 다루는 지역</h2>
          <p className="prose-p">이 사이트는 서울·경기 지역별 커튼·블라인드 안내를 담고 있습니다. 동네별 안내는 <Link href="/area/">지역별 안내</Link>에, 실측·원단·설치 글은 <Link href="/blog/">커튼 가이드</Link>에 있습니다.</p>
        </section>
        <section className="sec">
          <h2 className="area-h">연락 방법</h2>
          <p className="prose-p">대표 전화 <a href={tel}>{CONTACT.phone}</a>, 문자 상담 <a href={smsHref}>{CONTACT.sms}</a>로 받습니다.</p>
          {BUSINESS.email && <p className="prose-p">메일은 <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>입니다.</p>}
        </section>
        <section className="sec">
          <h2 className="area-h">사업자 정보</h2>
          {BUSINESS.name && <p className="prose-p">상호는 {BUSINESS.name}입니다.</p>}
          {BUSINESS.bizNumber && <p className="prose-p">사업자등록번호는 {BUSINESS.bizNumber}입니다.</p>}
          {BUSINESS.mailOrder && <p className="prose-p">통신판매업 신고번호는 {BUSINESS.mailOrder}입니다.</p>}
          {BUSINESS.address && <p className="prose-p">주소는 {BUSINESS.address}입니다.</p>}
          <p className="prose-p">이 페이지의 최종 수정일은 <time dateTime={UPDATED}>{UPDATED}</time>입니다.</p>
        </section>
      </div>
    </main>
  );
}
