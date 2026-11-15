import type { MetadataRoute } from 'next';
import { SITE_URL } from '../lib/site';
import { getPosts, postEncPath } from '../lib/blog';
import { OPEN_PAGES, pageEncodedPath, inSitemap } from '../lib/data';

// 열린 단계 페이지만, 표기 변형은 대표 페이지만
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  // 열린 날을 lastmod 로. 전 페이지에 빌드 시각을 찍으면 수집 우선순위 신호가 사라진다 (seo-monitor). wave 1~15 는 하루 한 단계, 16~31 은 2026-11-15 에 한 번에 열림
  const LAUNCH = Date.UTC(2026, 9, 30);
  const opened = (wave: number) => new Date(LAUNCH + (Math.min(wave, 17) - 1) * 864e5);
  return [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/area/`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/about/`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/blog/`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    ...getPosts().map((p) => ({ url: `${SITE_URL}${postEncPath(p)}`, lastModified: new Date(p.date), changeFrequency: 'monthly' as const, priority: 0.7 })),
    ...OPEN_PAGES.filter(inSitemap).map((p) => ({ url: `${SITE_URL}${pageEncodedPath(p)}`, lastModified: opened(p.wave), changeFrequency: 'monthly' as const, priority: p.level === '동' || p.level === '읍면' ? 0.6 : 0.8 })),
  ];
}
