import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';

const router = express.Router();

// ✅ Review Schema with `image`
const reviewSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  username: { type: String, default: 'Anonymous' },
  rating: { type: Number, required: true },
  comment: { type: String, required: true },
  image: { type: String }, // ✅ renamed from photo → image
  createdAt: { type: Date, default: Date.now },
});

// Add toJSON transform for consistent ID handling
reviewSchema.set('toJSON', {
  transform: function(doc, ret) {
    // Always ensure both id and _id are present for compatibility
    ret.id = ret._id;
    delete ret.__v;
    return ret;
  }
});

const Review = mongoose.model('Review', reviewSchema);

// ✅ Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads/reviews');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({ storage });

/**
 * @route POST /api/reviews/:productId
 * @desc Submit a review with optional image/video
 */
router.post('/:productId', upload.single('image'), async (req: Request, res: Response) => {
  try {
    const { rating, comment, username } = req.body;
    const { productId } = req.params;

    // Validate productId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, error: 'Invalid or missing product ID.' });
    }

    if (!rating || !comment) {
      return res.status(400).json({ success: false, error: 'Rating and comment are required.' });
    }

    const newReview = new Review({
      productId,
      rating: Number(rating),
      comment,
      username: username || 'Anonymous',
      image: req.file?.filename || null, // ✅ saved as 'image'
    });

    await newReview.save();

    res.status(201).json({ success: true, data: newReview });
  } catch (error) {
    console.error('Review submission failed:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

/**
 * @route GET /api/reviews/:productId
 * @desc Fetch all reviews for a product
 */
router.get('/:productId', async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const reviews = await Review.find({ productId }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    console.error('Failed to fetch reviews:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

export default router;
