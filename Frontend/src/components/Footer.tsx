import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Phone, MessageSquare } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-deep-black border-t border-ritual-red/20 py-12">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <h3 className="font-cinzel text-2xl text-antique-gold mb-4">IGNITE</h3>
            <p className="font-cormorant text-gray-400 leading-relaxed mb-6">
              Where darkness meets light, where the mundane transforms into the sacred. 
              Join the Circle and discover your true power.
            </p>
            {/* Social Icons */}
            <div className="flex space-x-4 text-gray-400">
              <a
                href="https://instagram.com/YOUR_INSTAGRAM_HANDLE"
                target="_blank"
                rel="noopener noreferrer"
                title="Instagram"
              >
                <Instagram className="w-5 h-5 hover:text-ritual-red transition-colors" />
              </a>
              <a
                href="https://wa.me/YOUR_NUMBER"
                target="_blank"
                rel="noopener noreferrer"
                title="WhatsApp"
              >
                <MessageSquare className="w-5 h-5 hover:text-ritual-red transition-colors" />
              </a>
              <a
                href="tel:+917798295767"
                title="Call Us"
              >
                <Phone className="w-5 h-5 hover:text-ritual-red transition-colors" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-cinzel text-lg text-antique-gold mb-4">The Path</h4>
            <ul className="space-y-2 font-cormorant text-gray-400">
              <li><Link to="/shop" className="hover:text-ritual-red transition-colors">Shop</Link></li>
              <li><a href="#bloodbound" className="hover:text-ritual-red transition-colors">Collection</a></li>
              <li><a href="#circle" className="hover:text-ritual-red transition-colors">The Circle</a></li>
              <li><Link to="/track" className="hover:text-ritual-red transition-colors">Track Order</Link></li>
            </ul>
          </div>

          {/* Sacred Knowledge */}
          <div>
            <h4 className="font-cinzel text-lg text-antique-gold mb-4">Sacred Knowledge</h4>
            <ul className="space-y-2 font-cormorant text-gray-400">
              <li><a href="#" className="hover:text-ritual-red transition-colors">Rituals</a></li>
              <li><a href="#" className="hover:text-ritual-red transition-colors">community</a></li>
              <li><a href="#" className="hover:text-ritual-red transition-colors">return policy</a></li>
              <li><a href="#" className="hover:text-ritual-red transition-colors">Contact us</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-ritual-red/20 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="font-cormorant text-gray-400 text-sm">
            © 2025 IGNITE. All rights reserved. Powered by Darkness.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0 font-cormorant text-sm text-gray-400">
            <a href="#" className="hover:text-ritual-red transition-colors">Privacy</a>
            <a href="#" className="hover:text-ritual-red transition-colors">Terms&co</a>
            <a href="#" className="hover:text-ritual-red transition-colors">Sacred Code</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
