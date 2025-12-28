// lib/prisma.ts
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-var */

// ✅ TSの "no exported member PrismaClient" を回避するため require を使う
const prismaPkg = require('@prisma/client') as any;
const PrismaClientCtor = prismaPkg?.PrismaClient;

declare global {
  // eslint-disable-next-line no-var
  var prisma: any | undefined;
}

export const prisma =
  global.prisma ??
  (PrismaClientCtor
    ? new PrismaClientCtor()
    : (() => {
        throw new Error(
          'PrismaClient is not available. Check @prisma/client installation and prisma generate.'
        );
      })());

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
