import { Router, Request, Response } from 'express';
import { Discount } from '../models/discount';
import { asyncHandler, createError } from '../middleware/errorHandler';

const router = Router();

// ✅ Validate discount code
router.post('/validate', asyncHandler(async (req: Request, res: Response) => {
  const { code } = req.body;

  if (!code) {
    throw createError('Discount code is required', 400);
  }

  const discount = await Discount.findOne({ code: code.toUpperCase(), isActive: true });

  if (!discount) {
    throw createError('Invalid or expired discount code', 400);
  }

  if (discount.expiresAt && new Date() > new Date(discount.expiresAt)) {
    throw createError('Discount code expired', 400);
  }

  res.json({ success: true, data: discount });
}));

// ✅ Admin route: Add new discount
router.post('/create', asyncHandler(async (req: Request, res: Response) => {
  const { code, type, value, expiresAt } = req.body;

  if (!code || !type || typeof value !== 'number') {
    throw createError('Code, type and value are required', 400);
  }

  const newDiscount = new Discount({
    code: code.toUpperCase(),
    type,
    value,
    expiresAt
  });

  await newDiscount.save();

  res.json({ success: true, message: 'Discount created successfully' });
}));

export default router;
