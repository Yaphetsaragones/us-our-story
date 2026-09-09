/** Date formatting + relationship-math helpers. */
import {
  differenceInCalendarDays,
  differenceInCalendarYears,
  format,
  isSameDay,
  isToday,
  isYesterday,
  startOfDay,
} from 'date-fns';

export const DAY_MS = 86400000;

export function fmtDate(ts: number): string {
  return format(new Date(ts), 'MMM d, yyyy');
}

export function fmtDateShort(ts: number): string {
  return format(new Date(ts), 'MMM d');
}

export function fmtMonthYear(ts: number): string {
  return format(new Date(ts), 'MMMM yyyy');
}

export function fmtTime(ts: number): string {
  return format(new Date(ts), 'h:mm a');
}

export function fmtNoteStamp(ts: number): string {
  return `${fmtDate(ts)} • ${fmtTime(ts)}`;
}

export function fmtDayLabel(ts: number): string {
  const d = new Date(ts);
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'EEEE, MMM d, yyyy');
}

/** "Aug 12 – 18, 2024" / "Dec 28, 2024 – Jan 3, 2025" / "Aug 12, 2024" */
export function fmtRange(startAt: number, endAt: number): string {
  const a = new Date(startAt);
  const b = new Date(endAt);
  if (isSameDay(a, b)) return format(a, 'MMM d, yyyy');
  if (a.getFullYear() !== b.getFullYear()) {
    return `${format(a, 'MMM d, yyyy')} – ${format(b, 'MMM d, yyyy')}`;
  }
  if (a.getMonth() !== b.getMonth()) {
    return `${format(a, 'MMM d')} – ${format(b, 'MMM d, yyyy')}`;
  }
  return `${format(a, 'MMM d')} – ${format(b, 'd, yyyy')}`;
}

/** "3 years ago today" / "2 months ago" / "Today" */
export function fmtAgo(ts: number, now = Date.now()): string {
  const years = differenceInCalendarYears(now, ts);
  if (years >= 1) return `${years} year${years > 1 ? 's' : ''} ago today`;
  const days = differenceInCalendarDays(now, ts);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  const months = Math.round(days / 30);
  return `${months} month${months > 1 ? 's' : ''} ago`;
}

export function daysUntil(target: number, now = Date.now()): number {
  return differenceInCalendarDays(startOfDay(target), startOfDay(now));
}

export function daysBetween(a: number, b = Date.now()): number {
  return Math.abs(differenceInCalendarDays(startOfDay(b), startOfDay(a)));
}

/** Rolls a yearly date forward to its next occurrence. */
export function nextOccurrence(date: number, now = Date.now()): number {
  const src = new Date(date);
  let next = new Date(now);
  next = new Date(next.getFullYear(), src.getMonth(), src.getDate(), 9, 0, 0, 0);
  if (differenceInCalendarDays(next, now) < 0) {
    next = new Date(next.getFullYear() + 1, src.getMonth(), src.getDate(), 9, 0, 0, 0);
  }
  return next.getTime();
}

export function fmtDuration(ms?: number): string {
  if (!ms || ms <= 0) return '';
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export { isSameDay, startOfDay, format };
