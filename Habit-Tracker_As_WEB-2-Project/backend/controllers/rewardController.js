import Reward from '../models/Reward.js';
import User from '../models/User.js';

export const getRewards = async (req, res, next) => {
  try {
    const rewards = await Reward.find({ userId: req.userId }).sort({ cost: 1 });
    res.json({ success: true, data: rewards });
  } catch (error) {
    next(error);
  }
};

export const createReward = async (req, res, next) => {
  try {
    const { title, cost, icon } = req.body;
    if (!title || !cost) {
      return res.status(400).json({ success: false, error: 'Title and cost are required' });
    }
    if (cost <= 0) {
      return res.status(400).json({ success: false, error: 'Cost must be greater than zero' });
    }
    const reward = await Reward.create({
      userId: req.userId,
      title,
      cost,
      icon: icon || '🎁'
    });
    res.status(201).json({ success: true, data: reward });
  } catch (error) {
    next(error);
  }
};

export const deleteReward = async (req, res, next) => {
  try {
    const { id } = req.params;
    const reward = await Reward.findOneAndDelete({ _id: id, userId: req.userId });
    if (!reward) return res.status(404).json({ success: false, error: 'Reward not found' });
    res.json({ success: true, data: reward });
  } catch (error) {
    next(error);
  }
};

export const purchaseReward = async (req, res, next) => {
  try {
    const { id } = req.params;
    const reward = await Reward.findOne({ _id: id, userId: req.userId });
    if (!reward) return res.status(404).json({ success: false, error: 'Reward not found' });

    const user = await User.findById(req.userId);
    const coins = user.coins !== undefined ? user.coins : user.xp;
    
    if (coins < reward.cost) {
      return res.status(400).json({ success: false, error: 'Not enough coins' });
    }

    user.coins = coins - reward.cost;
    await user.save();

    res.json({ success: true, data: { remainingCoins: user.coins } });
  } catch (error) {
    next(error);
  }
};
