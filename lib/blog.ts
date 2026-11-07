// 커튼 가이드 글 로더 — content/blog/*.md (프런트매터 + '## 소제목' 문단·불릿).
// 공개일(date)이 오늘(KST, env BUILD_DATE 우선)보다 뒤인 글은 목록·글·사이트맵·RSS·og 에서 뺀다 → 미리 써 두고 날짜대로 열린다.
// '_' 로 시작하는 파일(_example.md 등)은 읽지 않는다.
import fs from 'node:fs';
import path from 'node:path';

// time(선택, 'HH:MM'): 같은 날 안에서 공개 시각. 없으면 00:00 → 그날 첫 빌드부터 보임. 오후 글은 `time: 14:00`
export type Post = { slug: string; title: string; description: string; keyword: string; date: string; time: string; sections: { h: string; p: string[]; list: string[] }[] };

const DIR = path.join(process.cwd(), 'content', 'blog');
// 'YYYY-MM-DDTHH:MM' (KST). BUILD_DATE 가 날짜만이면 그날 00:00 기준
const now = () => process.env.BUILD_DATE || new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 16);

function parse(raw: string): Post | null {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) return null;
  const meta: Record<string, string> = {};
  for (const line of m[1].split(/\r?\n/)) {
    const k = line.indexOf(':');
    if (k > 0) meta[line.slice(0, k).trim()] = line.slice(k + 1).trim().replace(/^"(.*)"$/, '$1');
  }
  const sections: Post['sections'] = [];
  let cur: Post['sections'][number] | null = null;
  for (const line of m[2].split(/\r?\n/)) {
    const h = line.match(/^##\s+(.*)$/);
    if (h) { if (cur) sections.push(cur); cur = { h: h[1].trim(), p: [], list: [] }; continue; }
    if (!cur) continue;
    const li = line.match(/^[-*]\s+(.*)$/);
    if (li) cur.list.push(li[1].trim()); else if (line.trim()) cur.p.push(line.trim());
  }
  if (cur) sections.push(cur);
  if (!meta.slug || !meta.title || !meta.date) return null;
  return { slug: meta.slug, title: meta.title, description: meta.description || '', keyword: meta.keyword || '', date: meta.date, time: meta.time || '00:00', sections };
}

let cache: Post[] | null = null;
export function getPosts(): Post[] {
  if (cache) return cache;
  let files: string[] = [];
  try { files = fs.readdirSync(DIR).filter((f) => f.endsWith('.md') && !f.startsWith('_')); } catch {}
  const t = now();
  const at = (p: Post) => `${p.date}T${p.time}`;
  cache = files.map((f) => parse(fs.readFileSync(path.join(DIR, f), 'utf-8'))).filter((p): p is Post => !!p && at(p) <= t)
    .sort((a, b) => at(b).localeCompare(at(a)));
  return cache;
}
export const getPost = (slug: string) => getPosts().find((p) => p.slug === decodeURIComponent(slug));
export const postPath = (p: Post) => `/blog/${p.slug}/`;
export const postEncPath = (p: Post) => `/blog/${encodeURIComponent(p.slug)}/`;
// 대표 사진 — 커튼 시공 후 사진(1200×900) 6장 중 slug 로 고정 선택 (og·목록·본문 공용). 시공 사례(case-*)는 230px 썸네일이라 안 씀
const PHOTOS = ['a', 'b', 'c', 'd', 'e', 'f'];
export const postImage = (p: Post) => `/images/ba-${PHOTOS[[...p.slug].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % PHOTOS.length]}-after.webp`;
