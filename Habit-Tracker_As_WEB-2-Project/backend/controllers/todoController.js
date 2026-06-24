import TodoList from '../models/TodoList.js';
import TodoTask from '../models/TodoTask.js';
import WorkSession from '../models/WorkSession.js';
import { awardXP } from '../services/gamification.js';


// --- LISTS ---
export const getLists = async (req, res, next) => {
  try {
    const lists = await TodoList.find({ userId: req.userId });
    // Also get task count per list
    for (const list of lists) {
      const listTasks = await TodoTask.find({ userId: req.userId, listId: list._id });
      list.taskCount = listTasks.length;
      list.pendingCount = listTasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length;
    }
    res.json({ success: true, data: lists });
  } catch (error) { next(error); }
};

export const createList = async (req, res, next) => {
  try {
    const { name, color } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Name is required' });
    const list = await TodoList.create({ userId: req.userId, name, color });
    res.status(201).json({ success: true, data: list });
  } catch (error) { next(error); }
};

export const updateList = async (req, res, next) => {
  try {
    const { name, color } = req.body;
    const list = await TodoList.findOne({ _id: req.params.id, userId: req.userId });
    if (!list) return res.status(404).json({ success: false, error: 'List not found' });
    const updated = await TodoList.findByIdAndUpdate(list._id, { name: name || list.name, color: color || list.color }, { new: true });
    res.json({ success: true, data: updated });
  } catch (error) { next(error); }
};

export const deleteList = async (req, res, next) => {
  try {
    const list = await TodoList.findOne({ _id: req.params.id, userId: req.userId });
    if (!list) return res.status(404).json({ success: false, error: 'List not found' });
    
    // Fix: Clean up work_sessions references before deleting tasks
    const tasks = await TodoTask.find({ listId: list._id });
    const taskIds = tasks.map(t => t._id);
    await WorkSession.updateMany({ taskId: { $in: taskIds } }, { $unset: { taskId: "" } });
    
    // Delete Tasks
    await TodoTask.deleteMany({ listId: list._id });
    
    await TodoList.findByIdAndDelete(list._id);
    res.json({ success: true, data: { message: 'List deleted' } });
  } catch (error) { next(error); }
};

// --- TASKS ---
export const getDueTasks = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const allTasks = await TodoTask.find({ userId: req.userId });
    const dueTasks = allTasks.filter(t => t.status !== 'completed' && t.status !== 'archived' && t.dueDate && t.dueDate.toISOString() <= today);
    res.json({ success: true, data: dueTasks });
  } catch (error) { next(error); }
};

export const getTasks = async (req, res, next) => {
  try {
    const { listId, status, dueDate } = req.query;
    let query = { userId: req.userId };
    if (listId) query.listId = listId;
    if (status) query.status = status;
    if (dueDate) query.dueDate = dueDate;
    const tasks = await TodoTask.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: tasks });
  } catch (error) { next(error); }
};

export const createTask = async (req, res, next) => {
  try {
    const { listId, title, description, dueDate, priority, estimatedTime } = req.body;
    if (!listId || !title) return res.status(400).json({ success: false, error: 'List ID and title are required' });
    
    // verify list belongs to user
    const list = await TodoList.findOne({ _id: listId, userId: req.userId });
    if (!list) return res.status(404).json({ success: false, error: 'List not found' });

    const task = await TodoTask.create({
      userId: req.userId, listId, title, description, dueDate, priority, estimatedTime
    });
    res.status(201).json({ success: true, data: task });
  } catch (error) { next(error); }
};

export const updateTask = async (req, res, next) => {
  try {
    const task = await TodoTask.findOne({ _id: req.params.id });
    if (!task || task.userId !== req.userId) return res.status(404).json({ success: false, error: 'Task not found' });
    
    if (req.body.status === 'completed' && task.status !== 'completed') {
      req.body.completedAt = new Date();
    } else if (req.body.status && req.body.status !== 'completed' && task.status === 'completed') {
      req.body.completedAt = null;
    }
    
    const updated = await TodoTask.findByIdAndUpdate(task._id, req.body, { new: true });
    
    if (req.body.status === 'completed' && task.status !== 'completed') {
      await awardXP(req.userId, 15, 'todo', task._id);
      // Removed progressQuest
    } else if (req.body.status && req.body.status !== 'completed' && task.status === 'completed') {
      await awardXP(req.userId, -15, 'todo_undo', task._id);
    }
    
    res.json({ success: true, data: updated });
  } catch (error) { next(error); }
};

export const deleteTask = async (req, res, next) => {
  try {
    const task = await TodoTask.findOne({ _id: req.params.id });
    if (!task || task.userId !== req.userId) return res.status(404).json({ success: false, error: 'Task not found' });
    
    // Cleanup work session reference
    await WorkSession.updateMany({ taskId: task._id }, { $unset: { taskId: "" } });
    
    if (task.status === 'completed') {
      await awardXP(req.userId, -15, 'todo_undo', task._id);
    }
    
    await TodoTask.findByIdAndDelete(task._id);
    res.json({ success: true, data: { message: 'Task deleted' } });
  } catch (error) { next(error); }
};

export const getTaskTime = async (req, res, next) => {
  try {
    const task = await TodoTask.findOne({ _id: req.params.id });
    if (!task || task.userId !== req.userId) return res.status(404).json({ success: false, error: 'Task not found' });
    
    res.json({ success: true, data: { actualTime: task.actualTime } });
  } catch (error) { next(error); }
};

export const completeTask = async (req, res, next) => {
  try {
    const task = await TodoTask.findOne({ _id: req.params.id });
    if (!task || task.userId !== req.userId) return res.status(404).json({ success: false, error: 'Task not found' });
    
    const updated = await TodoTask.findByIdAndUpdate(task._id, { status: 'completed', completedAt: new Date() }, { new: true });
    
    if (task.status !== 'completed') {
      await awardXP(req.userId, 15, 'todo', task._id);
      // Removed progressQuest
    }
    
    res.json({ success: true, data: updated });
  } catch (error) { next(error); }
};
