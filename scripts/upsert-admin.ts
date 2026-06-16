import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const email = process.argv[2] ?? 'admin@vkcloud.ru';
  const password = process.argv[3] ?? 'Admin123!';
  const name = process.argv[4] ?? 'Администратор';

  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await prisma.admin.upsert({
    where: { email },
    create: { email, password: passwordHash, name },
    update: { password: passwordHash, name },
  });

  console.log(`Admin upserted: ${admin.email} (${admin.id})`);
}

main()
  .catch((error) => {
    console.error('Upsert admin failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
