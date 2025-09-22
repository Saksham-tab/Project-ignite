import { Router, Request, Response } from 'express';
import { Product } from '../models/Product';
import { Category } from '../models/Category';
import mongoose from 'mongoose';

const router = Router();

// Get all products with optional filters
router.get('/', async (req: Request, res: Response) => {
  try {
    console.log('📦 GET /products - Fetching products from MongoDB...');
    
    const { category, featured, limit = 50, offset = 0 } = req.query;
    
    let query: any = {};
    
    // Filter by category if provided
    if (category && mongoose.Types.ObjectId.isValid(category as string)) {
      query.category_id = category;
    }
    
    // Filter by featured if provided
    if (featured !== undefined) {
      query.featured = featured === 'true';
    }
    
    const products = await Product.find(query)
      .populate('category_id', 'name description')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(Number(offset));
    
    console.log(`✅ Found ${products.length} products in MongoDB`);
    
    res.status(200).json({
      success: true,
      data: products,
      total: products.length
    });
    
  } catch (error) {
    console.error('❌ Error fetching products from MongoDB:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch products' 
    });
  }
});

// Get product by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log(`📦 GET /products/${id} - Fetching product from MongoDB...`);
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid product ID format' 
      });
    }
    
    const product = await Product.findById(id).populate('category_id', 'name description');
    
    if (!product) {
      return res.status(404).json({ 
        success: false,
        error: 'Product not found' 
      });
    }
    
    console.log(`✅ Found product: ${product.name}`);
    
    res.status(200).json({
      success: true,
      data: product
    });
    
  } catch (error) {
    console.error('❌ Error fetching product from MongoDB:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch product' 
    });
  }
});

// Get featured products
router.get('/featured/list', async (req: Request, res: Response) => {
  try {
    console.log('📦 GET /products/featured - Fetching featured products...');
    
    const products = await Product.find({ featured: true })
      .populate('category_id', 'name description')
      .sort({ createdAt: -1 })
      .limit(6);
    
    console.log(`✅ Found ${products.length} featured products`);
    
    res.status(200).json({
      success: true,
      data: products
    });
    
  } catch (error) {
    console.error('❌ Error fetching featured products:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch featured products' 
    });
  }
});

// Create product (Admin only)
router.post('/', async (req: Request, res: Response) => {
  try {
    console.log('📦 POST /products - Creating product...');
    
    const { name, description, price, category_id, image_url, stock_quantity, featured } = req.body;
    
    // Validate required fields
    if (!name || !description || !price || !category_id || !image_url) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, description, price, category_id, image_url'
      });
    }
    
    // Validate category exists
    if (!mongoose.Types.ObjectId.isValid(category_id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category ID format'
      });
    }
    
    const categoryExists = await Category.findById(category_id);
    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        error: 'Category not found'
      });
    }
    
    const newProduct = new Product({
      name,
      description,
      price: Number(price),
      category_id,
      image_url,
      stock_quantity: Number(stock_quantity) || 0,
      featured: Boolean(featured)
    });
    
    const savedProduct = await newProduct.save();
    await savedProduct.populate('category_id', 'name description');
    
    console.log(`✅ Created product: ${savedProduct.name}`);
    
    res.status(201).json({
      success: true,
      data: savedProduct
    });
    
  } catch (error) {
    console.error('❌ Error creating product:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create product' 
    });
  }
});

// Update product (Admin only)
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log(`📦 PUT /products/${id} - Updating product...`);
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid product ID format'
      });
    }
    
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    ).populate('category_id', 'name description');
    
    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    console.log(`✅ Updated product: ${updatedProduct.name}`);
    
    res.status(200).json({
      success: true,
      data: updatedProduct
    });
    
  } catch (error) {
    console.error('❌ Error updating product:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update product' 
    });
  }
});

// Delete product (Admin only)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log(`📦 DELETE /products/${id} - Deleting product...`);
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid product ID format'
      });
    }
    
    const deletedProduct = await Product.findByIdAndDelete(id);
    
    if (!deletedProduct) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    console.log(`✅ Deleted product: ${deletedProduct.name}`);
    
    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
    
  } catch (error) {
    console.error('❌ Error deleting product:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete product' 
    });
  }
});

export default router;
