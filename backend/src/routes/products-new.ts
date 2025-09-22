import { Router, Request, Response } from 'express';
import { Product } from '../models/Product';
import { Category } from '../models/Category';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { validateProduct, validateProductQuery, validateObjectId } from '../middleware/validation';
import { asyncHandler, createError } from '../middleware/errorHandler';

const router = Router();

// Get all products with filters, sorting, and pagination
router.get('/', validateProductQuery, asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 12;
  const skip = (page - 1) * limit;
  
  // Build query
  const query: any = { isActive: true };
  
  // Category filter
  if (req.query.category) {
    query.category_id = req.query.category;
  }
  
  // Featured filter
  if (req.query.featured !== undefined) {
    query.featured = req.query.featured === 'true';
  }
  
  // Price range filter
  if (req.query.minPrice || req.query.maxPrice) {
    query.price = {};
    if (req.query.minPrice) query.price.$gte = parseFloat(req.query.minPrice as string);
    if (req.query.maxPrice) query.price.$lte = parseFloat(req.query.maxPrice as string);
  }
  
  // Size filter
  if (req.query.size) {
    query['sizes.size'] = req.query.size;
    query['sizes.stock'] = { $gt: 0 }; // Only show products with stock in that size
  }
  
  // Search filter
  if (req.query.search) {
    query.$text = { $search: req.query.search };
  }
  
  // Color filter
  if (req.query.color) {
    query['colors.name'] = new RegExp(req.query.color as string, 'i');
  }

  // Sorting
  let sort: any = { createdAt: -1 };
  if (req.query.sort) {
    const sortField = req.query.sort as string;
    if (sortField.startsWith('-')) {
      sort = { [sortField.substring(1)]: -1 };
    } else {
      sort = { [sortField]: 1 };
    }
  }

  const products = await Product.find(query)
    .populate('category_id', 'name slug')
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await Product.countDocuments(query);

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
        hasPrev: page > 1
      }
    }
  });
}));

// Get product by ID
router.get('/:id', validateObjectId(), asyncHandler(async (req: Request, res: Response) => {
  const product = await Product.findOne({ _id: req.params.id, isActive: true })
    .populate('category_id', 'name slug description');

  if (!product) {
    throw createError('Product not found', 404);
  }

  res.json({
    success: true,
    data: { product }
  });
}));

// Get featured products
router.get('/featured/list', asyncHandler(async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 8;
  
  const products = await Product.find({ featured: true, isActive: true })
    .populate('category_id', 'name slug')
    .limit(limit)
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: { products }
  });
}));

// Get products by category
router.get('/category/:categoryId', validateObjectId('categoryId'), asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 12;
  const skip = (page - 1) * limit;

  const products = await Product.find({ 
    category_id: req.params.categoryId, 
    isActive: true 
  })
    .populate('category_id', 'name slug')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await Product.countDocuments({ 
    category_id: req.params.categoryId, 
    isActive: true 
  });

  res.json({
    success: true,
    data: {
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}));

// Search products
router.get('/search/query', asyncHandler(async (req: Request, res: Response) => {
  const { q, page = 1, limit = 12 } = req.query;
  
  if (!q) {
    throw createError('Search query is required', 400);
  }

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const query = {
    $and: [
      { isActive: true },
      {
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } },
          { tags: { $in: [new RegExp(q as string, 'i')] } }
        ]
      }
    ]
  };

  const products = await Product.find(query)
    .populate('category_id', 'name slug')
    .skip(skip)
    .limit(parseInt(limit as string))
    .sort({ createdAt: -1 });

  const total = await Product.countDocuments(query);

  res.json({
    success: true,
    data: {
      products,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    }
  });
}));

// Create product (Admin only)
router.post('/', authenticateToken, requireAdmin, validateProduct, asyncHandler(async (req: Request, res: Response) => {
  const productData = req.body;
  
  // Verify category exists
  const category = await Category.findById(productData.category_id);
  if (!category) {
    throw createError('Category not found', 404);
  }

  const product = await Product.create(productData);
  await product.populate('category_id', 'name slug');

  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: { product }
  });
}));

// Update product (Admin only)
router.put('/:id', authenticateToken, requireAdmin, validateObjectId(), asyncHandler(async (req: Request, res: Response) => {
  const updates = req.body;

  // If category is being updated, verify it exists
  if (updates.category_id) {
    const category = await Category.findById(updates.category_id);
    if (!category) {
      throw createError('Category not found', 404);
    }
  }

  const product = await Product.findByIdAndUpdate(
    req.params.id,
    updates,
    { new: true, runValidators: true }
  ).populate('category_id', 'name slug');

  if (!product) {
    throw createError('Product not found', 404);
  }

  res.json({
    success: true,
    message: 'Product updated successfully',
    data: { product }
  });
}));

// Delete product (Admin only) - Soft delete
router.delete('/:id', authenticateToken, requireAdmin, validateObjectId(), asyncHandler(async (req: Request, res: Response) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );

  if (!product) {
    throw createError('Product not found', 404);
  }

  res.json({
    success: true,
    message: 'Product deleted successfully'
  });
}));

// Toggle featured status (Admin only)
router.patch('/:id/featured', authenticateToken, requireAdmin, validateObjectId(), asyncHandler(async (req: Request, res: Response) => {
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    throw createError('Product not found', 404);
  }

  product.featured = !product.featured;
  await product.save();

  res.json({
    success: true,
    message: `Product ${product.featured ? 'featured' : 'unfeatured'} successfully`,
    data: { product }
  });
}));

// Update stock for a specific size (Admin only)
router.patch('/:id/stock', authenticateToken, requireAdmin, validateObjectId(), asyncHandler(async (req: Request, res: Response) => {
  const { size, stock } = req.body;

  if (!size || stock === undefined) {
    throw createError('Size and stock are required', 400);
  }

  if (!['XS', 'S', 'M', 'L', 'XL', 'XXL'].includes(size)) {
    throw createError('Invalid size', 400);
  }

  if (stock < 0) {
    throw createError('Stock cannot be negative', 400);
  }

  const product = await Product.findById(req.params.id);
  if (!product) {
    throw createError('Product not found', 404);
  }

  const sizeIndex = product.sizes.findIndex(s => s.size === size);
  if (sizeIndex === -1) {
    // Add new size
    product.sizes.push({ size, stock });
  } else {
    // Update existing size
    product.sizes[sizeIndex].stock = stock;
  }

  // Update total stock
  product.stock_quantity = product.sizes.reduce((total, s) => total + s.stock, 0);

  await product.save();

  res.json({
    success: true,
    message: 'Stock updated successfully',
    data: { product }
  });
}));

// Get product statistics (Admin only)
router.get('/admin/stats', authenticateToken, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const totalProducts = await Product.countDocuments();
  const activeProducts = await Product.countDocuments({ isActive: true });
  const featuredProducts = await Product.countDocuments({ featured: true, isActive: true });
  const outOfStock = await Product.countDocuments({ stock_quantity: 0, isActive: true });
  const lowStock = await Product.countDocuments({ 
    stock_quantity: { $gt: 0, $lte: 5 }, 
    isActive: true 
  });

  res.json({
    success: true,
    data: {
      totalProducts,
      activeProducts,
      featuredProducts,
      outOfStock,
      lowStock
    }
  });
}));

export default router;
