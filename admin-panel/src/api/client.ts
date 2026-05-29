import axios from 'axios';
import { normalizeScheduleSession } from '../lib/normalizeSchedule';
import type {
  DashboardStats,
  FeedbackItem,
  LinksConfig,
  LoginResponse,
  QuizQuestion,
  QuizResultsResponse,
  ReorderItem,
  ScheduleSession,
  SessionTrack,
  Speaker,
  Notification,
  Partner,
  SpeakerQuestion,
  TextsConfig,
  User,
} from './types';

const TOKEN_KEY = 'admin_token';
const ADMIN_KEY = 'admin_info';

const api = axios.create({
  baseURL: '/admin',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url ?? '';
    const hadToken = Boolean(getStoredToken());

    if (error.response?.status === 401 && !url.includes('/login') && hadToken) {
      clearSession();
      const next = encodeURIComponent(
        `${window.location.pathname}${window.location.search}`,
      );
      window.location.assign(`/panel/login?expired=1&next=${next}`);
    }

    return Promise.reject(error);
  },
);

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ADMIN_KEY);
}

export function saveSession(token: string, admin: LoginResponse['admin']): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
}

export function getStoredAdmin(): LoginResponse['admin'] | null {
  const raw = localStorage.getItem(ADMIN_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LoginResponse['admin'];
  } catch {
    return null;
  }
}

export async function login(
  email: string,
  password: string,
  codeWord: string,
): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/login', {
    email,
    password,
    codeWord,
  });
  saveSession(data.token, data.admin);
  return data;
}

export async function getStats(): Promise<DashboardStats> {
  const { data } = await api.get<DashboardStats>('/stats');
  return data;
}

export async function getUsers(search?: string): Promise<User[]> {
  const { data } = await api.get<User[]>('/users', {
    params: search ? { search } : undefined,
  });
  return data;
}

export async function updateUser(
  id: string,
  payload: Partial<Pick<User, 'fullName' | 'email' | 'isVerified'>>,
): Promise<User> {
  const { data } = await api.patch<User>(`/users/${id}`, payload);
  return data;
}

export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/users/${id}`);
}

export async function getSpeakers(): Promise<Speaker[]> {
  const { data } = await api.get<Speaker[]>('/speakers');
  return data;
}

export async function createSpeaker(payload: {
  name: string;
  profession?: string;
  bio: string;
  order?: number;
}): Promise<Speaker> {
  const { data } = await api.post<Speaker>('/speakers', payload);
  return data;
}

export async function updateSpeaker(
  id: string,
  payload: Partial<{ name: string; profession: string | null; bio: string; order: number }>,
): Promise<Speaker> {
  const { data } = await api.put<Speaker>(`/speakers/${id}`, payload);
  return data;
}

export async function deleteSpeaker(id: string): Promise<void> {
  await api.delete(`/speakers/${id}`);
}

export async function reorderSpeakers(items: ReorderItem[]): Promise<Speaker[]> {
  const { data } = await api.put<Speaker[]>('/speakers/reorder', { items });
  return data;
}

export async function uploadSpeakerPhoto(id: string, file: File): Promise<string> {
  const form = new FormData();
  form.append('photo', file);
  const { data } = await api.post<{ url: string }>(`/speakers/${id}/photo`, form);
  return data.url;
}

export async function deleteSpeakerPhoto(id: string): Promise<void> {
  await api.delete(`/speakers/${id}/photo`);
}

export type AdminPartnersResponse = {
  sectionVisible: boolean;
  partners: Partner[];
};

export async function getPartners(): Promise<AdminPartnersResponse> {
  const { data } = await api.get<AdminPartnersResponse>('/partners');
  return data;
}

export async function setPartnersSectionVisible(visible: boolean): Promise<boolean> {
  const { data } = await api.put<{ sectionVisible: boolean }>('/partners/visibility', {
    visible,
  });
  return data.sectionVisible;
}

export async function createPartner(payload: {
  name: string;
  description?: string;
  url: string;
  order?: number;
}): Promise<Partner> {
  const { data } = await api.post<Partner>('/partners', payload);
  return data;
}

export async function updatePartner(
  id: string,
  payload: Partial<{ name: string; description: string; url: string; order: number }>,
): Promise<Partner> {
  const { data } = await api.put<Partner>(`/partners/${id}`, payload);
  return data;
}

export async function deletePartner(id: string): Promise<void> {
  await api.delete(`/partners/${id}`);
}

export async function reorderPartners(items: ReorderItem[]): Promise<Partner[]> {
  const { data } = await api.put<Partner[]>('/partners/reorder', { items });
  return data;
}

export async function uploadPartnerLogo(id: string, file: File): Promise<string> {
  const form = new FormData();
  form.append('logo', file);
  const { data } = await api.post<{ url: string }>(`/partners/${id}/logo`, form);
  return data.url;
}

export async function deletePartnerLogo(id: string): Promise<void> {
  await api.delete(`/partners/${id}/logo`);
}

export async function getSchedule(): Promise<ScheduleSession[]> {
  const { data } = await api.get<ScheduleSession[]>('/schedule');
  return data.map((session) => normalizeScheduleSession(session));
}

export async function createScheduleSession(payload: {
  startTime: string;
  endTime: string;
  title: string;
  description?: string;
  location?: string;
  speakerIds?: string[];
  track?: SessionTrack;
  order?: number;
}): Promise<ScheduleSession> {
  const { data } = await api.post<ScheduleSession>('/schedule', payload);
  return data;
}

export async function updateScheduleSession(
  id: string,
  payload: Record<string, unknown>,
): Promise<ScheduleSession> {
  const { data } = await api.put<ScheduleSession>(`/schedule/${id}`, payload);
  return data;
}

export async function deleteScheduleSession(id: string): Promise<void> {
  await api.delete(`/schedule/${id}`);
}

export async function reorderSchedule(items: ReorderItem[]): Promise<ScheduleSession[]> {
  const { data } = await api.put<ScheduleSession[]>('/schedule/reorder', { items });
  return data;
}

export async function getQuizQuestions(): Promise<QuizQuestion[]> {
  const { data } = await api.get<QuizQuestion[]>('/quiz/questions');
  return data;
}

export async function createQuizQuestion(
  payload: Omit<QuizQuestion, 'id' | 'order'> & { order?: number },
): Promise<QuizQuestion> {
  const { data } = await api.post<QuizQuestion>('/quiz/questions', payload);
  return data;
}

export async function updateQuizQuestion(
  id: string,
  payload: Partial<Omit<QuizQuestion, 'id'>>,
): Promise<QuizQuestion> {
  const { data } = await api.put<QuizQuestion>(`/quiz/questions/${id}`, payload);
  return data;
}

export async function deleteQuizQuestion(id: string): Promise<void> {
  await api.delete(`/quiz/questions/${id}`);
}

export async function getQuizResults(): Promise<QuizResultsResponse> {
  const { data } = await api.get<QuizResultsResponse>('/quiz/results');
  return data;
}

export async function deleteQuizParticipant(userId: string): Promise<void> {
  await api.delete(`/quiz/participants/${userId}`);
}

export async function getQuestions(): Promise<SpeakerQuestion[]> {
  const { data } = await api.get<SpeakerQuestion[]>('/questions');
  return data;
}

export async function getFeedback(): Promise<FeedbackItem[]> {
  const { data } = await api.get<FeedbackItem[]>('/feedback');
  return data;
}

export async function getNotifications(
  status?: 'pending' | 'sent',
): Promise<Notification[]> {
  const { data } = await api.get<Notification[]>('/notifications', {
    params: status ? { status } : undefined,
  });
  return data;
}

export async function sendNotification(payload: {
  text: string;
  scheduledAt?: string;
}): Promise<unknown> {
  const { data } = await api.post('/notifications', payload);
  return data;
}

export async function updateNotification(
  id: string,
  payload: { text?: string; scheduledAt?: string },
): Promise<Notification> {
  const { data } = await api.patch<Notification>(`/notifications/${id}`, payload);
  return data;
}

export async function deleteNotification(id: string): Promise<void> {
  await api.delete(`/notifications/${id}`);
}

export async function getLinks(): Promise<LinksConfig> {
  const { data } = await api.get<LinksConfig>('/links');
  return data;
}

export async function updateLinks(
  payload: Partial<Pick<LinksConfig, 'chatUrl' | 'stickerUrl' | 'quizUrl'>>,
): Promise<LinksConfig> {
  const { data } = await api.put<LinksConfig>('/links', payload);
  return data;
}

export async function getTexts(): Promise<TextsConfig> {
  const { data } = await api.get<TextsConfig>('/texts');
  return data;
}

export async function updateTexts(payload: Partial<TextsConfig>): Promise<TextsConfig> {
  const { data } = await api.put<TextsConfig>('/texts', payload);
  return data;
}

export async function uploadMapImage(file: File): Promise<string> {
  const form = new FormData();
  form.append('image', file);
  const { data } = await api.post<{ url: string }>('/config/map-image', form);
  return data.url;
}

export async function deleteMapImage(): Promise<void> {
  await api.delete('/config/map-image');
}
