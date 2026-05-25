export type TrackId = 'all' | 'tech' | 'business';

export type SessionKind =
  | 'registration'
  | 'keynote'
  | 'talk'
  | 'case'
  | 'break'
  | 'secret'
  | 'networking';

export interface Speaker {
  name: string;
  role: string;
  company: string;
  avatar?: string;
}

export interface ScheduleItem {
  id: string;
  time: string;
  endTime: string;
  title: string;
  description: string;
  track: TrackId;
  tags: string[];
  kind: SessionKind;
  speakers: Speaker[];
}

export interface TrackTab {
  id: TrackId;
  label: string;
  shortLabel: string;
}

export const trackTabs: TrackTab[] = [
  { id: 'all', label: 'Общий трек', shortLabel: 'Общий' },
  { id: 'tech', label: 'Технологический трек', shortLabel: 'Технологии' },
  { id: 'business', label: 'Бизнес-трек', shortLabel: 'Бизнес' },
];

const avatar = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=005ff9&color=fff&size=128&bold=true`;

export const scheduleData: ScheduleItem[] = [
  {
    id: 'reg',
    time: '10:00',
    endTime: '11:00',
    title: 'Регистрация и приветственный фуршет',
    description:
      'Встреча участников, сбор бейджей и неформальное общение перед открытием конференции.',
    track: 'all',
    tags: ['Сервис'],
    kind: 'registration',
    speakers: [],
  },
  {
    id: 'opening',
    time: '11:05',
    endTime: '11:10',
    title: 'Приветственное слово. Открытие конференции',
    description: 'Официальное открытие VK Cloud Conf 2026.',
    track: 'all',
    tags: ['Общий трек'],
    kind: 'talk',
    speakers: [
      {
        name: 'Павел Гонтарев',
        role: 'Генеральный директор',
        company: 'VK Tech',
        avatar: avatar('Павел Гонтарев'),
      },
    ],
  },
  {
    id: 'keynote',
    time: '11:10',
    endTime: '11:30',
    title: 'Облачное будущее: Key trends и стратегия развития VK Cloud',
    description:
      'Ключевые тренды облачного рынка и стратегические приоритеты развития платформы VK Cloud на ближайшие годы.',
    track: 'all',
    tags: ['KeyNote', 'Облако'],
    kind: 'keynote',
    speakers: [
      {
        name: 'Дмитрий Лазаренко',
        role: 'Директор направлений Облачная платформа и Дата-сервисы',
        company: 'VK Tech',
        avatar: avatar('Дмитрий Лазаренко'),
      },
    ],
  },
  {
    id: 'ai-research',
    time: '11:30',
    endTime: '11:50',
    title:
      'Исследование рынка ИИ в России в 2025 году, прогноз развития рынка на 2026–2030 годы',
    description:
      'Где сейчас находится российский рынок ИИ, какие сегменты растут быстрее всего и что ждёт отрасль до 2030 года. Структура рынка по четырём сегментам, объём и расстановка сил в 2025 году, прогноз на 2026–2030: на чём будет расти рынок и что его тормозит.',
    track: 'all',
    tags: ['Data', 'ИИ', 'Аналитика'],
    kind: 'talk',
    speakers: [
      {
        name: 'Василий Пименов',
        role: 'Аналитик',
        company: 'Apple Hills Digital',
        avatar: avatar('Василий Пименов'),
      },
    ],
  },
  {
    id: 'ai-strategy',
    time: '11:50',
    endTime: '12:10',
    title: 'Запуск ИИ-решений: от автоматизации к стратегии',
    description:
      'Как компании переходят от точечных ИИ-экспериментов к масштабированию: особенности развития ИИ-агентов, обзор кейсов и решений. Где ИИ-агенты реально ускоряют задачи и почему критические решения остаются за человеком.',
    track: 'all',
    tags: ['ИИ', 'Бизнес'],
    kind: 'talk',
    speakers: [
      {
        name: 'Роман Стятюгин',
        role: 'Руководитель направления искусственного интеллекта',
        company: 'VK Tech',
        avatar: avatar('Роман Стятюгин'),
      },
    ],
  },
  {
    id: 'ai-data',
    time: '12:10',
    endTime: '12:30',
    title: 'AI-агент начинается не с LLM, а с данных',
    description:
      'Как подготовить корпоративные данные, чтобы AI-агенты работали в контексте компании. Где хранить корпоративную память, как готовить данные для ML и RAG-сценариев, как управлять доступами и качеством.',
    track: 'all',
    tags: ['Data', 'ИИ', 'ML'],
    kind: 'talk',
    speakers: [
      {
        name: 'Екатерина Канунникова',
        role: 'Директор по продуктам направления Дата-сервисы',
        company: 'VK Tech',
        avatar: avatar('Екатерина Канунникова'),
      },
    ],
  },
  {
    id: 'secure-cloud',
    time: '12:30',
    endTime: '12:50',
    title:
      'VK Secure Cloud: облачная инфраструктура с максимальным уровнем аттестации для ГИС и ЗОКИИ',
    description:
      'Новое защищённое облако с аттестацией К1, УЗ1, ЗОКИИ до 1 категории. Как субъекты КИИ и операторы крупных ИСПДн могут запустить критичные системы в аттестованном контуре за недели вместо месяцев.',
    track: 'all',
    tags: ['Security', 'Облако'],
    kind: 'talk',
    speakers: [
      {
        name: 'Глеб Сердитых',
        role: 'Руководитель группы архитекторов',
        company: 'VK Tech',
        avatar: avatar('Глеб Сердитых'),
      },
    ],
  },
  {
    id: 'bare-metal',
    time: '12:50',
    endTime: '13:10',
    title: 'Bare Metal в облаке: чему нас научил первый год',
    description:
      'Путь сервиса от нового продукта до полноценного элемента облачной платформы: улучшения в инфраструктуре, управлении, скорости запуска, надёжности и клиентском опыте. Успешные кейсы и планы развития.',
    track: 'all',
    tags: ['DevOps', 'Инфраструктура'],
    kind: 'case',
    speakers: [
      {
        name: 'Александр Федотов',
        role: 'Ведущий менеджер продукта Bare Metal',
        company: 'VK Tech',
        avatar: avatar('Александр Федотов'),
      },
    ],
  },
  {
    id: 'secret-main',
    time: '13:10',
    endTime: '13:30',
    title: 'Секретный доклад',
    description: 'Содержание будет объявлено на конференции.',
    track: 'all',
    tags: ['Сюрприз'],
    kind: 'secret',
    speakers: [],
  },
  {
    id: 'lunch',
    time: '13:30',
    endTime: '14:30',
    title: 'Обед',
    description: 'Перерыв на обед. Параллельно работают технологический и бизнес-треки.',
    track: 'all',
    tags: ['Перерыв'],
    kind: 'break',
    speakers: [],
  },
  {
    id: 'tech-security',
    time: '14:30',
    endTime: '14:50',
    title:
      'Доверенная среда разработки: как обеспечить чистоту кода и закрыть риски внедрения вредоносного ПО',
    description:
      'VK Security Gate — единый контур контроля цепочки поставки кода: вредоносные зависимости, скомпрометированные образы, уязвимости в сторонних компонентах. Как встроить проверки в CI/CD без потери скорости.',
    track: 'tech',
    tags: ['Security', 'DevOps'],
    kind: 'talk',
    speakers: [
      {
        name: 'Игорь Игнатьев',
        role: 'Директор департамента защиты приложений',
        company: 'VK',
        avatar: avatar('Игорь Игнатьев'),
      },
    ],
  },
  {
    id: 'tech-k8s',
    time: '14:50',
    endTime: '15:10',
    title:
      'Kubernetes без границ: Managed Kubernetes как вычислительный центр для ИИ',
    description:
      'Managed Kubernetes в VK Cloud для ИИ-нагрузок: автоматизация, эластичность, работа с большими массивами данных. Архитектура на Bare Metal и прямой доступ к GPU.',
    track: 'tech',
    tags: ['DevOps', 'ИИ', 'Kubernetes'],
    kind: 'talk',
    speakers: [
      {
        name: 'Александр Прохоров',
        role: 'Эксперт команды Developer Productivity в VK Cloud',
        company: 'VK Tech',
        avatar: avatar('Александр Прохоров'),
      },
    ],
  },
  {
    id: 'tech-network',
    time: '15:10',
    endTime: '15:30',
    title:
      'Как построить единую L2-инфраструктуру для ВМ, Bare Metal и On-Premise',
    description:
      'Связь виртуальных машин, Bare Metal и On-Premise в едином контуре с L2-связностью. Архитектура сети VK Cloud, сетевая автоматизация и единое управление.',
    track: 'tech',
    tags: ['DevOps', 'Сеть'],
    kind: 'talk',
    speakers: [
      {
        name: 'Антон Юрищев',
        role: 'Ведущий менеджер продуктов сети (SDN Sprut, Direct Connect)',
        company: 'VK Tech',
        avatar: avatar('Антон Юрищев'),
      },
    ],
  },
  {
    id: 'tech-s3',
    time: '15:30',
    endTime: '15:50',
    title: 'Бэкап, который нельзя удалить: S3 Object Lock в VK Cloud',
    description:
      'S3 Object Lock с Compliance, Retention Period и Legal Hold. Техническая архитектура защиты, интеграция с Cloud Backup и соответствие 152-ФЗ.',
    track: 'tech',
    tags: ['Data', 'Security', 'S3'],
    kind: 'talk',
    speakers: [
      {
        name: 'Полина Ткачук',
        role: 'Менеджер продукта Backup',
        company: 'VK Tech',
        avatar: avatar('Полина Ткачук'),
      },
      {
        name: 'Александр Клочков',
        role: 'Менеджер продукта VK Object Storage',
        company: 'VK Tech',
        avatar: avatar('Александр Клочков'),
      },
    ],
  },
  {
    id: 'tech-tarantool',
    time: '15:50',
    endTime: '16:10',
    title: 'Как не разориться на оперативке при использовании in-memory СУБД',
    description:
      'Tarantool Database и Column Store в хайлоад-сценариях: архитектура охлаждения и прогрева, принципы работы и влияние на стоимость инфраструктуры.',
    track: 'tech',
    tags: ['Data', 'DevOps'],
    kind: 'talk',
    speakers: [
      {
        name: 'Руслан Галиев',
        role: 'Руководитель команды коробочных продуктов Tarantool',
        company: 'VK Tech',
        avatar: avatar('Руслан Галиев'),
      },
    ],
  },
  {
    id: 'tech-lakehouse',
    time: '16:10',
    endTime: '16:30',
    title: 'Lakehouse 2026: как мы строим современную платформу данных',
    description:
      'Lakehouse для production: S3, каталог метаданных, дата-каталог и интерфейсы для аналитиков, ML и AI. Ошибки и выводы 2024–2025, планы 2026+ и развитие VK Data Platform.',
    track: 'tech',
    tags: ['Data', 'Lakehouse'],
    kind: 'talk',
    speakers: [
      {
        name: 'Секретный спикер',
        role: 'Спикер',
        company: 'VK Tech',
        avatar: avatar('Секрет'),
      },
    ],
  },
  {
    id: 'biz-lenta',
    time: '14:30',
    endTime: '14:50',
    title:
      '«Цифровой клон» покупателя: как «Лента» превращает терабайты транзакций в живой диалог с ИИ',
    description:
      'ИИ для воссоздания профилей клиентов, автоматической генерации идей, персональных акций и рекомендаций. Переход от транзакций к осмысленным выводам и интеграция в CRM.',
    track: 'business',
    tags: ['ИИ', 'Retail', 'Кейс'],
    kind: 'case',
    speakers: [
      {
        name: 'Артем Котов',
        role: 'Директор по продвинутой аналитике',
        company: '«Лента»',
        avatar: avatar('Артем Котов'),
      },
    ],
  },
  {
    id: 'biz-treasury',
    time: '14:50',
    endTime: '15:10',
    title:
      'Как Федеральное казначейство ускорило работу ГИС «Электронный бюджет» с помощью объектного хранилища',
    description:
      'Кейс ускорения государственной информационной системы за счёт объектного хранилища VK Cloud.',
    track: 'business',
    tags: ['Гос', 'Кейс', 'S3'],
    kind: 'case',
    speakers: [],
  },
  {
    id: 'biz-secret',
    time: '15:10',
    endTime: '15:30',
    title: 'Секретный доклад',
    description: 'Содержание будет объявлено на конференции.',
    track: 'business',
    tags: ['Сюрприз'],
    kind: 'secret',
    speakers: [],
  },
  {
    id: 'biz-discussion',
    time: '15:30',
    endTime: '16:30',
    title: 'Секретная дискуссия',
    description: 'Закрытая дискуссия для участников бизнес-трека.',
    track: 'business',
    tags: ['Дискуссия'],
    kind: 'secret',
    speakers: [],
  },
  {
    id: 'afterparty',
    time: '16:30',
    endTime: '22:00',
    title: 'Afterparty: фуршет, музыка, нетворкинг',
    description:
      'Фуршет, музыкальная программа, нетворкинг и уличная лаунж-зона от VK.',
    track: 'all',
    tags: ['Нетворкинг'],
    kind: 'networking',
    speakers: [],
  },
];

export function filterByTrack(track: TrackId): ScheduleItem[] {
  if (track === 'all') {
    return scheduleData.filter((item) => item.track === 'all');
  }
  return scheduleData.filter((item) => item.track === track);
}

export const tagStyles: Record<string, string> = {
  KeyNote: 'bg-[#005ff9]/20 text-[#5eb0ff] border-[#005ff9]/40',
  DevOps: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  Data: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  ИИ: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30',
  Security: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  Бизнес: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  Кейс: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  default: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
};

export function getTagClass(tag: string): string {
  return tagStyles[tag] ?? tagStyles.default;
}
