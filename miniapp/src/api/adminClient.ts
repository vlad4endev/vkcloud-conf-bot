import axios from 'axios';

const TOKEN_KEY = 'miniapp_admin_token';

export interface AdminSession {
  token: string;
  admin: { id: string; email: string; name: string };
}

const adminApi = axios.create({ baseURL: '/admin' });

adminApi.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  const initData = window.WebApp?.initData ?? window.MaxBridge?.initData;
  if (initData) {
    config.headers.set('X-Max-Init-Data', initData);
  }
  return config;
});

const publicApi = axios.create({ baseURL: '/api' });

publicApi.interceptors.request.use((config) => {
  const initData = window.WebApp?.initData ?? window.MaxBridge?.initData;
  if (initData) {
    config.headers.set('X-Max-Init-Data', initData);
  }
  return config;
});

export function getAdminToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function saveAdminSession(session: AdminSession): void {
  sessionStorage.setItem(TOKEN_KEY, session.token);
}

export function clearAdminSession(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}

export async function unlockAdmin(codeWord: string): Promise<AdminSession> {
  const { data } = await publicApi.post<AdminSession>('/admin/unlock', { codeWord });
  saveAdminSession(data);
  return data;
}

export async function getStats() {
  const { data } = await adminApi.get('/stats');
  return data;
}

export async function getUsers(search?: string) {
  const { data } = await adminApi.get('/users', { params: search ? { search } : {} });
  return data;
}

export async function updateUser(
  id: string,
  payload: { fullName?: string; email?: string; isVerified?: boolean },
) {
  const { data } = await adminApi.patch(`/users/${id}`, payload);
  return data;
}

export async function getSpeakers() {
  const { data } = await adminApi.get('/speakers');
  return data;
}

export async function createSpeaker(payload: {
  name: string;
  bio: string;
  profession?: string;
}) {
  const { data } = await adminApi.post('/speakers', payload);
  return data;
}

export async function updateSpeaker(
  id: string,
  payload: { name?: string; bio?: string; profession?: string | null },
) {
  const { data } = await adminApi.put(`/speakers/${id}`, payload);
  return data;
}

export async function deleteSpeaker(id: string) {
  await adminApi.delete(`/speakers/${id}`);
}

export type AdminPartner = {
  id: string;
  name: string;
  description: string;
  url: string;
  logoUrl: string | null;
  logoScale: number;
  order: number;
};

export type AdminPartnersResponse = {
  sectionVisible: boolean;
  partners: AdminPartner[];
};

export async function getPartners() {
  const { data } = await adminApi.get<AdminPartnersResponse>('/partners');
  return data;
}

export async function setPartnersSectionVisible(visible: boolean) {
  const { data } = await adminApi.put<{ sectionVisible: boolean }>(
    '/partners/visibility',
    { visible },
  );
  return data.sectionVisible;
}

export async function createPartner(payload: {
  name: string;
  description?: string;
  url: string;
  order?: number;
}) {
  const { data } = await adminApi.post<AdminPartner>('/partners', payload);
  return data;
}

export async function updatePartner(
  id: string,
  payload: Partial<{
    name: string;
    description: string;
    url: string;
    order: number;
  }>,
) {
  const { data } = await adminApi.put<AdminPartner>(`/partners/${id}`, payload);
  return data;
}

export async function deletePartner(id: string) {
  await adminApi.delete(`/partners/${id}`);
}

export async function uploadPartnerLogo(id: string, file: File) {
  const form = new FormData();
  form.append('logo', file);
  const { data } = await adminApi.post<{ url: string }>(`/partners/${id}/logo`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.url;
}

export async function deletePartnerLogo(id: string) {
  await adminApi.delete(`/partners/${id}/logo`);
}

export async function getSchedule() {
  const { data } = await adminApi.get('/schedule');
  return data;
}

export async function createScheduleSession(payload: Record<string, unknown>) {
  const { data } = await adminApi.post('/schedule', payload);
  return data;
}

export async function updateScheduleSession(id: string, payload: Record<string, unknown>) {
  const { data } = await adminApi.put(`/schedule/${id}`, payload);
  return data;
}

export async function deleteScheduleSession(id: string) {
  await adminApi.delete(`/schedule/${id}`);
}

export type QuizVisibilityInfo = {
  manuallyEnabled: boolean;
  startAt: string | null;
  sectionVisible: boolean;
  awaitingSchedule: boolean;
};

export type AdminQuizResponse = QuizVisibilityInfo & {
  questions: Array<{
    id: string;
    category: string;
    question: string;
    order: number;
  }>;
};

export async function getQuizQuestions() {
  const { data } = await adminApi.get<AdminQuizResponse>('/quiz/questions');
  return data;
}

export async function updateQuizVisibility(payload: {
  visible?: boolean;
  startAt?: string | null;
}) {
  const { data } = await adminApi.put<QuizVisibilityInfo>('/quiz/visibility', payload);
  return data;
}

export async function setQuizSectionVisible(visible: boolean) {
  const data = await updateQuizVisibility({
    visible,
    startAt: visible ? undefined : null,
  });
  return data.sectionVisible;
}

export async function createQuizQuestion(payload: Record<string, unknown>) {
  const { data } = await adminApi.post('/quiz/questions', payload);
  return data;
}

export async function deleteQuizQuestion(id: string) {
  await adminApi.delete(`/quiz/questions/${id}`);
}

export async function getQuestions() {
  const { data } = await adminApi.get('/questions');
  return data;
}

export async function getFeedback() {
  const { data } = await adminApi.get('/feedback');
  return data;
}

export async function sendNotification(payload: { text: string; scheduledAt?: string }) {
  const { data } = await adminApi.post('/notifications', payload);
  return data;
}

export async function getLinks() {
  const { data } = await adminApi.get('/links');
  return data;
}

export async function updateLinks(payload: Record<string, string>) {
  const { data } = await adminApi.put('/links', payload);
  return data;
}

export async function getTexts() {
  const { data } = await adminApi.get('/texts');
  return data;
}

export async function updateTexts(payload: Record<string, string>) {
  const { data } = await adminApi.put('/texts', payload);
  return data;
}

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const msg = error.response?.data;
    if (msg && typeof msg === 'object' && 'error' in msg && typeof msg.error === 'string') {
      return msg.error;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Ошибка запроса';
}
