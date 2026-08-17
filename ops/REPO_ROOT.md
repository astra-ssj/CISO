# Repo root (Phase 0)

The only application root is **this directory** (`CISO/CISO`).

A leftover `package-lock.json` / `dev.db` may exist on the parent `CISO/` folder. Do not run `npm` or Prisma from the parent. Turbopack and Vitest are pinned to this folder (`next.config.ts` `turbopack.root`, `vitest.config.ts` `root`).

GraphJin and OpenNeko must use **Astra Postgres**, never parent or nested SQLite `dev.db`.
