// 커튼 가이드 글 로더 — content/blog/*.md (프런트매터 + '## 소제목' 문단·불릿).
// 공개일(date)이 오늘(KST, env BUILD_DATE 우선)보다 뒤인 글은 목록·글·사이트맵·RSS·og 에서 뺀다 → 미리 써 두고 날짜대로 열린다.
// '_' 로 시작하는 파일(_example.md 등)은 읽지 않는다.
import fs from 'node:fs';
import path from 'node:path';

export type Post = { slug: string; title: string; description: string; keyword: string; date: string; sections: { h: string; p: string[]; list: string[] }[] };

const DIR = path.join(process.cwd(), 'content', 'blog');
const today = () => process.env.BUILD_DATE || new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);

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
  return { slug: meta.slug, title: meta.title, description: meta.description || '', keyword: meta.keyword || '', date: meta.date, sections };
}

let cache: Post[] | null = null;
export function getPosts(): Post[] {
  if (cache) return cache;
  let files: string[] = [];
  try { files = fs.readdirSync(DIR).filter((f) => f.endsWith('.md') && !f.startsWith('_')); } catch {}
  const t = today();
  cache = files.map((f) => parse(fs.readFileSync(path.join(DIR, f), 'utf-8'))).filter((p): p is Post => !!p && p.date <= t)
    .sort((a, b) => b.date.localeCompare(a.date));
  return cache;
}
export const getPost = (slug: string) => getPosts().find((p) => p.slug === decodeURIComponent(slug));
export const postPath = (p: Post) => `/blog/${p.slug}/`;
export const postEncPath = (p: Post) => `/blog/${encodeURIComponent(p.slug)}/`;
// 대표 사진 — 실제 시공 사례 사진을 slug 로 고정 선택 (og·목록·본문 공용)
const CASES = fs.readdirSync(path.join(process.cwd(), 'public', 'images')).filter((f) => f.startsWith('case-')).sort();
export const postImage = (p: Post) => `/images/${CASES[[...p.slug].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % CASES.length]}`;
