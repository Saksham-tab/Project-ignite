import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category_id: string;
}

interface Category {
  id: string;
  name: string;
}

const AdminDashboard: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({ name: '', description: '', price: '', image_url: '', category_id: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const location = useLocation();
  const formRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/products`);
      setProducts(res.data.data.products || res.data.products || []);
    } catch (err: any) {
      console.error('Error fetching products:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/categories`);
      setCategories(res.data.data || res.data.categories || []);
    } catch (err: any) {
      console.error('Error fetching categories:', err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    // Check for admin token
    const token = localStorage.getItem('ignite_token');
    if (!token) {
      setError('You must be logged in as admin to access this page.');
    }
  }, []);

  // Scroll to form on `+ Create Product`
  useEffect(() => {
    if (location.state?.showCreate && formRef.current) {
      setForm({ name: '', description: '', price: '', image_url: '', category_id: '' });
      setEditingId(null);
      formRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [location.state]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.name || !form.description || !form.price || !form.image_url || !form.category_id) {
      setError('All fields are required.');
      return;
    }
    setError(null);
    const payload = {
      name: form.name,
      description: form.description,
      price: parseFloat(form.price),
      image_url: form.image_url,
      category_id: form.category_id
    };
    const token = localStorage.getItem('ignite_token');
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    try {
      if (editingId) {
        await axios.put(`${import.meta.env.VITE_API_URL}/products/${editingId}`, payload, config);
        setEditingId(null);
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/products`, payload, config);
      }
      setForm({ name: '', description: '', price: '', image_url: '', category_id: '' });
      fetchProducts();
    } catch (err: any) {
      console.error('Error submitting form:', err);
      alert('Error: ' + (err.response?.data?.error || 'Failed to submit. Make sure you are logged in as admin and all fields are filled.'));
    }
  };

  const handleEdit = (product: Product) => {
    setForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      image_url: product.image_url,
      category_id: product.category_id || ''
    });
    setEditingId(product.id);
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    const token = localStorage.getItem('ignite_token');
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/products/${id}`, config);
      fetchProducts();
    } catch (err: any) {
      console.error('Error deleting product:', err);
      alert('Error: ' + (err.response?.data?.error || 'Failed to delete.'));
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto text-white">
      {error && <div className="bg-red-800 text-white p-3 mb-4 rounded">{error}</div>}
      <div ref={formRef}>
        <h1 className="text-3xl mb-6">{editingId ? 'Edit Product' : 'Create Product'}</h1>

        <div className="space-y-4 mb-10">
          <input name="name" value={form.name} onChange={handleChange} placeholder="Name"
            className="w-full p-2 bg-black text-white border border-gray-600" />
          <input name="description" value={form.description} onChange={handleChange} placeholder="Description"
            className="w-full p-2 bg-black text-white border border-gray-600" />
          <input name="price" value={form.price} onChange={handleChange} placeholder="Price" type="number"
            className="w-full p-2 bg-black text-white border border-gray-600" />
          <input name="image_url" value={form.image_url} onChange={handleChange} placeholder="Image URL"
            className="w-full p-2 bg-black text-white border border-gray-600" />
          <select name="category_id" value={form.category_id} onChange={handleChange}
            className="w-full p-2 bg-black text-white border border-gray-600">
            <option value="">{categories.length === 0 ? 'No categories found. Please add a category first.' : 'Select Category'}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <button onClick={handleSubmit}
            className="px-4 py-2 bg-ritual-red hover:bg-blood-red text-white"
            disabled={!form.name || !form.description || !form.price || !form.image_url || !form.category_id || !!error}>
            {editingId ? 'Update' : 'Create'} Product
          </button>
        </div>
      </div>

      <h2 className="text-2xl mb-4">All Products</h2>
      <div className="grid gap-6 md:grid-cols-2">
        {products.map((product) => (
          <div key={product.id} className="border border-gray-700 p-4 rounded">
            <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
            <p className="text-sm text-gray-300 mb-1">{product.description}</p>
            <p className="text-sm text-ritual-red mb-2">${product.price.toFixed(2)}</p>
            <img src={product.image_url} alt={product.name} className="w-32 h-32 object-cover mb-2 rounded" />
            <div className="flex gap-2">
              <button onClick={() => handleEdit(product)} className="text-sm px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded">Edit</button>
              <button onClick={() => handleDelete(product.id)} className="text-sm px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
