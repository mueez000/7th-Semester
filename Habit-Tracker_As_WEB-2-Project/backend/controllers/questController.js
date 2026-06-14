import Quest from '../models/Quest.js';
import { checkAndGenerateQuests } from '../services/questService.js';
import { awardXP } from '../services/gamification.js';

export const getMyQuests = async (req, res, next) => {
  try {
    const quests = await checkAndGenerateQuests(req.userId);
    res.json({ success: true, data: quests });
  } catch (error) {
    next(error);
  }
};

export const claimQuestReward = async (req, res, next) => {
  try {
    const { id } = req.params;
    const quest = await Quest.findOne({ _id: id, userId: req.userId });

    if (!quest) return res.status(404).json({ success: false, error: 'Quest not found' });
    if (!quest.isCompleted) return res.status(400).json({ success: false, error: 'Quest is not completed yet' });
    if (quest.isClaimed) return res.status(400).json({ success: false, error: 'Reward already claimed' });

    quest.isClaimed = true;
    await quest.save();

    await awardXP(req.userId, quest.xpReward, 'quest', quest._id);

    res.json({ success: true, data: quest });
  } catch (error) {
    next(error);
  }
};
