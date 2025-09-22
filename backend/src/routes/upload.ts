import { Router, Request, Response } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';

const router = Router();

// ✅ Configure Cloudinary securely
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

// ✅ Configure Multer for in-memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image or video files are allowed'));
    }
  },
});

// ✅ Utility to upload a single buffer to Cloudinary
const uploadToCloudinary = (buffer: Buffer, folder: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto', // auto-detect image/video
        transformation: [
          { width: 800, height: 800, crop: 'limit' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
};

// ✅ POST /api/upload/image – Upload single image/video
router.post('/image', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });

    const result = await uploadToCloudinary(req.file.buffer, 'ecommerce-products');
    res.status(200).json({
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (err) {
    console.error('Upload failed:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// ✅ POST /api/upload/images – Upload multiple
router.post('/images', upload.array('images', 5), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files provided' });
    }

    const uploadResults = await Promise.all(
      files.map((file) => uploadToCloudinary(file.buffer, 'ecommerce-products'))
    );

    res.status(200).json({
      images: uploadResults.map((res: any) => ({
        url: res.secure_url,
        public_id: res.public_id,
      })),
    });
  } catch (err) {
    console.error('Multiple upload failed:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// ✅ DELETE /api/upload/image/:public_id
router.delete('/image/:public_id', async (req: Request, res: Response) => {
  try {
    const { public_id } = req.params;
    await cloudinary.uploader.destroy(public_id, { resource_type: 'image' });

    res.status(200).json({ message: 'Image deleted successfully' });
  } catch (err) {
    console.error('Delete failed:', err);
    res.status(500).json({ error: 'Delete failed' });
  }
});

export default router;
