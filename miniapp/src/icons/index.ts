import type { LucideIcon } from 'lucide-react';
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Gamepad2,
  Handshake,
  HelpCircle,
  Home,
  Layers,
  LayoutDashboard,
  LogOut,
  Map,
  Megaphone,
  MessageCircle,
  MessageSquare,
  Mic2,
  MoreHorizontal,
  Settings,
  User,
  Users,
} from 'lucide-react';

export { iconTokens, type IconSize } from './tokens';

/** Канонические иконки разделов — один набор имён по всему приложению */
export const appIcons = {
  home: Home,
  schedule: CalendarDays,
  program: CalendarDays,
  map: Map,
  speakers: Mic2,
  partners: Handshake,
  quiz: Gamepad2,
  feedback: MessageCircle,
  users: Users,
  questions: HelpCircle,
  reviews: MessageSquare,
  notify: Megaphone,
  settings: Settings,
  logout: LogOut,
  admin: LayoutDashboard,
  content: Layers,
  more: MoreHorizontal,
  back: ChevronLeft,
  forward: ChevronRight,
  expand: ChevronDown,
  time: Clock,
  user: User,
} satisfies Record<string, LucideIcon>;

export type AppIconName = keyof typeof appIcons;
