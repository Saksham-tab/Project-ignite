import { Router, Request, Response } from 'express';
import { Category } from '../models/Category';
import mongoose from 'mongoose';

const router = Router();

// Get all categories
router.get('/', async (req: Request, res: Response) => {
  try {
    console.log('📂 GET /categories - Fetching categories from MongoDB...');
    
    const categories = await Category.find()
      .sort({ name: 1 });
    
    console.log(`✅ Found ${categories.length} categories in MongoDB`);
    
    res.status(200).json({
      success: true,
      data: categories
    });
    
  } catch (error) {
    console.error('❌ Error fetching categories from MongoDB:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch categories' 
    });
  }
});

// Get category by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log(`📂 GET /categories/${id} - Fetching category from MongoDB...`);
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category ID format'
      });
    }
    
    const category = await Category.findById(id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }
    
    console.log(`✅ Found category: ${category.name}`);
    
    res.status(200).json({
      success: true,
      data: category
    });
    
  } catch (error) {
    console.error('❌ Error fetching category from MongoDB:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch category' 
    });
  }
});

// Create category (Admin only)
router.post('/', async (req: Request, res: Response) => {
  try {
    console.log('📂 POST /categories - Creating category...');
    
    const { name, description, image_url } = req.body;
    
    if (!name || !description) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, description'
      });
    }
    
    const newCategory = new Category({
      name,
      description,
      image_url: image_url || ''
    });
    
    const savedCategory = await newCategory.save();
    
    console.log(`✅ Created category: ${savedCategory.name}`);
    
    res.status(201).json({
      success: true,
      data: savedCategory
    });
      } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Category name already exists'
      });
    }
    
    console.error('❌ Error creating category:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create category' 
    });
  }
});

// Update category (Admin only)
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log(`📂 PUT /categories/${id} - Updating category...`);
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category ID format'
      });
    }
    
    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updatedCategory) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }
    
    console.log(`✅ Updated category: ${updatedCategory.name}`);
    
    res.status(200).json({
      success: true,
      data: updatedCategory
    });
    
  } catch (error) {
    console.error('❌ Error updating category:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update category' 
    });
  }
});

// Delete category (Admin only)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log(`📂 DELETE /categories/${id} - Deleting category...`);
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category ID format'
      });
    }
    
    const deletedCategory = await Category.findByIdAndDelete(id);
    
    if (!deletedCategory) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }
    
    console.log(`✅ Deleted category: ${deletedCategory.name}`);
    
    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
    
  } catch (error) {
    console.error('❌ Error deleting category:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete category' 
    });
  }
});

export default router;
