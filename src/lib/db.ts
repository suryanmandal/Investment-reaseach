import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: any };

if (globalForPrisma.prisma && !globalForPrisma.prisma.user) {
  // Clear cached client if schema has been updated with User model
  delete globalForPrisma.prisma;
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
