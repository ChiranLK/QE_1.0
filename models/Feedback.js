import mongoose from 'mongoose';

const FeedbackSchema = new mongoose.Schema(
  {
    tutor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'TutoringSession', default: null },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true },
  },
  { timestamps: true }
);

// Prevent duplicate feedback per student-tutor-session
FeedbackSchema.index({ student: 1, tutor: 1, session: 1 }, { unique: true });

export default mongoose.model('Feedback', FeedbackSchema);
