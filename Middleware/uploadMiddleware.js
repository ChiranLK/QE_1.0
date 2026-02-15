import multer from 'multer';
import path from 'path';
import fs from 'fs';

const allowedMime = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png',
  'image/jpg',
];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'materials');
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeName = path.basename(file.originalname, ext).replace(/[^a-z0-9_\-]/gi, '_');
    const unique = `${Date.now()}_${safeName}${ext}`;
    cb(null, unique);
  },
});

export const uploadMaterial = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    if (allowedMime.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type'));
  },
});
