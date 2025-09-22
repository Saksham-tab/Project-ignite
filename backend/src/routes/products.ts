// routes/products.ts
import { Router, Request, Response } from 'express';
import { Product } from '../models/Product';
import { Category } from '../models/Category';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { validateProduct, validateProductQuery, validateObjectId } from '../middleware/validation';
import { asyncHandler, createError } from '../middleware/errorHandler';

const router = Router();

/**
 * GET /api/products
 * Query products with filters/pagination/sorting
 */
router.get(
  '/',
  validateProductQuery,
  asyncHandler(async (req: Request, res: Response) => {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string) || 12);
    const skip = (page - 1) * limit;

    const query: any = { isActive: true };

    // Apply all available filters
    if (req.query.category) {
      query.category_id = req.query.category;
    }
    if (req.query.featured !== undefined) {
      query.featured = req.query.featured === 'true';
    }
    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) query.price.$gte = parseFloat(req.query.minPrice as string);
      if (req.query.maxPrice) query.price.$lte = parseFloat(req.query.maxPrice as string);
    }
    if (req.query.size) {
      query['sizes.size'] = req.query.size;
      query['sizes.stock'] = { $gt: 0 };
    }
    if (req.query.color) {
      query['colors.name'] = new RegExp(req.query.color as string, 'i');
    }
    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }

    // Build sort
    let sort: any = { createdAt: -1 };
    if (req.query.sortBy) {
      const dir = req.query.sortOrder === 'desc' ? -1 : 1;
      sort = { [req.query.sortBy as string]: dir };
    } else if (req.query.sort) {
      const s = req.query.sort as string;
      if (s.startsWith('-')) {
        sort = { [s.slice(1)]: -1 };
      } else {
        sort = { [s]: 1 };
      }
    }

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('category_id', 'name slug')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Product.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: skip + limit < total,
          hasPrev: page > 1,
        },
      },
    });
  })
);

/**
 * GET /api/products/:id
 * Get one product detail
 */
router.get(
  '/:id',
  validateObjectId('id'),
  asyncHandler(async (req: Request, res: Response) => {
    const product = await Product.findOne({ _id: req.params.id, isActive: true })
      .populate('category_id', 'name slug description');
    if (!product) {
      throw createError('Product not found', 404);
    }
    res.json({ success: true, data: product });
  })
);

/**
 * GET /api/products/featured/list
 * Get featured products
 */
router.get(
  '/featured/list',
  asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 8;
    const products = await Product.find({ featured: true, isActive: true })
      .populate('category_id', 'name slug')
      .limit(limit)
      .sort({ createdAt: -1 });
    res.json({ success: true, data: { products } });
  })
);

/**
 * GET /api/products/category/:categoryId
 * Get by category
 */
router.get(
  '/category/:categoryId',
  validateObjectId('categoryId'),
  asyncHandler(async (req: Request, res: Response) => {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string) || 12);
    const skip = (page - 1) * limit;

    const products = await Product.find({
      category_id: req.params.categoryId,
      isActive: true,
    })
      .populate('category_id', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments({
      category_id: req.params.categoryId,
      isActive: true,
    });

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  })
);

/**
 * GET /api/products/search/query
 * Search by text
 */
router.get(
  '/search/query',
  asyncHandler(async (req: Request, res: Response) => {
    const q = req.query.q as string;
    if (!q) {
      throw createError('Query param `q` is required', 400);
    }
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string) || 12);
    const skip = (page - 1) * limit;

    const match = {
      $and: [
        { isActive: true },
        {
          $or: [
            { name: new RegExp(q, 'i') },
            { description: new RegExp(q, 'i') },
            { tags: { $in: [new RegExp(q, 'i')] } },
          ],
        },
      ],
    };

    const [products, total] = await Promise.all([
      Product.find(match)
        .populate('category_id', 'name slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Product.countDocuments(match),
    ]);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  })
);

/**
 * POST /api/products
 * Admin: create product
 */
router.post(
  '/',
  authenticateToken,
  requireAdmin,
  validateProduct,
  asyncHandler(async (req: Request, res: Response) => {
    const categoryExists = await Category.exists({ _id: req.body.category_id });
    if (!categoryExists) {
      throw createError('Category not found', 404);
    }
    const product = await Product.create(req.body);
    await product.populate('category_id', 'name slug');
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  })
);

/**
 * PUT /api/products/:id
 * Admin: update product
 */
router.put(
  '/:id',
  authenticateToken,
  requireAdmin,
  validateObjectId('id'),
  asyncHandler(async (req: Request, res: Response) => {
    if (req.body.category_id) {
      const catExists = await Category.exists({ _id: req.body.category_id });
      if (!catExists) throw createError('Category not found', 404);
    }
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('category_id', 'name slug');
    if (!product) throw createError('Product not found', 404);
    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product,
    });
  })
);

/**
 * DELETE /api/products/:id
 * Admin: soft-delete
 */
router.delete(
  '/:id',
  authenticateToken,
  requireAdmin,
  validateObjectId('id'),
  asyncHandler(async (req: Request, res: Response) => {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!product) throw createError('Product not found', 404);
    res.json({ success: true, message: 'Product deleted successfully' });
  })
);

/**
 * PATCH /api/products/:id/featured
 */
router.patch(
  '/:id/featured',
  authenticateToken,
  requireAdmin,
  validateObjectId('id'),
  asyncHandler(async (req: Request, res: Response) => {
    const product = await Product.findById(req.params.id);
    if (!product) throw createError('Product not found', 404);
    product.featured = !product.featured;
    await product.save();
    res.json({
      success: true,
      message: `Product ${product.featured ? 'featured' : 'unfeatured'}`,
      data: product,
    });
  })
);

/**
 * PUT /api/products/:id/stock
 * Admin: bulk update sizes stock
 */
router.put(
  '/:id/stock',
  authenticateToken,
  requireAdmin,
  validateObjectId('id'),
  asyncHandler(async (req: Request, res: Response) => {
    const { stock } = req.body;
    if (!stock || typeof stock !== 'object') {
      throw createError('Stock object is required', 400);
    }
    const product = await Product.findById(req.params.id);
    if (!product) throw createError('Product not found', 404);

    for (const [size, qty] of Object.entries(stock)) {
      if (!['XS','S','M','L','XL','XXL'].includes(size)) throw createError(`Invalid size: ${size}`, 400);
      if (typeof qty !== 'number' || qty < 0) throw createError(`Invalid qty for ${size}`, 400);
      const idx = product.sizes.findIndex(s => s.size === size);
      if (idx > -1) product.sizes[idx].stock = qty;
      else product.sizes.push({ size, stock: qty });
    }

    product.stock_quantity = product.sizes.reduce((sum, s) => sum + s.stock, 0);
    await product.save();

    const stockResponse: any = {};
    product.sizes.forEach(s => (stockResponse[s.size] = s.stock));

    res.json({
      success: true,
      message: 'Stock updated successfully',
      data: { stock: stockResponse, totalStock: product.stock_quantity },
    });
  })
);

/**
 * PATCH /api/products/:id/stock
 * Admin: update one size only
 */
router.patch(
  '/:id/stock',
  authenticateToken,
  requireAdmin,
  validateObjectId('id'),
  asyncHandler(async (req: Request, res: Response) => {
    const { size, stock } = req.body;
    if (!size || stock === undefined) throw createError('Size & stock are required', 400);
    if (!['XS','S','M','L','XL','XXL'].includes(size)) throw createError('Invalid size', 400);
    if (stock < 0) throw createError('Stock cannot be negative', 400);

    const product = await Product.findById(req.params.id);
    if (!product) throw createError('Product not found', 404);

    const idx = product.sizes.findIndex(s => s.size === size);
    if (idx > -1) product.sizes[idx].stock = stock;
    else product.sizes.push({ size, stock });

    product.stock_quantity = product.sizes.reduce((sum, s) => sum + s.stock, 0);
    await product.save();

    res.json({ success: true, message: 'Stock size updated', data: product });
  })
);

/**
 * GET /api/products/admin/stats
 * Admin: product stats
 */
router.get(
  '/admin/stats',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (_req: Request, res: Response) => {
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ isActive: true });
    const featuredProducts = await Product.countDocuments({ featured: true, isActive: true });
    const outOfStock = await Product.countDocuments({ stock_quantity: 0, isActive: true });
    const lowStock = await Product.countDocuments({ stock_quantity: { $gt: 0, $lte: 5 }, isActive: true });

    res.json({
      success: true,
      data: { totalProducts, activeProducts, featuredProducts, outOfStock, lowStock },
    });
  })
);

export default router;
