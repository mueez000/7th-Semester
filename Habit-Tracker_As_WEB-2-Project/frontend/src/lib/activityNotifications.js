/**
 * Browser event bridge so AuthContext (and any module) can push in-app notifications
 * without importing React context. NotificationsProvider subscribes to this event.
 */
export const ACTIVITY_NOTIFY_EVENT = 'habitflow-activity-notify';

export function emitActivityNotification(detail) {
  if (typeof window === 'undefined' || !detail) return;
  queueMicrotask(() => {
    window.dispatchEvent(new CustomEvent(ACTIVITY_NOTIFY_EVENT, { detail }));
  });
}

const capitalize = (s) =>
  s && typeof s === 'string'
    ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ')
    : '';

const SOURCE_LINKS = {
  namaz: '/namaz',
  work: '/work',
  focus: '/focus',
  exercise: '/exercise',
  todo: '/todo',
  habit: '/dashboard',
};

const SOURCE_TITLES = {
  namaz: 'Prayer logged',
  work: 'Work session',
  focus: 'Focus session',
  exercise: 'Workout logged',
  todo: 'Task progress',
  habit: 'Habit completed',
};

/**
 * @param {{ _id: string, amount: number, source: string, sourceId?: string|null, date?: string }} row
 */
export function buildXpHistoryNotification(row) {
  const source = row.source || 'system';
  const baseSource = source.replace('_undo', '');
  const titleBase = SOURCE_TITLES[baseSource] || `${capitalize(baseSource)} · XP`;
  const sign = row.amount > 0 ? '+' : '';
  let body = `${sign}${row.amount} XP added to your profile.`;

  switch (baseSource) {
    case 'namaz':
      body = row.sourceId
        ? `${sign}${row.amount} XP · ${capitalize(String(row.sourceId))} marked.`
        : `${sign}${row.amount} XP · Prayer logged.`;
      break;
    case 'work':
      body = `${sign}${row.amount} XP · Deep work session saved.`;
      break;
    case 'focus':
      body = `${sign}${row.amount} XP · Focus session completed.`;
      break;
    case 'exercise':
      body = `${sign}${row.amount} XP · Exercise logged.`;
      break;
    case 'todo':
      body = `${sign}${row.amount} XP · Task completed.`;
      break;
    case 'habit':
      body = `${sign}${row.amount} XP · Custom habit checked off.`;
      break;
    default:
      body = `${sign}${row.amount} XP · Keep building your streak.`;
  }

  if (row.amount < 0) {
    body = body.replace('added to your profile', 'deducted from your profile')
               .replace('saved', 'deleted')
               .replace('completed', 'undone')
               .replace('logged', 'deleted');
  }

  return {
    type: 'xp',
    title: titleBase,
    body,
    link: SOURCE_LINKS[baseSource] || '/dashboard',
    id: `xp_${row._id}`,
  };
}

/**
 * @param {{ _id: string, name: string, description?: string, icon?: string }} badge
 */
export function buildBadgeNotification(badge) {
  const icon = badge.icon ? `${badge.icon} ` : '';
  return {
    type: 'badge',
    title: `New badge · ${badge.name}`,
    body: `${icon}${badge.description || 'Achievement unlocked.'}`.trim(),
    link: '/analytics',
    id: `badge_${badge._id}`,
  };
}

export function buildLevelUpNotification(level) {
  return {
    type: 'level',
    title: `Level ${level} unlocked`,
    body: 'You leveled up. Open the dashboard to see your progress bar.',
    link: '/dashboard',
    id: `levelup_${level}`,
  };
}

export function buildLevelDownNotification(level) {
  return {
    type: 'level_down',
    title: `Level dropped to ${level}`,
    body: 'You lost enough XP to drop a level. Keep trying to earn it back!',
    link: '/dashboard',
    id: `leveldown_${level}`,
  };
}
