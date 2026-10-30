import type { MetadataRoute } from 'next';
import { SITE_URL } from '../lib/site';
import { OPEN_PAGES, pageEncodedPath, inSitemap } from '../lib/data';

// 열린 단계 페이지만, 표기 변형은 대표 페이지만
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/area/`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    ...OPEN_PAGES.filter(inSitemap).map((p) => ({ url: `${SITE_URL}${pageEncodedPath(p)}`, lastModified: now, changeFrequency: 'monthly' as const, priority: p.level === '동' || p.level === '읍면' ? 0.6 : 0.8 })),
  ];
}
