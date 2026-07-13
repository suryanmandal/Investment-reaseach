import { PrismaClient } from "@prisma/client";
import path from "path";

const globalForPrisma = global as unknown as { prisma: any };

if (globalForPrisma.prisma && !globalForPrisma.prisma.user) {
  // Clear cached client if schema has been updated with User model
  delete globalForPrisma.prisma;
}

// Compute the absolute path to the SQLite database to avoid relative path errors in Next.js HMR/Turbopack
const dbPath = path.join(process.cwd(), "prisma", "dev.db");
const dbUrl = `file:${dbPath}`;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
