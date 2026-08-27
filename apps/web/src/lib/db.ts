import { PrismaClient } from "@prisma/client";

// Next.js dev hot-reload re-evaluates this module on every edit, which
// would otherwise open a fresh MongoDB connection pool each time. Cache
// the client on the Node global so we reuse the same instance across
// reloads; production (one instance per serverless invocation) doesn't
// need this but it's harmless there too.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
