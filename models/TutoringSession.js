import mongoose from 'mongoose';

const TutoringSessionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    grade: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    tutor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    capacity: { type: Number, required: true, min: 1 },
    enrolledStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

// Virtual for enrolled count
TutoringSessionSchema.virtual('enrolledCount').get(function () {
  return this.enrolledStudents ? this.enrolledStudents.length : 0;
});

export default mongoose.model('TutoringSession', TutoringSessionSchema);
