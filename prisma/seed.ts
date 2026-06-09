import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient, QuizCorrectOption } from '@prisma/client';

const prisma = new PrismaClient();

const configDefaults: Record<string, string> = {
  sticker_url: '',
  map_image_url: '',
  quiz_url: '',
  event_description:
    'Покажем, как строить безопасную и производительную инфраструктуру для бизнес-критичных систем в облаке — от высоконагруженных баз данных до ИИ-сервисов. Представим новые сервисы облачной платформы, расскажем про планы развития VK Cloud и эксклюзивно презентуем исследование рынка искусственного интеллекта России с прогнозом развития на 2026–2030 годы',
  bot_welcome:
    'Добро пожаловать в бот конференции VK Cloud Conf 2026! Это официальный бот мероприятия: здесь собрана вся информация о конференции и сервисы для участников. Через бота вы можете посмотреть программу конференции, узнать о спикерах, открыть карту площадки и пройти квиз.',
  partners_visible: 'true',
};

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

const ADMIN_ACCOUNTS = [
  {
    email: 'admin@vkcloud.ru',
    name: 'Администратор',
    password: 'VkC0nf!Admin#2026',
  },
  {
    email: 'polina.shchegoleva@vkteam.ru',
    name: 'Polina Shchegoleva',
    password: 'Polina#VKC!26$A9',
  },
  {
    email: 'p.zavarzina@vk.team',
    name: 'P. Zavarzina',
    password: 'PZav!VKconf@26%R4',
  },
  {
    email: 'olga.nikolaeva@vkteam.ru',
    name: 'Olga Nikolaeva',
    password: 'OlgaN!Cloud#26&K7',
  },
  {
    email: 'alexandra.manager7@gmail.com',
    name: 'Alexandra Manager',
    password: 'AlexM7!VK#2026^Q',
  },
  {
    email: 'kashirskayalina@gmail.com',
    name: 'Lina Kashirskaya',
    password: 'LinaK!Conf@26*Z8',
  },
] as const;

async function main(): Promise<void> {
  for (const adminAccount of ADMIN_ACCOUNTS) {
    const passwordHash = await bcrypt.hash(adminAccount.password, 10);
    const admin = await prisma.admin.upsert({
      where: { email: adminAccount.email },
      create: {
        email: adminAccount.email,
        password: passwordHash,
        name: adminAccount.name,
      },
      update: {
        password: passwordHash,
        name: adminAccount.name,
      },
    });

    console.log('Admin upserted:', admin.email);
  }

  for (const [key, defaultValue] of Object.entries(configDefaults)) {
    const existing = await prisma.config.findUnique({ where: { key } });
    if (existing && existing.value && existing.value.trim() !== '') {
      console.log(`Config kept: ${key} = ${existing.value}`);
      continue;
    }
    await prisma.config.upsert({
      where: { key },
      update: { value: defaultValue },
      create: { key, value: defaultValue },
    });
    console.log(`Config upserted: ${key}`);
  }

  for (const quizQuestion of QUIZ_QUESTIONS) {
    const existing = await prisma.quizQuestion.findFirst({
      where: { order: quizQuestion.order },
      select: { id: true, order: true },
    });

    if (existing) {
      console.log(`Quiz question kept at order ${existing.order}`);
      continue;
    }

    const record = await prisma.quizQuestion.create({ data: quizQuestion });
    console.log('Quiz question created:', record.order);
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
