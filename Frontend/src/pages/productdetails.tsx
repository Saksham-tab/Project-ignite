import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import productService from '../services/productService';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils/currency';
import { Star } from 'lucide-react';
import ReviewSection from '../components/reviewsection';

const sizes = ['S', 'M', 'L', 'XL', 'XXL'];

const ProductPage = () => {
  const { id } = useParams<{ id: string }>();
  const { addItem } = useCart();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState('M');
  const [discountCode, setDiscountCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);

  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await productService.getProductById(id);
        console.log('Fetched Product:', response.data);
        setProduct(response.data);
      } catch (err: any) {
        console.error('Failed to load product:', err?.response?.data || err.message);
        setError('Product could not be loaded. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;

    addItem({
      id: product.id,
      name: product.name,
      price: finalPrice,
      image: product.image || '/default.jpg',
      size: selectedSize,
    });
  };

  const applyDiscount = () => {
    if (discountCode.toLowerCase() === 'ignite10') {
      const discount = product.price * 0.1;
      setDiscountAmount(discount);
      setDiscountApplied(true);
    } else {
      alert('Invalid discount code');
    }
  };

  const finalPrice = discountApplied ? product.price - discountAmount : product?.price;

  if (loading) {
    return <div className="text-center py-20 text-white">Loading product...</div>;
  }

  if (error || !product) {
    return (
      <div className="text-center py-20 text-white">
        <h2 className="text-xl text-ritual-red mb-2">⚠️ {error || 'Product not found.'}</h2>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 mt-4 bg-ritual-red text-white rounded hover:bg-blood-red"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 bg-deep-black text-white px-4 md:px-12">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10">
        {/* Product Image */}
        <div className="rounded overflow-hidden">
          <img
            src={product.image || '/default.jpg'}
            alt={product.name}
            className="w-full h-auto object-cover rounded shadow-lg"
          />
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <h1 className="font-cinzel text-3xl text-antique-gold">{product.name}</h1>

          {/* Reviews */}
          <div className="flex items-center space-x-2">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                size={18}
                className={
                  i < (product.averageRating || 0)
                    ? 'text-ritual-red fill-ritual-red'
                    : 'text-gray-600'
                }
              />
            ))}
            <span className="text-sm text-gray-400">
              ({product.totalReviews || 0} Reviews)
            </span>
          </div>

          {/* Description */}
          <p className="font-cormorant text-gray-300 leading-relaxed">
            {product.description || 'No description available.'}
          </p>

          {/* Size Selector */}
          <div className="space-y-1">
            <label className="block text-sm text-gray-400">Choose Size</label>
            <div className="flex gap-2">
              {sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`px-3 py-1 rounded border transition-colors ${
                    selectedSize === size
                      ? 'bg-ritual-red text-white border-ritual-red'
                      : 'bg-transparent text-gray-400 border-gray-600 hover:border-ritual-red'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Discount Code */}
          <div className="space-y-2">
            <label className="block text-sm text-gray-400">Discount Code</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
                className="px-3 py-2 w-full bg-deep-black border border-gray-600 rounded text-white"
                placeholder="Enter discount code"
              />
              <button
                onClick={applyDiscount}
                className="px-4 py-2 bg-ritual-red text-white rounded hover:bg-blood-red"
              >
                Apply
              </button>
            </div>
            {discountApplied && (
              <p className="text-green-400 text-sm">✅ Discount applied: ₹{discountAmount.toFixed(0)}</p>
            )}
          </div>

          {/* Price */}
          <div className="text-2xl font-semibold text-ritual-red">
            {formatPrice(finalPrice)}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={handleAddToCart}
              className="px-6 py-2 bg-ritual-red text-white rounded hover:bg-blood-red transition"
            >
              Add to Cart
            </button>
            <button
              className="px-6 py-2 bg-transparent border border-ritual-red text-ritual-red rounded hover:bg-ritual-red hover:text-white transition"
              onClick={() => alert('Redirect to checkout page')}
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>

      {/* ✅ Review Section */}
      <div className="max-w-6xl mx-auto mt-12">
        <ReviewSection productId={product.id} />
      </div>
    </div>
  );
};

export default ProductPage;
