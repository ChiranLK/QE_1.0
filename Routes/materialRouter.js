import express from 'express';
import { uploadMaterial as uploadHandler } from '../Middleware/uploadMiddleware.js';
import {
  uploadMaterial,
  getAllMaterials,
  updateMaterial,
  deleteMaterial,
} from '../Controllers/materialController.js';
import { protect, authorizeRoles } from '../Middleware/authMiddleware.js';

const router = express.Router();

// List materials (all authenticated users)
router.get('/', protect, getAllMaterials);

// Upload (Tutor or Admin) - single file field named 'file'
router.post('/', protect, authorizeRoles('Tutor', 'Admin'), uploadHandler.single('file'), uploadMaterial);

// Update - uploader or admin
router.put('/:id', protect, authorizeRoles('Tutor', 'Admin'), uploadHandler.single('file'), updateMaterial);

// Delete - uploader or admin
router.delete('/:id', protect, authorizeRoles('Tutor', 'Admin'), deleteMaterial);

export default router;
