import StudyMaterial from '../models/StudyMaterial.js';
import { StatusCodes } from 'http-status-codes';
import fs from 'fs';
import path from 'path';

export const uploadMaterial = async (req, res) => {
  try {
    const { title, description, subject, grade } = req.body;
    if (!title || !subject || !grade) {
      // remove uploaded file if any
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Title, subject and grade are required' });
    }

    if (!req.file) {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'File is required' });
    }

    // store only relative file path or URL-safe path
    const fileUrl = path.join('uploads', 'materials', path.basename(req.file.path));

    const material = await StudyMaterial.create({
      title,
      description,
      subject,
      grade,
      fileUrl,
      uploadedBy: req.user._id,
    });

    return res.status(StatusCodes.CREATED).json({ material });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: 'Server error', error: error.message });
  }
};

export const getAllMaterials = async (req, res) => {
  try {
    const { subject, grade, search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (subject) filter.subject = subject;
    if (grade) filter.grade = grade;
    if (search) filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];

    const skip = (Math.max(parseInt(page, 10), 1) - 1) * parseInt(limit, 10);

    const materials = await StudyMaterial.find(filter)
      .populate('uploadedBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    return res.status(StatusCodes.OK).json({ materials });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: 'Server error', error: error.message });
  }
};

export const updateMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const material = await StudyMaterial.findById(id);
    if (!material) return res.status(StatusCodes.NOT_FOUND).json({ msg: 'Material not found' });

    // Only uploader or Admin can update
    if (req.user.role !== 'Admin' && material.uploadedBy.toString() !== req.user._id.toString()) {
      // remove uploaded file if any
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(StatusCodes.FORBIDDEN).json({ msg: 'Forbidden' });
    }

    // If new file uploaded, remove old file
    if (req.file) {
      const oldPath = path.join(process.cwd(), material.fileUrl);
      try { if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath); } catch (e) {}
      material.fileUrl = path.join('uploads', 'materials', path.basename(req.file.path));
    }

    const { title, description, subject, grade } = req.body;
    if (title) material.title = title;
    if (description) material.description = description;
    if (subject) material.subject = subject;
    if (grade) material.grade = grade;

    await material.save();
    return res.status(StatusCodes.OK).json({ material });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: 'Server error', error: error.message });
  }
};

export const deleteMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const material = await StudyMaterial.findById(id);
    if (!material) return res.status(StatusCodes.NOT_FOUND).json({ msg: 'Material not found' });

    // Only uploader or Admin can delete
    if (req.user.role !== 'Admin' && material.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(StatusCodes.FORBIDDEN).json({ msg: 'Forbidden' });
    }

    // delete file from disk
    const filePath = path.join(process.cwd(), material.fileUrl);
    try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (e) {}

    await material.remove();
    return res.status(StatusCodes.NO_CONTENT).send();
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: 'Server error', error: error.message });
  }
};
