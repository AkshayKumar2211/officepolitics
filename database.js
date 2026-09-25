import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

export function createDatabase() {
 if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL in .env before starting the game.');
 const adapter = new PrismaPg({connectionString:process.env.DATABASE_URL, connectionTimeoutMillis:10000});
 return new PrismaClient({adapter});
}
