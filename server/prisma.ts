// server/prisma.ts
import { PrismaClient } from '@prisma/client';

// Declare global prisma type to avoid TypeScript error
declare global {
  var prisma: PrismaClient | undefined;
}

let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    log: ['error'],
  });
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'], // Verbose logging for dev
    });
  }
  prisma = global.prisma;
}

// Handle disconnection on process exit
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
});

export default prisma;