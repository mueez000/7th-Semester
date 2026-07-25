import TradeLog from '../models/TradeLog.js';

// @desc    Get all trades for user
// @route   GET /api/trades
export const getTrades = async (req, res, next) => {
  try {
    const trades = await TradeLog.find({ userId: req.userId }).sort({ entryDate: -1 });
    res.status(200).json({ success: true, count: trades.length, data: trades });
  } catch (error) {
    next(error);
  }
};

// @desc    Add new trade
// @route   POST /api/trades
export const addTrade = async (req, res, next) => {
  try {
    const tradeData = { ...req.body, userId: req.userId };
    
    // Auto-calculate PnL if not provided but entry/exit are present
    if (tradeData.exitPrice) {
      if (tradeData.pnl === undefined || tradeData.pnl === 0) {
        const diff = tradeData.position === 'Long' 
          ? tradeData.exitPrice - tradeData.entryPrice 
          : tradeData.entryPrice - tradeData.exitPrice;
        // Standard Gold Lot: 1 Lot = 100 oz. So $1 movement on 1 lot = $100.
        tradeData.pnl = diff * tradeData.lotSize * 100;
      }
    }

    if (!tradeData.exitDate) {
      tradeData.exitDate = Date.now();
    }

    const trade = await TradeLog.create(tradeData);

    // AI Notification logic can be triggered from frontend or here. We will return a specific message in the response for frontend to show.
    let aiMessage = null;
    if (trade.status === 'Win') {
       aiMessage = "Excellent execution. Profit is the byproduct of a solid strategy.";
    } else if (trade.status === 'Loss') {
       aiMessage = "Losses are just data points. Did you follow your edge? Analyze it and move on.";
    }

    res.status(201).json({ success: true, data: trade, aiMessage });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a trade
// @route   PUT /api/trades/:id
export const updateTrade = async (req, res, next) => {
  try {
    let trade = await TradeLog.findById(req.params.id);

    if (!trade) {
      return res.status(404).json({ success: false, error: 'Trade not found' });
    }

    if (trade.userId.toString() !== req.userId) {
      return res.status(401).json({ success: false, error: 'Not authorized to update this trade' });
    }

    const updateData = { ...req.body };

    // Auto-calculate PnL
    if (updateData.exitPrice) {
      const diff = (updateData.position || trade.position) === 'Long' 
        ? updateData.exitPrice - (updateData.entryPrice || trade.entryPrice) 
        : (updateData.entryPrice || trade.entryPrice) - updateData.exitPrice;
      
      updateData.pnl = diff * (updateData.lotSize || trade.lotSize) * 100;
      
      if (!updateData.exitDate && !trade.exitDate) {
        updateData.exitDate = Date.now();
      }
    }

    trade = await TradeLog.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    let aiMessage = null;
    if (updateData.status === 'Win') {
       aiMessage = "Excellent execution. Profit is the byproduct of a solid strategy.";
    } else if (updateData.status === 'Loss') {
       aiMessage = "Losses are just data points. Did you follow your edge? Analyze it and move on.";
    }

    res.status(200).json({ success: true, data: trade, aiMessage });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a trade
// @route   DELETE /api/trades/:id
export const deleteTrade = async (req, res, next) => {
  try {
    const trade = await TradeLog.findById(req.params.id);

    if (!trade) {
      return res.status(404).json({ success: false, error: 'Trade not found' });
    }

    if (trade.userId.toString() !== req.userId) {
      return res.status(401).json({ success: false, error: 'Not authorized to delete this trade' });
    }

    await trade.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
