import { Bot, type Api, type Context, Keyboard } from '@maxhub/max-bot-api';
import { env } from '../shared/env';
import { resolveMaxMiniAppOpenUrl } from '../shared/maxMiniAppLink';
import { registerProgramHandlers } from './handlers/program';
import { registerQuizHandlers } from './handlers/quiz';
import { ensureBotUser } from './services/user';

const WELCOME_TEXT = `Добро пожаловать на VK Cloud Conf 2026!

Здесь вы можете:
• смотреть программу конференции
• задавать вопросы спикерам
• проходить квиз
• оставлять обратную связь

Команды: /help`;

const HELP_TEXT = `Доступные команды:

/start — главное меню
/help — эта справка
/program — программа конференции
/quiz — квиз`;

async function welcomeExtra(api: Api) {
  const openUrl = await resolveMaxMiniAppOpenUrl(api);
  if (!openUrl) {
    return undefined;
  }

  return {
    attachments: [
      Keyboard.inlineKeyboard([
        [Keyboard.button.link('Открыть мини-приложение', openUrl)],
      ]),
    ],
  };
}

export function createBot(): Bot {
  const bot = new Bot(env.BOT_TOKEN);

  bot.catch((err, ctx) => {
    console.error('Bot error:', err, 'update:', ctx.updateType);
  });

  bot.api
    .setMyCommands([
      { name: 'start', description: 'Главное меню' },
      { name: 'help', description: 'Справка' },
      { name: 'program', description: 'Программа конференции' },
      { name: 'quiz', description: 'Квиз' },
    ])
    .catch((err) => console.error('Failed to set bot commands:', err));

  const sendWelcome = async (ctx: Context) => {
    await ensureBotUser(ctx);
    await ctx.reply(WELCOME_TEXT, await welcomeExtra(bot.api));
  };

  bot.on('bot_started', sendWelcome);
  bot.command('start', sendWelcome);
  bot.command('help', (ctx) => ctx.reply(HELP_TEXT));

  registerProgramHandlers(bot);
  registerQuizHandlers(bot);

  bot.on('message_created', async (ctx) => {
    const text = ctx.message?.body.text?.trim();
    if (!text || text.startsWith('/')) {
      return;
    }
    await ctx.reply('Используйте /help, чтобы увидеть список команд.');
  });

  return bot;
}
