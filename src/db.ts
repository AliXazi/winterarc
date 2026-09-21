import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

export function cleanDatabaseUrl(raw: string): string {
  let url = (raw || '').trim();
  if (
    url.length >= 2 &&
    ((url.startsWith('"') && url.endsWith('"')) || (url.startsWith("'") && url.endsWith("'")))
  ) {
    url = url.slice(1, -1).trim();
  }
  // Convert standard postgres URL if necessary
  if (url.startsWith('postgres://')) {
    url = url.replace('postgres://', 'postgresql://');
  }
  return url;
}

export function getDb(databaseUrl: string): NeonQueryFunction<false, false> {
  const cleaned = cleanDatabaseUrl(databaseUrl);
  return neon(cleaned);
}
