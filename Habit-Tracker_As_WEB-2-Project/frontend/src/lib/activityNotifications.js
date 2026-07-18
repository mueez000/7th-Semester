/**
 * Browser event bridge so any module can push in-app notifications
 * without importing React context. NotificationsProvider subscribes to this event.
 */
export const ACTIVITY_NOTIFY_EVENT = 'habitflow-activity-notify';

export function emitActivityNotification(detail) {
  if (typeof window === 'undefined' || !detail) return;
  queueMicrotask(() => {
    window.dispatchEvent(new CustomEvent(ACTIVITY_NOTIFY_EVENT, { detail }));
  });
}

const SOURCE_LINKS = {

  work: '/work',
  todo: '/todo',
  streak_relapse: '/streak',
};

const SOURCE_TITLES = {

  work: 'Work session',
  todo: 'Task progress',
  streak_relapse: 'Streak',
};

const capitalize = (s) =>
  s && typeof s === 'string'
    ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ')
    : '';

/**
 * @param {{ _id: string, amount: number, source: string, sourceId?: string|null, date?: string }} row
 */
export function buildXpHistoryNotification(row) {
  // XP/gamification notifications are no longer used; this is a no-op stub kept
  // for import compatibility until full cleanup.
  return null;
}

/**
 * @param {{ _id: string, name: string, description?: string, icon?: string }} badge
 */
export function buildBadgeNotification(badge) {
  return null;
}

export function buildLevelUpNotification(level) {
  return null;
}

export function buildLevelDownNotification(level) {
  return null;
}
