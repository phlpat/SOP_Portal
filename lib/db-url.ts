/**
 * Finds the pooled Postgres connection string in the environment.
 *
 * Plain `DATABASE_URL` wins (local development). The Neon integration on Vercel can add
 * a custom prefix to every variable (for example `SOP_Db_DATABASE_URL`), so prefixed
 * `*_DATABASE_URL` and `*_POSTGRES_URL` are accepted too. Unpooled, Prisma and no-SSL
 * variants are skipped because they do not end in these names.
 */
export function resolveDatabaseUrl(env: Record<string, string | undefined>): string | undefined {
  const exact = env.DATABASE_URL || env.POSTGRES_URL
  if (exact) return exact
  for (const suffix of ['_DATABASE_URL', '_POSTGRES_URL']) {
    const key = Object.keys(env)
      .sort()
      .find((k) => k.endsWith(suffix) && env[k])
    if (key) return env[key]
  }
  return undefined
}
