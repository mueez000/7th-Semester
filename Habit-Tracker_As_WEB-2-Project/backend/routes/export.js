import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getAllUserData } from '../controllers/exportController.js';

const router = express.Router();

router.use(requireAuth);

router.get('/all', getAllUserData);

export default router;
