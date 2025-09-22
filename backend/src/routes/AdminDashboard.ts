import express from 'express';
import { Product } from '../models/Product';
import { requireAdmin } from '../middleware/auth'; // Correct path to your admin middleware

const router = express.Router();

// CREATE product (Admin only)
router.post('/', requireAdmin, async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(500).json({ message: 'Error creating product', error: err });
  }
});

// GET all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching products', error: err });
  }
});

// UPDATE product (Admin only)
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error updating product', error: err });
  }
});

// DELETE product (Admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting product', error: err });
  }
});

export default router;
