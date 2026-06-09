export interface AdminInfo {
  id: string;
  email: string;
  name: string;
}

export interface LoginResponse {
  token: string;
  admin: AdminInfo;
}

export interface DashboardStats {
  usersTotal: number;
  usersVerified: number;
  speakers: number;
  scheduleSessions: number;
  questions: number;
  feedback: number;
  quizQuestions: number;
  notificationsPending: number;
}

export interface User {
  id: string;
  maxUserId: string;
  chatId: string;
  fullName: string;
  email: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Speaker {
  id: string;
  name: string;
  profession: string | null;
  bio: string;
  photoUrl: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
  _count?: { sessionSpeakers: number };
}

export interface Partner {
  id: string;
  name: string;
  description: string;
  url: string;
  logoUrl: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
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
  speakers: ScheduleSessionSpeaker[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: 'a' | 'b' | 'c' | 'd';
  order: number;
}

export interface QuizResultRow {
  userId: string;
  fullName: string;
  email: string;
  answeredQuestions: number;
  correctAnswers: number;
  totalQuestions: number;
  isComplete: boolean;
  isWinner: boolean;
}

export interface QuizResultsResponse {
  results: QuizResultRow[];
  winners: QuizResultRow[];
}

export interface SpeakerQuestion {
  id: string;
  question: string;
  createdAt: string;
  user: { id: string; fullName: string; email: string };
  speaker: { id: string; name: string };
}

export interface FeedbackItem {
  id: string;
  text: string;
  createdAt: string;
  user: { id: string; fullName: string; email: string } | null;
}

export interface Notification {
  id: string;
  text: string;
  scheduledAt: string | null;
  sentAt: string | null;
  isSent: boolean;
  createdAt: string;
}

export interface LinksConfig {
  stickerUrl: string;
  quizUrl: string;
  mapImageUrl: string;
}

export interface TextsConfig {
  eventDescription: string;
  botWelcome: string;
}

export interface ReorderItem {
  id: string;
  order: number;
}
