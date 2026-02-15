import mongoose from 'mongoose';

const StudyMaterialSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    subject: { type: String, required: true, trim: true },
    grade: { type: String, required: true, trim: true },
    fileUrl: { type: String, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export default mongoose.model('StudyMaterial', StudyMaterialSchema);
