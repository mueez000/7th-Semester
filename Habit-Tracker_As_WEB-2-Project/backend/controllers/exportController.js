import WorkSession from '../models/WorkSession.js';
import TodoTask from '../models/TodoTask.js';
import User from '../models/User.js';

export const getAllUserData = async (req, res, next) => {
  try {
    const userId = req.userId;
    
    // 1. User Summary
    const user = await User.findById(userId).select('-password');
    
    // 2. Work Sessions
    const workSessions = await WorkSession.find({ userId });

    // 3. Todo Tasks
    const todoTasks = await TodoTask.find({ userId });

    res.json({
      success: true,
      data: {
        user,
        workSessions,
        todoTasks,
      }
    });

  } catch (error) {
    next(error);
  }
};
