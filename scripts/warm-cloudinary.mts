/**
 * warm-cloudinary
 * ---------------
 * One-off backfill: asks Cloudinary for the grid and modal sizes of every
 * gallery photo (and its variants), so Cloudinary creates and stores them now
 * instead of making the first visitor wait for each resize. New uploads are
 * warmed automatically by the admin panel; run this for existing photos, or
 * again whenever the sizes in `src/utils/cloudinary.ts` change.
 *
 * Covers both myeliefoto.se and the wedding site: they share the Cloudinary
 * account and the Supabase project.
 *
 * Usage (Node 22.18+ / 24, which run TypeScript directly):
 *   node scripts/warm-cloudinary.mts --dry-run     list what would be warmed
 *   node scripts/warm-cloudinary.mts --limit 2     warm the first 2 photos only
 *   node scripts/warm-cloudinary.mts               warm everything
 *
 * Reads VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (or
 * VITE_SUPABASE_ANON_KEY) from .env. Only public, read-only data is used.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { cloudinaryWarmUrls, WARM_ACCEPT_HEADERS } from '../src/utils/cloudinary.ts';

const CLOUD_NAME = 'dtscgoycp';
const CONCURRENCY = 4;

/**
 * `f_auto` looks at the browser as well as `Accept`, so present a current
 * desktop browser; otherwise Cloudinary may answer with a plain JPEG and the
 * AVIF/WebP versions visitors get would stay cold.
 */
const BROWSER_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

// --- Arguments --------------------------------------------------------------

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const limitIndex = args.indexOf('--limit');
const limit = limitIndex === -1 ? Infinity : Number(args[limitIndex + 1]);

if (!Number.isFinite(limit) && limitIndex !== -1) {
  console.error('--limit needs a number, e.g. --limit 2');
  process.exit(1);
}

// --- Environment ------------------------------------------------------------

function readEnv() {
  const path = fileURLToPath(new URL('../.env', import.meta.url));
  const env: Record<string, string> = {};
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (match) env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
  }
  return env;
}

const env = readEnv();
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('VITE_SUPABASE_URL and a Supabase key must be set in .env');
  process.exit(1);
}

// --- Collect photos ---------------------------------------------------------

async function supabaseSelect<T>(table: string, select: string): Promise<T[]> {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/${table}?select=${encodeURIComponent(select)}`,
    { headers: { apikey: supabaseKey } },
  );
  if (!response.ok) {
    throw new Error(`Supabase ${table}: ${response.status} ${await response.text()}`);
  }
  return response.json() as Promise<T[]>;
}

interface OrderRow {
  id: string;
  url: string;
  tag: string;
  photo_variants: { url: string }[] | null;
}

/** Same sources as `fetchPhotosByTag`: ordered DB rows plus tagged Cloudinary uploads. */
async function collectPhotoUrls() {
  const [rows, blacklist] = await Promise.all([
    supabaseSelect<OrderRow>('photo_order', 'id,url,tag,photo_variants(url)'),
    supabaseSelect<{ photo_id: string }>('photo_blacklist', 'photo_id'),
  ]);

  const hidden = new Set(blacklist.map((row) => row.photo_id));
  const urls = new Set<string>();

  for (const row of rows) {
    if (hidden.has(row.id)) continue;
    urls.add(row.url);
    for (const variant of row.photo_variants ?? []) urls.add(variant.url);
  }

  // Photos tagged in Cloudinary but not yet ordered in the admin panel still
  // show up at the end of each gallery.
  const knownIds = new Set(rows.map((row) => row.id));
  const tags = [...new Set(rows.map((row) => row.tag))];

  for (const tag of tags) {
    const response = await fetch(`https://res.cloudinary.com/${CLOUD_NAME}/image/list/${tag}.json`);
    if (!response.ok) continue;
    const { resources } = (await response.json()) as {
      resources: { public_id: string; format: string }[];
    };
    for (const resource of resources) {
      if (knownIds.has(resource.public_id) || hidden.has(resource.public_id)) continue;
      urls.add(
        `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${resource.public_id}.${resource.format}`,
      );
    }
  }

  return [...urls];
}

// --- Warm -------------------------------------------------------------------

interface Result {
  url: string;
  status: number;
  type: string;
  ms: number;
  error?: string;
}

async function warm(url: string, accept: string): Promise<Result> {
  const started = Date.now();
  try {
    const response = await fetch(url, {
      headers: { Accept: accept, 'User-Agent': BROWSER_USER_AGENT },
    });
    // Cloudinary has finished creating the image once headers arrive. Drop the
    // body instead of downloading it, to spare the bandwidth quota.
    await response.body?.cancel();
    return {
      url,
      status: response.status,
      type: response.headers.get('content-type') ?? '',
      ms: Date.now() - started,
      error: response.headers.get('x-cld-error') ?? undefined,
    };
  } catch (error) {
    return { url, status: 0, type: '', ms: Date.now() - started, error: String(error) };
  }
}

async function runPool<T>(jobs: (() => Promise<T>)[], onDone: (result: T) => void) {
  let next = 0;
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (next < jobs.length) {
      const job = jobs[next++];
      onDone(await job());
    }
  });
  await Promise.all(workers);
}

const photos = (await collectPhotoUrls()).slice(0, limit);
const targets = photos.flatMap((url) => cloudinaryWarmUrls(url));
const jobs = targets.flatMap((url) => WARM_ACCEPT_HEADERS.map((accept) => () => warm(url, accept)));

console.log(
  `${photos.length} photos → ${targets.length} sizes → ${jobs.length} requests ` +
    `(${WARM_ACCEPT_HEADERS.length} formats each)`,
);

if (dryRun) {
  for (const url of targets.slice(0, 10)) console.log('  ' + url);
  if (targets.length > 10) console.log(`  … and ${targets.length - 10} more`);
  process.exit(0);
}

let done = 0;
const failures: Result[] = [];
const types = new Map<string, number>();
let slowest = 0;

await runPool(jobs, (result) => {
  done++;
  slowest = Math.max(slowest, result.ms);
  types.set(result.type, (types.get(result.type) ?? 0) + 1);
  if (result.status !== 200) failures.push(result);
  if (done % 25 === 0 || done === jobs.length) {
    console.log(`  ${done}/${jobs.length} (${failures.length} failed)`);
  }
});

console.log('\nFormats served:', Object.fromEntries(types));
console.log(`Slowest request: ${slowest} ms`);

if (failures.length) {
  console.log(`\n${failures.length} failed:`);
  for (const failure of failures.slice(0, 20)) {
    console.log(`  ${failure.status} ${failure.url}${failure.error ? ` — ${failure.error}` : ''}`);
  }
  process.exitCode = 1;
}
