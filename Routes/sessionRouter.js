import express from 'express';
import {
  createSession,
  updateSession,
  deleteSession,
  getAllSessions,
  joinSession,
} from '../Controllers/sessionController.js';
import { protect, authorizeRoles } from '../Middleware/authMiddleware.js';

const router = express.Router();

// Public: list sessions (students/tutors/admins all can view)
router.get('/', protect, getAllSessions);

// Tutor or Admin create
router.post('/', protect, authorizeRoles('Tutor', 'Admin'), createSession);

// Update/delete: tutor owns or admin
router.put('/:id', protect, authorizeRoles('Tutor', 'Admin'), updateSession);
router.delete('/:id', protect, authorizeRoles('Tutor', 'Admin'), deleteSession);

// Student join
router.post('/:id/join', protect, authorizeRoles('Student'), joinSession);

export default router;
