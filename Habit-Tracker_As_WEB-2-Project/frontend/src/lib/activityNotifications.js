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
  namaz_daily_penalty: '/namaz',
  deep_work_daily_penalty: '/work',
  work: '/work',
  focus: '/focus',
  exercise: '/exercise',
  todo: '/todo',
  habit: '/dashboard',
  namaz_early_sleep: '/namaz',
  early_sleep_weekly: '/namaz',
  deep_work_weekly: '/work',
  streak_relapse: '/streak',
};

const SOURCE_TITLES = {
  namaz: 'Prayer logged',
  namaz_daily_penalty: '⚠️ Namaz Penalty',
  deep_work_daily_penalty: '⚠️ Deep Work Penalty',
  work: 'Work session',
  focus: 'Focus session',
  exercise: 'Workout logged',
  todo: 'Task progress',
  habit: 'Habit completed',
  namaz_early_sleep: 'Early Sleep',
  early_sleep_weekly: 'Weekly Early Sleep Reward',
  deep_work_weekly: 'Weekly Deep Work Reward',
  streak_relapse: 'Streak',
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
    case 'namaz_daily_penalty':
      body = `${row.amount} XP · You missed Isha Jamat or didn't sleep early yesterday. Avoid this penalty by praying in Jamat and sleeping early.`;
      break;
    case 'deep_work_daily_penalty':
      body = `${row.amount} XP · You didn't complete 1 hour of deep work yesterday. Study at least 1 hour daily to avoid this penalty.`;
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
    case 'namaz_early_sleep':
      body = `${sign}${row.amount} XP · You promised to sleep early.`;
      break;
    case 'early_sleep_weekly':
      body = `🎉 ${sign}${row.amount} XP · You slept early for 7 consecutive days! Incredible discipline!`;
      break;
    case 'deep_work_weekly':
      body = `🎉 ${sign}${row.amount} XP · You logged 10+ hours daily for a week! What a machine!`;
      break;
    case 'streak_relapse':
      body = row.amount < 0 ? `${row.amount} XP · Relapse penalty. Keep trying!` : `+${row.amount} XP · Streak goal achieved!`;
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
