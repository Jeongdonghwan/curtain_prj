import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Header, Footer, StickyBar, JsonLd } from '../components/Common';
import Motion from '../components/Motion';
import { businessJsonLd } from '../lib/jsonld';
import { SITE_URL, BRAND } from '../lib/site';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${BRAND} | 형상기억 맞춤 커튼·블라인드 서울·경기`, template: '%s' },
  description: '커튼명장 형상기억 맞춤제작 커튼·블라인드. 국내 맞춤제작 평균 3일 이내 출고, 레일포함 풀세트, 자석끈·커튼레일 무료. 대표전화 1877-8540.',
  robots: { index: true, follow: true },
  alternates: { canonical: '/', types: { 'application/rss+xml': [{ url: '/rss.xml', title: `${BRAND} 지역별 커튼·블라인드` }] } },
  openGraph: { type: 'website', siteName: BRAND, locale: 'ko_KR', images: ['/images/ba-a-after.webp'] },
  verification: { google: 'HuaVUJokrR1aDCnadVolKFG9SqlpeE0Sy-z_4k39q-w', other: { 'naver-site-verification': '56ebb88c78c237418e0104cc6fde8862cb676785' } },
};

export const viewport: Viewport = { themeColor: '#ffffff', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@500;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
      </head>
      <body>
        <JsonLd data={businessJsonLd()} />
        <Header />
        {children}
        <Footer />
        <StickyBar />
        <Motion />
      </body>
    </html>
  );
}
