import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient, QuizCorrectOption } from '@prisma/client';

const prisma = new PrismaClient();

const CONFIG_ENTRIES = [
  { key: 'chat_url', value: '' },
  { key: 'sticker_url', value: '' },
  { key: 'map_image_url', value: '' },
  {
    key: 'event_description',
    value: 'VK Cloud Conf 2026 — конференция об облачных технологиях',
  },
  { key: 'quiz_url', value: '' },
  {
    key: 'bot_welcome',
    value:
      'Добро пожаловать на VK Cloud Conf 2026! Здесь вы найдёте программу, спикеров, карту площадки и квиз.',
  },
] as const;

const QUIZ_QUESTIONS = [
  {
    question: 'Какой сервис VK Cloud используется для виртуальных машин?',
    optionA: 'Cloud Servers',
    optionB: 'Cloud Storage',
    optionC: 'Cloud CDN',
    optionD: 'Cloud DNS',
    correctOption: QuizCorrectOption.a,
    order: 1,
  },
  {
    question: 'Какой протокол чаще всего используют для безопасного доступа к API?',
    optionA: 'FTP',
    optionB: 'HTTPS',
    optionC: 'Telnet',
    optionD: 'SMTP',
    correctOption: QuizCorrectOption.b,
    order: 2,
  },
  {
    question: 'Что из перечисленного относится к managed-сервисам в облаке?',
    optionA: 'Самостоятельная установка PostgreSQL на VM',
    optionB: 'Managed Kubernetes',
    optionC: 'Локальный NAS',
    optionD: 'USB-накопитель',
    correctOption: QuizCorrectOption.b,
    order: 3,
  },
] as const;

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash('Admin123!', 10);

  const admin = await prisma.admin.upsert({
    where: { email: 'admin@vkcloud.ru' },
    create: {
      email: 'admin@vkcloud.ru',
      password: passwordHash,
      name: 'Администратор',
    },
    update: {
      password: passwordHash,
      name: 'Администратор',
    },
  });

  console.log('Admin upserted:', admin.email);

  for (const { key, value } of CONFIG_ENTRIES) {
    const config = await prisma.config.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });

    console.log('Config upserted:', config.key);
  }

  for (const quizQuestion of QUIZ_QUESTIONS) {
    const record = await prisma.quizQuestion.upsert({
      where: { order: quizQuestion.order },
      create: quizQuestion,
      update: quizQuestion,
    });

    console.log('Quiz question upserted:', record.order);
  }
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
