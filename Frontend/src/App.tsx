import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Preloader from './components/Preloader';
import Header from './components/Header';
import Hero from './components/Hero';
import OurFlame from './components/OurFlame';
import BloodboundCollection from './components/BloodboundCollection';
import TheCircle from './components/TheCircle';
import JoinTheFire from './components/JoinTheFire';
import Footer from './components/Footer';
import Shop from './pages/Shop';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import TrackOrder from './pages/TrackOrder';
import LoginModal from './components/LoginModal';
import DiscountPopup from './components/DiscountPopup';
import FloatingParticles from './components/FloatingParticles';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import AdminDashboard from './pages/AdminDashboard';
import ProductDetail from './pages/productdetails';
// Inside your <Routes> block:



gsap.registerPlugin(ScrollTrigger);

// Protect admin route
const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const { user } = useAuth();
  const isAdmin = user?.email === 'dubeysaksham@gmail.com';
  return isAdmin ? children : <Navigate to="/" />;
};

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showDiscountPopup, setShowDiscountPopup] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const hasSeenPopup = sessionStorage.getItem('discountPopupSeen');
      if (!hasSeenPopup) {
        setShowDiscountPopup(true);
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="min-h-screen relative">
            <div className="fixed inset-0 z-0 breathing-bg">
              <div className="absolute inset-0 bg-gradient-radial from-ritual-red/20 via-ritual-red/5 to-deep-black animate-breathing"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-deep-black via-ritual-red/10 to-deep-black animate-breathing-reverse"></div>
            </div>

            <div className="relative z-10 text-white">
              {isLoading && <Preloader onComplete={handleLoadingComplete} />}
              <FloatingParticles />
                
              <Routes>
                <Route path="/" element={
                  <>
                    <Header onLoginClick={() => setShowLoginModal(true)} />
                    <Hero />
                    <BloodboundCollection />
                    <TheCircle />
                    <OurFlame />
                    <JoinTheFire />
                    <Footer />
                  </>
                } />
                   <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/shop" element={
                  <>
                    <Header onLoginClick={() => setShowLoginModal(true)} />
                    <Shop />
                    <Footer />
                  </>
                } />

                <Route path="/track" element={
                  <>
                    <Header onLoginClick={() => setShowLoginModal(true)} />
                    <TrackOrder />
                    <Footer />
                  </>
                } />

                <Route path="/cart" element={
                  <>
                    <Header onLoginClick={() => setShowLoginModal(true)} />
                    <Cart />
                    <Footer />
                  </>
                } />

                <Route path="/checkout" element={
                  <>
                    <Header onLoginClick={() => setShowLoginModal(true)} />
                    <Checkout />
                    <Footer />
                  </>
                } />

                <Route path="/admin" element={
                  <PrivateRoute>
                    <>
                      <Header onLoginClick={() => setShowLoginModal(true)} />
                      <AdminDashboard />
                      <Footer />
                    </>
                  </PrivateRoute>
                } />
              </Routes>

              {showLoginModal && (
                <LoginModal onClose={() => setShowLoginModal(false)} />
              )}

              {showDiscountPopup && (
                <DiscountPopup onClose={() => setShowDiscountPopup(false)} />
              )}
            </div>
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
