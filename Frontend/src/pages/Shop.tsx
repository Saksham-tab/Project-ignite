import { useState, useEffect } from 'react';
import { Grid, List, Search } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { gsap } from 'gsap';
import { productService, categoryService } from '../services';
import { formatPrice } from '../utils/currency';
import type { Product as ApiProduct } from '../services/productService';
import type { Category } from '../services/categoryService';
import { Link } from 'react-router-dom';

const Shop = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addItem } = useCart();

  const getStock = (product: ApiProduct): number => {
    return product.quantity_in_stock || product.stock_quantity || product.totalStock || 0;
  };

  const getProductImage = (product: ApiProduct): string => {
    return product.image || product.image_url || '';
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const categoriesResponse = await categoryService.getCategories();
        setCategories(categoriesResponse.data);

        const params = selectedCategory !== 'all' ? { category: selectedCategory } : undefined;
        const productsResponse = await productService.getProducts(params);

        if (productsResponse.data && Array.isArray(productsResponse.data)) {
          setProducts(productsResponse.data);
        } else if (productsResponse.data && productsResponse.data.products) {
          setProducts(productsResponse.data.products);
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.error('Error fetching shop data:', err);
        setError('Failed to load products. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedCategory]);

  useEffect(() => {
    gsap.fromTo('.shop-header', { opacity: 0, y: -30 }, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', delay: 0.2 });
    gsap.fromTo('.product-card', { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out', delay: 0.5 });
  }, []);

  const filteredProducts = products
    .filter(product =>
      (selectedCategory === 'all' ||
        (typeof product.category_id === 'string'
          ? product.category_id === selectedCategory
          : product.category_id._id === selectedCategory)) &&
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

  const handleAddToCart = (e: React.MouseEvent, product: ApiProduct) => {
    e.preventDefault(); // Prevent link click
    e.stopPropagation(); // Stop bubbling up to Link
    const stock = getStock(product);
    const productImage = getProductImage(product);

    if (stock > 0) {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: productImage
      });
    }
  };

  return (
    <div className="min-h-screen bg-deep-black text-white pt-20 pb-12">
      <div className="container mx-auto px-6">
        <div className="fixed inset-0 breathing-bg pointer-events-none"></div>
        <div className="fixed inset-0 bg-gradient-radial from-ritual-red/5 via-transparent to-transparent pointer-events-none"></div>

        <div className="shop-header text-center mb-12 relative z-10">
          <h1 className="font-cinzel text-4xl md:text-5xl text-antique-gold mb-4 drop-shadow-lg">Sacred Marketplace</h1>
          <p className="font-cormorant text-xl text-gray-300 max-w-2xl mx-auto drop-shadow-md">
            Discover artifacts of power, garments of transformation, and tools of enlightenment.
          </p>
        </div>

        <div className="mb-8 space-y-4 lg:space-y-0 lg:flex lg:items-center lg:justify-between relative z-10">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search sacred items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-ash-gray/50 border border-ritual-red/30 rounded text-white placeholder-gray-400 font-cormorant focus:outline-none focus:border-ritual-red"
            />
          </div>

          <div className="flex items-center space-x-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 bg-ash-gray/50 border border-ritual-red/30 rounded text-white font-cormorant focus:outline-none focus:border-ritual-red"
            >
              <option value="all" className="bg-deep-black">All Categories</option>
              {categories.map(category => (
                <option key={category._id} value={category._id} className="bg-deep-black">{category.name}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 bg-ash-gray/50 border border-ritual-red/30 rounded text-white font-cormorant focus:outline-none focus:border-ritual-red"
            >
              <option value="name" className="bg-deep-black">Name</option>
              <option value="price-low" className="bg-deep-black">Price: Low to High</option>
              <option value="price-high" className="bg-deep-black">Price: High to Low</option>
            </select>

            <div className="flex border border-ritual-red/30 rounded overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-ritual-red text-white' : 'bg-ash-gray/50 text-gray-400'} hover:bg-ritual-red hover:text-white transition-colors`}
              >
                <Grid size={20} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-ritual-red text-white' : 'bg-ash-gray/50 text-gray-400'} hover:bg-ritual-red hover:text-white transition-colors`}
              >
                <List size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          {isLoading ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ritual-red mx-auto mb-4"></div>
              <p className="font-cormorant text-gray-400">Loading sacred items...</p>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <div className="text-4xl mb-4">⚠️</div>
              <h3 className="font-cinzel text-xl text-antique-gold mb-2">Connection Failed</h3>
              <p className="font-cormorant text-gray-400 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-ritual-red text-white rounded hover:bg-blood-red transition-colors"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
              {filteredProducts.map((product) => (
                <Link to={`/product/${product.id}`} key={product.id}>
                  <div className={`product-card group bg-ash-gray/30 rounded-lg overflow-hidden border border-ritual-red/20 hover:border-ritual-red/50 transition-all duration-500 backdrop-blur-sm ${viewMode === 'list' ? 'flex' : ''}`}>
                    <div className={`relative overflow-hidden ${viewMode === 'list' ? 'w-48 h-48' : 'h-64'}`}>
                      <img
                        src={getProductImage(product)}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-deep-black/80 to-transparent"></div>
                      {getStock(product) <= 0 && (
                        <div className="absolute inset-0 bg-deep-black/70 flex items-center justify-center">
                          <span className="font-cinzel text-ritual-red text-lg">Out of Stock</span>
                        </div>
                      )}
                    </div>
                    <div className="p-6 flex-1">
                      <h3 className="font-cinzel text-xl text-antique-gold mb-2 group-hover:text-ritual-red transition-colors duration-300">
                        {product.name}
                      </h3>
                      <p className="font-cormorant text-gray-400 text-sm mb-4 leading-relaxed">{product.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="font-cinzel text-lg text-ritual-red">{formatPrice(product.price)}</span>
                        <button
                          onClick={(e) => handleAddToCart(e, product)}
                          disabled={getStock(product) <= 0}
                          className="px-4 py-2 bg-ritual-red text-white font-cormorant text-sm hover:bg-blood-red transition-colors duration-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {getStock(product) > 0 ? 'Add to Cart' : 'Unavailable'}
                        </button>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Shop;
