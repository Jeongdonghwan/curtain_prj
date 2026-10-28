import { SITE_URL, BRAND, CONTACT, BUSINESS, LINKS } from './site';

export const businessJsonLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'Store',
  '@id': `${SITE_URL}/#store`,
  name: BRAND,
  url: LINKS.home,
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

// 상품 목록 — 실제 공식몰 상품만, 가격은 표기 그대로
export const productListJsonLd = (items: { name: string; url: string; img: string; price: number }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  itemListElement: items.map((p, i) => ({
    '@type': 'ListItem', position: i + 1,
    item: { '@type': 'Product', name: p.name, url: p.url, image: `${SITE_URL}/images/${p.img}.webp`, brand: { '@type': 'Brand', name: BRAND },
      offers: { '@type': 'Offer', priceCurrency: 'KRW', price: p.price, url: p.url, availability: 'https://schema.org/InStock' } },
  })),
});
