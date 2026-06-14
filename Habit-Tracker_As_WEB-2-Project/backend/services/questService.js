import Quest from '../models/Quest.js';

const QUEST_TEMPLATES = [
  { title: "Bookworm", description: "Read 50 pages", type: "reading", target: 50, xpReward: 150, durationDays: 3, icon: "📖" },
  { title: "Scholar", description: "Read 200 pages this week", type: "reading", target: 200, xpReward: 500, durationDays: 7, icon: "📚" },
  { title: "Deep Focus", description: "Complete 10 hours of Deep Work", type: "work", target: 600, xpReward: 500, durationDays: 7, icon: "🧠" },
  { title: "Hustler", description: "Complete 2 hours of Deep Work", type: "work", target: 120, xpReward: 100, durationDays: 2, icon: "⚡" },
  { title: "Spiritual Week", description: "Log 25 Namaz prayers", type: "namaz", target: 25, xpReward: 300, durationDays: 7, icon: "🕌" },
  { title: "Consistent", description: "Reach a 5-day Commitment Streak", type: "streak", target: 5, xpReward: 400, durationDays: 7, icon: "🛡️" },
  { title: "Iron Will", description: "Reach a 10-day Commitment Streak", type: "streak", target: 10, xpReward: 1000, durationDays: 14, icon: "👑" },
  { title: "Task Smasher", description: "Complete 10 Todo Tasks", type: "todo", target: 10, xpReward: 200, durationDays: 5, icon: "✅" },
  { title: "Active Lifestyle", description: "Burn 1000 calories via Exercise", type: "exercise", target: 1000, xpReward: 300, durationDays: 7, icon: "🏃" }
];

export const checkAndGenerateQuests = async (userId) => {
  const now = new Date();
  
  // Cleanup expired quests
  await Quest.deleteMany({ userId, expiresAt: { $lt: now }, isCompleted: false });

  // Get current active unexpired quests
  const activeQuests = await Quest.find({ userId, expiresAt: { $gte: now }, isClaimed: false });

  if (activeQuests.length < 3) {
    const needed = 3 - activeQuests.length;
    
    // Pick random templates, avoiding types the user already has active if possible
    const existingTypes = new Set(activeQuests.map(q => q.type));
    let availableTemplates = QUEST_TEMPLATES.filter(t => !existingTypes.has(t.type));
    
    if (availableTemplates.length < needed) {
        availableTemplates = [...QUEST_TEMPLATES]; // fallback if we run out of unique types
    }

    // Shuffle
    availableTemplates.sort(() => 0.5 - Math.random());

    const newQuests = availableTemplates.slice(0, needed).map(t => {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + t.durationDays);
      return {
        userId,
        title: t.title,
        description: t.description,
        type: t.type,
        target: t.target,
        xpReward: t.xpReward,
        icon: t.icon,
        expiresAt
      };
    });

    if (newQuests.length > 0) {
      await Quest.insertMany(newQuests);
    }
  }

  // Return the updated list of quests
  return await Quest.find({ userId, expiresAt: { $gte: now }, isClaimed: false }).sort({ isCompleted: -1, expiresAt: 1 });
};

/**
 * 
 * @param {String} userId 
 * @param {String} type - 'reading', 'work', 'namaz', 'streak', 'todo', 'exercise'
 * @param {Number} amount - The amount to progress
 * @param {Boolean} isAbsolute - If true, currentProgress is SET to amount instead of adding.
 */
export const progressQuest = async (userId, type, amount, isAbsolute = false) => {
  const now = new Date();
  const activeQuests = await Quest.find({ userId, type, expiresAt: { $gte: now }, isCompleted: false });

  for (let quest of activeQuests) {
    if (isAbsolute) {
        if (amount > quest.currentProgress) {
            quest.currentProgress = amount;
        }
    } else {
        quest.currentProgress += amount;
    }

    if (quest.currentProgress >= quest.target) {
      quest.currentProgress = quest.target;
      quest.isCompleted = true;
    }

    await quest.save();
  }
};
