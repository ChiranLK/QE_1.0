import TutoringSession from '../models/TutoringSession.js';
import { StatusCodes } from 'http-status-codes';

export const createSession = async (req, res) => {
  try {
    const { title, subject, grade, description, date, startTime, endTime, capacity } = req.body;

    if (!title || !subject || !grade || !date || !startTime || !endTime || !capacity) {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Missing required fields' });
    }

    const session = await TutoringSession.create({
      title,
      subject,
      grade,
      description,
      date,
      startTime,
      endTime,
      capacity,
      tutor: req.user._id,
    });

    return res.status(StatusCodes.CREATED).json({ session });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: 'Server error', error: error.message });
  }
};

export const updateSession = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await TutoringSession.findById(id);
    if (!session) return res.status(StatusCodes.NOT_FOUND).json({ msg: 'Session not found' });

    // Only tutor who owns the session or Admin can update
    if (req.user.role !== 'Admin' && session.tutor.toString() !== req.user._id.toString()) {
      return res.status(StatusCodes.FORBIDDEN).json({ msg: 'Forbidden' });
    }

    const updates = req.body;
    Object.assign(session, updates);
    await session.save();

    return res.status(StatusCodes.OK).json({ session });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: 'Server error', error: error.message });
  }
};

export const deleteSession = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await TutoringSession.findById(id);
    if (!session) return res.status(StatusCodes.NOT_FOUND).json({ msg: 'Session not found' });

    // Only tutor who owns the session or Admin can delete
    if (req.user.role !== 'Admin' && session.tutor.toString() !== req.user._id.toString()) {
      return res.status(StatusCodes.FORBIDDEN).json({ msg: 'Forbidden' });
    }

    await session.remove();
    return res.status(StatusCodes.NO_CONTENT).send();
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: 'Server error', error: error.message });
  }
};

export const getAllSessions = async (req, res) => {
  try {
    const { subject, grade } = req.query;
    const filter = {};
    if (subject) filter.subject = subject;
    if (grade) filter.grade = grade;

    const sessions = await TutoringSession.find(filter)
      .populate('tutor', 'name email role')
      .populate('enrolledStudents', 'name email');

    return res.status(StatusCodes.OK).json({ sessions });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: 'Server error', error: error.message });
  }
};

export const joinSession = async (req, res) => {
  try {
    const { id } = req.params; // session id
    const studentId = req.user._id;

    // Only Students can join
    if (req.user.role !== 'Student') {
      return res.status(StatusCodes.FORBIDDEN).json({ msg: 'Only students can join sessions' });
    }

    const session = await TutoringSession.findById(id);
    if (!session) return res.status(StatusCodes.NOT_FOUND).json({ msg: 'Session not found' });

    // Prevent double-join
    if (session.enrolledStudents.some((s) => s.toString() === studentId.toString())) {
      return res.status(StatusCodes.CONFLICT).json({ msg: 'Already enrolled in this session' });
    }

    // Capacity check
    if (session.enrolledStudents.length >= session.capacity) {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Session capacity full' });
    }

    session.enrolledStudents.push(studentId);
    await session.save();

    return res.status(StatusCodes.OK).json({ msg: 'Joined session', session });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: 'Server error', error: error.message });
  }
};
