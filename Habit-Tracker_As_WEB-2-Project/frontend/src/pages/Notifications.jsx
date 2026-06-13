import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Sparkles,
  Target,
  CalendarClock,
  Info,
  Trophy,
  Trash2,
  ChevronRight,
  Award,
  TrendingUp,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNotifications } from '../context/NotificationsContext';
import { cn } from '../utils/helpers';

const typeConfig = {
  xp: {
    icon: Sparkles,
    bg: 'bg-[#e8f0fe]',
    iconColor: 'text-[#1a73e8]',
    label: 'XP',
  },
  streak: {
    icon: Target,
    bg: 'bg-[#fef7e0]',
    iconColor: 'text-[#f9ab00]',
    label: 'Streak',
  },
  reminder: {
    icon: CalendarClock,
    bg: 'bg-[#e6f4ea]',
    iconColor: 'text-[#188038]',
    label: 'Reminder',
  },
  system: {
    icon: Info,
    bg: 'bg-[#f1f3f4]',
    iconColor: 'text-[#5f6368]',
    label: 'Update',
  },
  achievement: {
    icon: Trophy,
    bg: 'bg-[#fce8e6]',
    iconColor: 'text-[#d93025]',
    label: 'Milestone',
  },
  badge: {
    icon: Award,
    bg: 'bg-[#fef7e0]',
    iconColor: 'text-[#f9ab00]',
    label: 'Badge',
  },
  level: {
    icon: TrendingUp,
    bg: 'bg-[#e6f4ea]',
    iconColor: 'text-[#188038]',
    label: 'Level up',
  },
  level_down: {
    icon: TrendingUp,
    bg: 'bg-[#fce8e6]',
    iconColor: 'text-[#d93025]',
    label: 'Level down',
  },
};

const ACTIVITY_TYPES = new Set(['xp', 'badge', 'level', 'level_down', 'achievement']);

const Notifications = () => {
  const { items, markAsRead, markAllAsRead, dismiss } = useNotifications();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');

  const sorted = useMemo(
    () =>
      [...items].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      ),
    [items]
  );

  const filtered = useMemo(() => {
    if (filter === 'unread') return sorted.filter((n) => !n.read);
    if (filter === 'activity')
      return sorted.filter((n) => ACTIVITY_TYPES.has(n.type));
    return sorted;
  }, [sorted, filter]);

  const activityCount = useMemo(
    () => sorted.filter((n) => ACTIVITY_TYPES.has(n.type)).length,
    [sorted]
  );

  const unreadTotal = items.filter((n) => !n.read).length;

  const handleOpen = (n) => {
    if (!n.read) markAsRead(n.id);
    if (n.link) navigate(n.link);
  };

  return (
    <div className="max-w-3xl mx-auto pb-10 animate-in fade-in duration-500">
      <div className="google-card p-6 sm:p-8 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#e8f0fe] flex items-center justify-center shrink-0">
              <Bell className="text-[#1a73e8]" size={24} strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#202124] tracking-tight">
                Notifications
              </h1>
              <p className="text-[#5f6368] mt-1 text-sm sm:text-base max-w-xl">
                XP from prayers, work, focus, exercise, and tasks appears here automatically—along with new badges and level-ups.
              </p>
              <p className="text-[#80868b] mt-2 text-xs sm:text-sm">
                Synced when your profile refreshes after each activity.
              </p>
            </div>
          </div>
          {unreadTotal > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="inline-flex items-center justify-center gap-2 self-start sm:self-center px-4 py-2.5 rounded-full text-sm font-semibold text-[#1967d2] bg-[#e8f0fe] hover:bg-[#d2e3fc] transition-colors border border-transparent"
            >
              <CheckCheck size={18} />
              Mark all read
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { id: 'all', label: 'All' },
          { id: 'activity', label: 'Activity' },
          { id: 'unread', label: 'Unread' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium transition-all',
              filter === tab.id
                ? 'bg-[#1a73e8] text-white shadow-sm'
                : 'bg-white text-[#5f6368] border border-[#dadce0] hover:bg-[#f8f9fa]'
            )}
          >
            {tab.label}
            {tab.id === 'unread' && unreadTotal > 0 && (
              <span className="ml-1.5 tabular-nums opacity-90">({unreadTotal})</span>
            )}
            {tab.id === 'activity' && activityCount > 0 && (
              <span className="ml-1.5 tabular-nums opacity-90">({activityCount})</span>
            )}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="google-card p-10 sm:p-14 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#f1f3f4] flex items-center justify-center mb-4">
              <Bell className="text-[#9aa0a6]" size={28} />
            </div>
            <h2 className="text-lg font-semibold text-[#202124]">
              {filter === 'unread'
                ? "You're all caught up"
                : filter === 'activity'
                  ? 'No activity notifications yet'
                  : 'No notifications yet'}
            </h2>
            <p className="text-[#5f6368] text-sm mt-2 max-w-sm mx-auto">
              {filter === 'unread'
                ? 'No unread items. Check the All tab for older messages.'
                : filter === 'activity'
                  ? 'Complete a prayer, log a workout, finish a work session, or complete a task to earn XP—then open this page again.'
                  : 'Complete any tracked activity to see XP and milestones here.'}
            </p>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1 mt-6 text-sm font-semibold text-[#1a73e8] hover:underline"
            >
              Back to dashboard
              <ChevronRight size={16} />
            </Link>
          </div>
        )}

        {filtered.map((n) => {
          const cfg = typeConfig[n.type] || typeConfig.system;
          const Icon = cfg.icon;
          return (
            <article
              key={n.id}
              className={cn(
                'google-card p-4 sm:p-5 flex gap-4 transition-all',
                !n.read && 'ring-2 ring-[#1a73e8]/15 bg-[#fafcff]'
              )}
            >
              <div
                className={cn(
                  'w-11 h-11 rounded-xl flex items-center justify-center shrink-0',
                  cfg.bg
                )}
              >
                <Icon className={cfg.iconColor} size={22} strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  {!n.read && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide bg-[#1a73e8] text-white">
                      New
                    </span>
                  )}
                  <span
                    className={cn(
                      'text-[10px] font-semibold uppercase tracking-wider',
                      cfg.iconColor
                    )}
                  >
                    {cfg.label}
                  </span>
                  <span className="text-xs text-[#80868b]">
                    {formatDistanceToNow(new Date(n.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <h3 className="font-semibold text-[#202124] text-base leading-snug">
                  {n.title}
                </h3>
                <p className="text-[#5f6368] text-sm mt-1 leading-relaxed">
                  {n.body}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-4">
                  {n.link && (
                    <button
                      type="button"
                      onClick={() => handleOpen(n)}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-[#1a73e8] hover:underline"
                    >
                      Open
                      <ChevronRight size={16} />
                    </button>
                  )}
                  {!n.link && !n.read && (
                    <button
                      type="button"
                      onClick={() => markAsRead(n.id)}
                      className="text-sm font-semibold text-[#5f6368] hover:text-[#202124]"
                    >
                      Mark as read
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => dismiss(n.id)}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-[#80868b] hover:text-[#d93025] ml-auto sm:ml-0"
                    aria-label="Remove notification"
                  >
                    <Trash2 size={16} />
                    <span className="hidden sm:inline">Remove</span>
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};

export default Notifications;
