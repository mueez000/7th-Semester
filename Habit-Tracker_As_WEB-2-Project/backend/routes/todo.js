import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { 
  getLists, createList, updateList, deleteList,
  getTasks, createTask, updateTask, deleteTask, getTaskTime, getDueTasks, completeTask
} from '../controllers/todoController.js';

const router = express.Router();

router.use(requireAuth);

// Lists
router.route('/lists')
  .get(getLists)
  .post(createList);
router.route('/lists/:id')
  .put(updateList)
  .delete(deleteList);

// Notifications
router.route('/notifications')
  .get(getDueTasks);

// Tasks
router.route('/tasks')
  .get(getTasks)
  .post(createTask);
router.route('/tasks/:id')
  .put(updateTask)
  .delete(deleteTask);
router.route('/tasks/:id/time')
  .get(getTaskTime);
router.route('/tasks/:id/complete')
  .put(completeTask);

export default router;
