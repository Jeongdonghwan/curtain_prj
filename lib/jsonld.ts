import { SITE_URL, BRAND, CONTACT, BUSINESS, LINKS } from './site';

export const businessJsonLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'Store',
  '@id': `${SITE_URL}/#store`,
  name: BRAND,
  url: `${SITE_URL}/`, // 이 사이트가 주소. 공식몰·스마트스토어는 sameAs 로만
  image: `${SITE_URL}/images/ba-a-after.webp`,
  telephone: CONTACT.phone,
  email: BUSINESS.email,
  address: { '@type': 'PostalAddress', addressCountry: 'KR', streetAddress: BUSINESS.address },
  areaServed: ['서울', '경기'],
  sameAs: [LINKS.home, LINKS.store],
});

export const breadcrumbJsonLd = (items: { name: string; path: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: `${SITE_URL}${it.path}` })),
});

export const faqJsonLd = (faqs: { q: string; a: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
});

// 캐러셀용 페이지 목록 — 같은 도메인 절대 URL(한글은 인코딩된 경로를 넘긴다)
export const pageListJsonLd = (name: string, items: { name: string; path: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name,
  itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, url: `${SITE_URL}${it.path}` })),
});

// Product·Offer 구조화 데이터는 넣지 않는다 (2026-11-16): 주소가 공식몰인 상품을 전 페이지에 실으면 판매 중계 페이지로 읽힌다.
