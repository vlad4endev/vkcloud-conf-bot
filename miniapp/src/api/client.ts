import axios from 'axios';

declare global {
  interface Window {
    MaxBridge?: {
      initData?: string;
      getUserInfo: () => Promise<{ userId: number; name: string }>;
      close: () => void;
      hapticFeedback: (type: 'success' | 'error' | 'warning') => void;
    };
  }
}

export type QuizOption = 'a' | 'b' | 'c' | 'd';

export type ConfigKey =
  | 'event_description'
  | 'chat_url'
  | 'sticker_url'
  | 'map_image_url'
  | 'quiz_url';

export type AppConfig = Record<ConfigKey, string>;

export interface Speaker {
  id: string;
  name: string;
  profession: string | null;
  bio: string;
  photoUrl: string | null;
  order: number;
}

export type SessionTrack = 'all' | 'tech' | 'business';

export interface ScheduleSessionSpeaker {
  id: string;
  name: string;
  profession: string | null;
  photoUrl: string | null;
  order: number;
}

export interface ScheduleSession {
  id: string;
  startTime: string;
  endTime: string;
  title: string;
  description: string | null;
  location: string | null;
  track: SessionTrack;
  order: number;
  createdAt: string;
  updatedAt: string;
  speakers: ScheduleSessionSpeaker[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  order: number;
}

export interface FeedbackPayload {
  userId?: number;
  text: string;
}

export interface QuestionPayload {
  userId: number;
  question: string;
}

export interface QuizAnswerPayload {
  userId: number;
  questionId: string;
  answer: QuizOption;
}

export interface QuizAnswerResult {
  isCorrect: boolean;
  correctOption: QuizOption;
}

export interface QuizStatus {
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  isWinner: boolean;
}

export interface CreatedResource {
  id: string;
}

export interface MeResponse {
  maxUserId: number;
  isVerified: boolean;
  fullName?: string;
}

export const UNAUTHORIZED_ERROR = 'Пользователь не авторизован';

function requireUserId(userId: number | undefined | null): number {
  if (userId == null || !Number.isInteger(userId) || userId <= 0) {
    throw new Error(UNAUTHORIZED_ERROR);
  }
  return userId;
}

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const initData = window.WebApp?.initData ?? window.MaxBridge?.initData;
  if (initData) {
    config.headers.set('X-Max-Init-Data', initData);
  }
  return config;
});

export async function getMe(): Promise<MeResponse> {
  const { data } = await api.get<MeResponse>('/me');
  return data;
}

export async function getConfig(): Promise<AppConfig> {
  const { data } = await api.get<AppConfig>('/config');
  return data;
}

export async function getSpeakers(): Promise<Speaker[]> {
  const { data } = await api.get<Speaker[]>('/speakers');
  return data;
}

export async function getSpeakerById(id: string): Promise<Speaker> {
  const { data } = await api.get<Speaker>(`/speakers/${id}`);
  return data;
}

export async function getSchedule(): Promise<ScheduleSession[]> {
  const { data } = await api.get<ScheduleSession[]>('/schedule');
  return data;
}

export async function postFeedback(
  payload: FeedbackPayload,
): Promise<CreatedResource> {
  const { data } = await api.post<CreatedResource>('/feedback', payload);
  return data;
}

export async function postQuestion(
  speakerId: string,
  payload: QuestionPayload,
): Promise<CreatedResource> {
  requireUserId(payload.userId);
  const { data } = await api.post<CreatedResource>(
    `/speakers/${speakerId}/questions`,
    payload,
  );
  return data;
}

export async function getQuizQuestions(): Promise<QuizQuestion[]> {
  const { data } = await api.get<QuizQuestion[]>('/quiz/questions');
  return data;
}

export async function postQuizAnswer(
  payload: QuizAnswerPayload,
): Promise<QuizAnswerResult> {
  requireUserId(payload.userId);
  const { data } = await api.post<QuizAnswerResult>('/quiz/answer', payload);
  return data;
}

export async function getQuizStatus(userId: number): Promise<QuizStatus> {
  const validUserId = requireUserId(userId);
  const { data } = await api.get<QuizStatus>(`/quiz/status/${validUserId}`);
  return data;
}
