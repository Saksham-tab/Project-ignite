import React, { useState, useEffect } from 'react';
import { Search, ShoppingBag, Menu, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { gsap } from 'gsap';
import CartDropdown from './CartDropdown';
import { FaWhatsapp } from 'react-icons/fa';


interface HeaderProps {
  onLoginClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLoginClick }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    gsap.fromTo('.header-logo', 
      { opacity: 0, y: -20 },
      { opacity: 1, y: 0, duration: 1, delay: 0.5 }
    );

    gsap.fromTo('.header-nav', 
      { opacity: 0, y: -20 },
      { opacity: 1, y: 0, duration: 1, delay: 0.7, stagger: 0.1 }
    );
  }, []);

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (!isSearchOpen) {
      setTimeout(() => {
        document.getElementById('search-input')?.focus();
      }, 100);
    }
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${
      isScrolled ? 'bg-deep-black/95 backdrop-blur-md border-b border-ritual-red/20' : 'bg-transparent'
    }`}>
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="header-logo">
            <h1 className="font-cinzel text-2xl md:text-3xl text-antique-gold hover:text-ritual-red transition-colors duration-300">
              IGNITE
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            <Link to="/shop" className="header-nav font-cormorant text-lg hover:text-ritual-red transition-colors duration-300">
              Shop
            </Link>
            <div className="header-nav relative group">
              <button className="font-cormorant text-lg hover:text-ritual-red transition-colors duration-300">
                Collection
              </button>
              <div className="absolute top-full left-0 mt-2 w-48 bg-deep-black border border-ritual-red/20 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                <div className="p-4 space-y-2">
                  <a href="#bloodbound" className="block text-sm hover:text-ritual-red transition-colors">Bloodbound</a>
                  <a href="#ritual" className="block text-sm hover:text-ritual-red transition-colors">Ritual Wear</a>
                  <a href="#accessories" className="block text-sm hover:text-ritual-red transition-colors">Accessories</a>
                </div>
              </div>
            </div>
            <a href="#circle" className="header-nav font-cormorant text-lg hover:text-ritual-red transition-colors duration-300">
              The Circle
            </a>
            <Link to="/track" className="header-nav font-cormorant text-lg hover:text-ritual-red transition-colors duration-300">
              Track Order
            </Link>
          </nav>

          {/* Right Side Icons */}
          <div className="flex items-center space-x-4">
            <a
  href="https://wa.me/919999999999" // Replace with your number or group link
  target="_blank"
  rel="noopener noreferrer"
  className="text-green-500 hover:text-green-600 text-2xl mr-4"
  title="Join WhatsApp">
    <FaWhatsapp />
</a>
           {/* Search */}
            <button
              onClick={toggleSearch}
              className="header-nav p-2 hover:text-ritual-red transition-colors duration-300"
              aria-label="Open search"
              title="Search products"
            >
              <Search size={20} />
            </button>

            {/* Cart */}
            <button 
              onClick={() => setIsCartOpen(!isCartOpen)}
              className="header-nav relative p-2 hover:text-ritual-red transition-colors duration-300"
              aria-label="Open cart"
              title="View cart"
            >
              <ShoppingBag size={20} />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-ritual-red text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>

            {/* Login/Profile */}
            {user ? (
              <div className="header-nav relative group">
                <button className="font-cormorant text-sm hover:text-ritual-red transition-colors duration-300" title="User menu">
                  {user.firstName}
                </button>
                <div className="absolute top-full right-0 mt-2 w-40 bg-deep-black border border-ritual-red/20 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                  <div className="p-2 space-y-2">
                    {user?.role === 'admin' && (
                      <>
                        <Link
                          to="/admin"
                          className="block w-full text-left text-sm text-yellow-500 hover:text-ritual-red transition-colors"
                          title="Go to Admin Panel"
                        >
                          Admin Dashboard
                        </Link>
                        <button
                          onClick={() => navigate('/admin', { state: { showCreate: true } })}
                          className="block w-full text-left text-sm text-yellow-500 hover:text-ritual-red transition-colors"
                          title="Create New Product"
                        >
                          + Create Product
                        </button>
                      </>
                    )}
                    <button
                      onClick={logout}
                      className="block w-full text-left text-sm hover:text-ritual-red transition-colors"
                      title="Logout"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={onLoginClick}
                className="header-nav font-cormorant text-sm hover:text-ritual-red transition-colors duration-300"
                title="Login or register"
              >
                Join
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 hover:text-ritual-red transition-colors duration-300"
              aria-label="Toggle mobile menu"
              title="Toggle menu"
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {isSearchOpen && (
          <div className="mt-4 flex justify-center">
            <div className="w-full max-w-md relative">
              <input
                id="search-input"
                type="text"
                placeholder="Search the darkness..."
                className="w-full bg-ash-gray/50 border border-ritual-red/30 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-ritual-red transition-all duration-300"
              />
            </div>
          </div>
        )}

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t border-ritual-red/20">
            <nav className="flex flex-col space-y-4 mt-4">
              <Link to="/shop" className="font-cormorant text-lg hover:text-ritual-red transition-colors duration-300">
                Shop
              </Link>
              <a href="#bloodbound" className="font-cormorant text-lg hover:text-ritual-red transition-colors duration-300">
                Collection
              </a>
              <a href="#circle" className="font-cormorant text-lg hover:text-ritual-red transition-colors duration-300">
                The Circle
              </a>
              <Link to="/track" className="font-cormorant text-lg hover:text-ritual-red transition-colors duration-300">
                Track Order
              </Link>
            </nav>
          </div>
        )}
      </div>

      {/* Cart Dropdown */}
      <CartDropdown isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </header>
  );
};

export default Header;
