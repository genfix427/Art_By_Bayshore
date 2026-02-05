import express from 'express';
import {
  getArtists,
  getArtist,
  getArtistBySlug,
  getArtistProducts,
  createArtist,
  updateArtist,
  deleteArtist,
} from '../controllers/artistController.js';
import { protect, authorize } from '../middleware/auth.js';
import upload from '../config/upload.js';

const router = express.Router();

router.get('/', getArtists);
router.get('/slug/:slug', getArtistBySlug);
router.get('/:id', getArtist);
router.get('/:id/products', getArtistProducts);

router.post(
  '/',
  protect,
  authorize('admin', 'superadmin'),
  upload.single('profileImage'),
  createArtist
);

router.put(
  '/:id',
  protect,
  authorize('admin', 'superadmin'),
  upload.single('profileImage'),
  updateArtist
);

router.delete(
  '/:id',
  protect,
  authorize('admin', 'superadmin'),
  deleteArtist
);

export default router;