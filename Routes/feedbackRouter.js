import express from 'express';
import { protect, authorizeRoles } from '../Middleware/authMiddleware.js';
import {
  submitFeedback,
  getTutorFeedback,
  getTutorRatingsSummary,
  getStudentParticipation,
} from '../Controllers/feedbackController.js';

const router = express.Router();

// Submit feedback - Students only
router.post('/', protect, authorizeRoles('Student'), submitFeedback);

// Get full feedback for a tutor - Tutor (self) or Admin
router.get('/tutor/:tutorId', protect, authorizeRoles('Tutor', 'Admin'), getTutorFeedback);

// Get ratings summary (avg & count) - all authenticated roles (Students can view public ratings)
router.get('/tutor/:tutorId/summary', protect, getTutorRatingsSummary);

// Get participation report for a student - Admin or Tutor (with ownership check in controller)
router.get('/participation/:studentId', protect, authorizeRoles('Tutor', 'Admin'), getStudentParticipation);

export default router;
