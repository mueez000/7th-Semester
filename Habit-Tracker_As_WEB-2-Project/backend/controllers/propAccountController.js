import PropAccount from '../models/PropAccount.js';

// @desc    Get user's prop account
// @route   GET /api/prop-account
export const getPropAccount = async (req, res, next) => {
  try {
    const account = await PropAccount.findOne({ userId: req.userId });
    res.status(200).json({ success: true, data: account });
  } catch (error) {
    next(error);
  }
};

// @desc    Create or update user's prop account
// @route   POST /api/prop-account
export const setPropAccount = async (req, res, next) => {
  try {
    const {
      accountSize,
      dailyDrawdownPct,
      maxDrawdownPct,
      phase1TargetPct,
      phase2TargetPct,
      failedAccounts,
      currentPhase,
      status
    } = req.body;

    let account = await PropAccount.findOne({ userId: req.userId });

    if (account) {
      account.accountSize = accountSize ?? account.accountSize;
      account.dailyDrawdownPct = dailyDrawdownPct ?? account.dailyDrawdownPct;
      account.maxDrawdownPct = maxDrawdownPct ?? account.maxDrawdownPct;
      account.phase1TargetPct = phase1TargetPct ?? account.phase1TargetPct;
      account.phase2TargetPct = phase2TargetPct ?? account.phase2TargetPct;
      if (failedAccounts !== undefined) account.failedAccounts = failedAccounts;
      if (currentPhase !== undefined) account.currentPhase = currentPhase;
      if (status !== undefined) account.status = status;
      await account.save();
    } else {
      account = await PropAccount.create({
        userId: req.userId,
        accountSize,
        dailyDrawdownPct,
        maxDrawdownPct,
        phase1TargetPct,
        phase2TargetPct,
        failedAccounts: failedAccounts || 0,
        currentPhase: currentPhase || 1,
        status: 'active'
      });
    }

    res.status(200).json({ success: true, data: account });
  } catch (error) {
    next(error);
  }
};

// @desc    Advance to next phase or mark funded
// @route   PATCH /api/prop-account/advance-phase
export const advancePhase = async (req, res, next) => {
  try {
    const account = await PropAccount.findOne({ userId: req.userId });
    if (!account) return res.status(404).json({ success: false, error: 'No account found' });

    if (account.currentPhase === 1) {
      account.currentPhase = 2;
    } else if (account.currentPhase === 2) {
      account.status = 'funded';
    }

    await account.save();
    res.status(200).json({ success: true, data: account });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark account as failed — increment failedAccounts and reset
// @route   PATCH /api/prop-account/fail
export const failAccount = async (req, res, next) => {
  try {
    const account = await PropAccount.findOne({ userId: req.userId });
    if (!account) return res.status(404).json({ success: false, error: 'No account found' });

    account.failedAccounts = (account.failedAccounts || 0) + 1;
    account.status = 'failed';
    account.currentPhase = 1; // Reset to phase 1
    await account.save();

    res.status(200).json({ success: true, data: account, message: 'Account failed. Every failure is a lesson. Reset and come back stronger.' });
  } catch (error) {
    next(error);
  }
};
