import NamazLog from '../models/NamazLog.js';
import WorkSession from '../models/WorkSession.js';
import ExerciseLog from '../models/ExerciseLog.js';

import TodoTask from '../models/TodoTask.js';
import User from '../models/User.js';

export const getAllUserData = async (req, res, next) => {
  try {
    const userId = req.userId;
    
    // 1. User Summary
    const user = await User.findById(userId).select('-password');
    
    // 2. Namaz
    const namazLogs = await NamazLog.find({ userId }).sort({ date: 1 });
    
    // 3. Work & Focus
    const workSessions = await WorkSession.find({ userId });

    
    // 4. Exercise
    const exerciseLogs = await ExerciseLog.find({ userId });
    
    // 5. Todo Tasks
    const todoTasks = await TodoTask.find({ userId });

    res.json({
      success: true,
      data: {
        user,
        namazLogs,
        workSessions,

        exerciseLogs,
        todoTasks
      }
    });

  } catch (error) {
    next(error);
  }
};
