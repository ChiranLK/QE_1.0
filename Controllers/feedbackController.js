import Feedback from '../models/Feedback.js';
import User from '../models/UserModel.js';
import TutoringSession from '../models/TutoringSession.js';
import { StatusCodes } from 'http-status-codes';

export const submitFeedback = async (req, res) => {
  try {
    const { tutor, session, rating, comment } = req.body;
    const student = req.user._id;

    if (!tutor || typeof rating === 'undefined') {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Tutor and rating are required' });
    }

    const ratingNum = Number(rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Rating must be an integer between 1 and 5' });
    }

    const tutorUser = await User.findById(tutor).select('role');
    if (!tutorUser) return res.status(StatusCodes.NOT_FOUND).json({ msg: 'Tutor not found' });
    if (tutorUser.role !== 'Tutor' && tutorUser.role !== 'Admin') {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Target user is not a tutor' });
    }

    // If session provided, ensure it exists and that the student was part of it
    if (session) {
      const sess = await TutoringSession.findById(session).select('tutor enrolledStudents');
      if (!sess) return res.status(StatusCodes.NOT_FOUND).json({ msg: 'Session not found' });
      // Ensure session's tutor matches provided tutor
      if (sess.tutor.toString() !== tutor.toString()) {
        return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Session does not belong to the specified tutor' });
      }
      // Ensure student participated (joined) the session
      if (!sess.enrolledStudents.some((s) => s.toString() === student.toString())) {
        return res.status(StatusCodes.FORBIDDEN).json({ msg: 'You did not participate in this session' });
      }
    }

    // Prevent duplicate feedback (student-tutor-session uniqueness is enforced by index; pre-check to return friendly error)
    const existing = await Feedback.findOne({ student, tutor, session: session || null });
    if (existing) {
      return res.status(StatusCodes.CONFLICT).json({ msg: 'Feedback already submitted for this tutor/session' });
    }

    const feedback = await Feedback.create({ tutor, student, session: session || null, rating: ratingNum, comment });

    return res.status(StatusCodes.CREATED).json({ feedback });
  } catch (error) {
    // handle duplicate key error as well
    if (error.code === 11000) {
      return res.status(StatusCodes.CONFLICT).json({ msg: 'Duplicate feedback' });
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: 'Server error', error: error.message });
  }
};

export const getTutorFeedback = async (req, res) => {
  try {
    const { tutorId } = req.params;

    // Only Admin or the tutor themselves can access full feedback list
    if (req.user.role === 'Tutor' && req.user._id.toString() !== tutorId) {
      return res.status(StatusCodes.FORBIDDEN).json({ msg: 'Forbidden' });
    }

    const feedbacks = await Feedback.find({ tutor: tutorId })
      .populate('student', 'name email')
      .sort({ createdAt: -1 });

    return res.status(StatusCodes.OK).json({ feedbacks });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: 'Server error', error: error.message });
  }
};

export const getTutorRatingsSummary = async (req, res) => {
  try {
    const { tutorId } = req.params;

    const summary = await Feedback.aggregate([
      { $match: { tutor: new (require('mongoose')).Types.ObjectId(tutorId) } },
      {
        $group: {
          _id: '$tutor',
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    if (!summary || summary.length === 0) {
      return res.status(StatusCodes.OK).json({ averageRating: 0, totalReviews: 0 });
    }

    const { averageRating, totalReviews } = summary[0];
    return res.status(StatusCodes.OK).json({ averageRating: Number(averageRating.toFixed(2)), totalReviews });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: 'Server error', error: error.message });
  }
};

export const getStudentParticipation = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Authorization: Admin can view any student. Tutor can view only if student participated in their sessions
    if (req.user.role === 'Tutor') {
      const participated = await TutoringSession.exists({ tutor: req.user._id, enrolledStudents: studentId });
      if (!participated) return res.status(StatusCodes.FORBIDDEN).json({ msg: 'Forbidden' });
    } else if (req.user.role !== 'Admin') {
      return res.status(StatusCodes.FORBIDDEN).json({ msg: 'Forbidden' });
    }

    // Joined sessions count (all tutors/admin view all)
    const joinedCount = await TutoringSession.countDocuments({ enrolledStudents: studentId });

    // Feedback submitted count
    const feedbackCount = await Feedback.countDocuments({ student: studentId });

    // Optionally list recent sessions and feedbacks
    const recentSessions = await TutoringSession.find({ enrolledStudents: studentId })
      .select('title subject date tutor')
      .populate('tutor', 'name email')
      .sort({ date: -1 })
      .limit(10);

    const recentFeedback = await Feedback.find({ student: studentId })
      .select('tutor session rating comment createdAt')
      .populate('tutor', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    return res.status(StatusCodes.OK).json({ joinedCount, feedbackCount, recentSessions, recentFeedback });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: 'Server error', error: error.message });
  }
};
