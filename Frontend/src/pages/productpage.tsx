import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import productService from '../services/productService';
import discountService from '../services/discountservice';
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
  const [selectedSize, setSelectedSize] = useState('M');

  const [discountCode, setDiscountCode] = useState('');
  const [discountError, setDiscountError] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await productService.getProductById(id as string);
        setProduct(res.data);
      } catch (err) {
        console.error('❌ Failed to fetch product:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProduct();
  }, [id]);

  const handleApplyDiscount = async () => {
    try {
      setDiscountError('');
      const res = await discountService.validateDiscountCode(discountCode);
      const discount = res.data;

      if (discount.type === 'percentage') {
        setDiscountAmount((product.price * discount.value) / 100);
      } else {
        setDiscountAmount(discount.value);
      }
    } catch (err: any) {
      setDiscountError(err.message || 'Invalid discount code');
      setDiscountAmount(0);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-white">Loading...</div>;
  }

  if (!product) {
    return (
      <div className="text-center py-20 text-red-500">
        ❌ Product not found. Please check the link or try again.
      </div>
    );
  }

  const finalPrice = Math.max(product.price - discountAmount, 0);

  console.log('[ProductPage] product:', product);

  return (
    <div className="min-h-screen pt-24 pb-12 bg-deep-black text-white px-4 md:px-12">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10">
        {/* Product Image */}
        <div className="rounded overflow-hidden">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-auto object-cover rounded shadow-lg"
          />
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <h1 className="font-cinzel text-3xl text-antique-gold">{product.name}</h1>

          {/* Star Ratings */}
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
            {product.description}
          </p>

          {/* Size Selection */}
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

          {/* Discount Code Input */}
          <div className="mt-4">
            <label className="text-sm block text-gray-400 mb-1">Apply Discount Code</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
                placeholder="Enter code"
                className="px-3 py-2 rounded bg-black text-white border border-gray-600 focus:outline-none focus:border-ritual-red"
              />
              <button
                onClick={handleApplyDiscount}
                className="px-4 py-2 bg-ritual-red text-white rounded hover:bg-blood-red transition"
              >
                Apply
              </button>
            </div>
            {discountError && <p className="text-sm text-red-500 mt-1">{discountError}</p>}
            {discountAmount > 0 && (
              <p className="text-sm text-green-400 mt-1">
                Discount applied: -{formatPrice(discountAmount)}
              </p>
            )}
          </div>

          {/* Final Price */}
          <div className="text-2xl font-semibold text-ritual-red">
            {formatPrice(finalPrice)}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={() =>
                addItem({
                  id: product.id,
                  name: product.name,
                  price: finalPrice,
                  image: product.image || '',
                  size: selectedSize
                })
              }
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
        {product.id && <ReviewSection productId={product.id} />}
      </div>
    </div>
  );
};

export default ProductPage;
