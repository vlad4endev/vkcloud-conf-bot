import type { Bot, Context } from '@maxhub/max-bot-api';
import { Keyboard } from '@maxhub/max-bot-api';
import type { QuizCorrectOption, QuizQuestion, User } from '@prisma/client';
import { prisma } from '../../db/client';
import { ensureBotUser } from '../services/user';

const QUIZ_ANSWER_PREFIX = 'quiz:';
const OPTION_LABELS: Record<QuizCorrectOption, string> = {
  a: 'A',
  b: 'B',
  c: 'C',
  d: 'D',
};

function buildPayload(questionId: string, option: QuizCorrectOption): string {
  return `${QUIZ_ANSWER_PREFIX}${questionId}:${option}`;
}

function parsePayload(payload: string): { questionId: string; option: QuizCorrectOption } | null {
  if (!payload.startsWith(QUIZ_ANSWER_PREFIX)) {
    return null;
  }
  const rest = payload.slice(QUIZ_ANSWER_PREFIX.length);
  const [questionId, option] = rest.split(':');
  if (!questionId || !option) {
    return null;
  }
  if (!['a', 'b', 'c', 'd'].includes(option)) {
    return null;
  }
  return { questionId, option: option as QuizCorrectOption };
}

function optionText(question: QuizQuestion, option: QuizCorrectOption): string {
  const map = {
    a: question.optionA,
    b: question.optionB,
    c: question.optionC,
    d: question.optionD,
  };
  return map[option];
}

function questionKeyboard(question: QuizQuestion) {
  const options: QuizCorrectOption[] = ['a', 'b', 'c', 'd'];
  return {
    attachments: [
      Keyboard.inlineKeyboard([
        options.map((option) =>
          Keyboard.button.callback(
            `${OPTION_LABELS[option]}. ${optionText(question, option)}`,
            buildPayload(question.id, option),
          ),
        ),
      ]),
    ],
  };
}

async function getNextQuestion(userId: string): Promise<QuizQuestion | null> {
  const answered = await prisma.quizResult.findMany({
    where: { userId },
    select: { questionId: true },
  });
  const answeredIds = answered.map((r) => r.questionId);

  return prisma.quizQuestion.findFirst({
    where: { id: { notIn: answeredIds } },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  });
}

async function getScore(userId: string) {
  const [total, correct] = await Promise.all([
    prisma.quizResult.count({ where: { userId } }),
    prisma.quizResult.count({ where: { userId, isCorrect: true } }),
  ]);
  return { total, correct };
}

export async function sendQuizQuestion(
  ctx: Context,
  question: QuizQuestion,
  intro?: string,
): Promise<void> {
  const header = intro ?? `Вопрос (${OPTION_LABELS.a}–${OPTION_LABELS.d}):`;
  await ctx.reply(`${header}\n\n${question.question}`, questionKeyboard(question));
}

export async function sendQuizSummary(ctx: Context, user: User): Promise<void> {
  const questionsTotal = await prisma.quizQuestion.count();
  const { total, correct } = await getScore(user.id);

  await ctx.reply(
    `🎯 Квиз завершён!\n\nПравильных ответов: ${correct} из ${questionsTotal}.\nВы ответили на ${total} вопрос(ов).`,
  );
}

export async function startQuiz(ctx: Context): Promise<void> {
  const user = await ensureBotUser(ctx);
  if (!user) {
    await ctx.reply('Не удалось определить пользователя. Попробуйте /start');
    return;
  }

  const total = await prisma.quizQuestion.count();
  if (total === 0) {
    await ctx.reply('Квиз ещё не готов. Следите за обновлениями!');
    return;
  }

  const next = await getNextQuestion(user.id);
  if (!next) {
    await sendQuizSummary(ctx, user);
    return;
  }

  const { correct } = await getScore(user.id);
  const intro =
    correct > 0
      ? 'Следующий вопрос:'
      : '🧠 Квиз VK Cloud Conf 2026\n\nВыберите правильный ответ:';

  await sendQuizQuestion(ctx, next, intro);
}

export function registerQuizHandlers(bot: Bot): void {
  bot.command('quiz', (ctx) => startQuiz(ctx));

  bot.action(new RegExp(`^${QUIZ_ANSWER_PREFIX}`), async (ctx) => {
    const payload = ctx.callback?.payload;
    if (!payload) {
      return;
    }

    const parsed = parsePayload(payload);
    if (!parsed) {
      await ctx.answerOnCallback({ notification: 'Некорректный ответ' });
      return;
    }

    const user = await ensureBotUser(ctx);
    if (!user) {
      await ctx.answerOnCallback({ notification: 'Ошибка пользователя' });
      return;
    }

    const question = await prisma.quizQuestion.findUnique({
      where: { id: parsed.questionId },
    });

    if (!question) {
      await ctx.answerOnCallback({ notification: 'Вопрос не найден' });
      return;
    }

    const existing = await prisma.quizResult.findUnique({
      where: {
        userId_questionId: {
          userId: user.id,
          questionId: question.id,
        },
      },
    });

    if (existing) {
      await ctx.answerOnCallback({ notification: 'Вы уже отвечали на этот вопрос' });
      const next = await getNextQuestion(user.id);
      if (next) {
        await sendQuizQuestion(ctx, next, 'Следующий вопрос:');
      } else {
        await sendQuizSummary(ctx, user);
      }
      return;
    }

    const isCorrect = question.correctOption === parsed.option;

    await prisma.quizResult.create({
      data: {
        userId: user.id,
        questionId: question.id,
        answer: parsed.option,
        isCorrect,
      },
    });

    await ctx.answerOnCallback({
      notification: isCorrect ? '✅ Верно!' : '❌ Неверно',
    });

    const next = await getNextQuestion(user.id);
    if (next) {
      await sendQuizQuestion(ctx, next, 'Следующий вопрос:');
    } else {
      await sendQuizSummary(ctx, user);
    }
  });
}
