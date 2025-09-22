import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useCart } from '../context/CartContext';

gsap.registerPlugin(ScrollTrigger);

const BloodboundCollection: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const { addItem } = useCart();

  const collections = [
    {
      id: 'ritual-robes',
      title: 'Ritual Robes',
      description: 'Sacred garments for the initiated. Woven with threads of destiny.',
      price: 299,
      image: 'https://images.pexels.com/photos/6069112/pexels-photo-6069112.jpeg?auto=compress&cs=tinysrgb&w=800',
      symbol: ''
    },
    {
      id: 'blood-pendant',
      title: 'Blood Pendant',
      description: 'Channel the ancient power. Forged in the fires of transformation.',
      price: 199,
      image: 'https://images.pexels.com/photos/1191531/pexels-photo-1191531.jpeg?auto=compress&cs=tinysrgb&w=800',
      symbol: ''
    },
    {
      id: 'shadow-cloak',
      title: 'Shadow Cloak',
      description: 'Embrace the darkness. Move unseen through the world of the mundane.',
      price: 399,
      image: 'https://images.pexels.com/photos/7148621/pexels-photo-7148621.jpeg?auto=compress&cs=tinysrgb&w=800',
      symbol: ''
    },
    {
      id: 'flame-crown',
      title: 'Flame Crown',
      description: 'Crown of the enlightened. Wear your power with pride.',
      price: 499,
      image: 'https://images.pexels.com/photos/6069110/pexels-photo-6069110.jpeg?auto=compress&cs=tinysrgb&w=800',
      symbol: ''
    }
  ];

  useEffect(() => {
    const cards = cardsRef.current?.children;
    if (!cards) return;

    // Faster, snappier entrance animation
    gsap.fromTo(cards,
      { opacity: 0, y: 100, rotationX: 45 },
      {
        opacity: 1,
        y: 0,
        rotationX: 0,
        duration: 0.4,
        stagger: 0.15,
        ease: 'power1.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
          toggleActions: 'play none none reverse'
        }
      }
    );

    // Hover animations
    Array.from(cards).forEach((card) => {
      const cardElement = card as HTMLElement;

      cardElement.addEventListener('mouseenter', () => {
        gsap.to(cardElement, {
          scale: 1.05,
          rotationY: 5,
          duration: 0.1,
          ease: 'power2.out'
        });
      });

      cardElement.addEventListener('mouseleave', () => {
        gsap.to(cardElement, {
          scale: 1,
          rotationY: 0,
          duration: 0.1,
          ease: 'power2.out'
        });
      });
    });

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  const handleAddToCart = (item: typeof collections[0]) => {
    addItem({
      id: item.id,
      name: item.title,
      price: item.price,
      image: item.image
    });

    gsap.to(`.add-btn-${item.id}`, {
      scale: 0.9,
      duration: 0.1,
      yoyo: true,
      repeat: 1
    });
  };

  return (
    <section id="bloodbound" ref={sectionRef} className="py-20 bg-gradient-to-b from-ash-gray/20 to-deep-black">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="font-cinzel text-4xl md:text-5xl text-antique-gold mb-4">
            Bloodbound Collection
          </h2>
          <p className="font-cormorant text-xl text-gray-300 max-w-2xl mx-auto">
            Sacred artifacts for the chosen. Each piece carries the weight of ancient wisdom 
            and the promise of transformation.
          </p>
        </div>

        <div ref={cardsRef} className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {collections.map((item) => (
            <div
              key={item.id}
              className="group relative bg-ash-gray/30 rounded-lg overflow-hidden border border-ritual-red/20 hover:border-ritual-red/50 transition-all duration-500"
            >
              {/* Image */}
              <div className="relative h-64 overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-deep-black/80 to-transparent"></div>
                <div className="absolute top-4 right-4 text-2xl">{item.symbol}</div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="font-cinzel text-xl text-antique-gold mb-2 group-hover:text-ritual-red transition-colors duration-300">
                  {item.title}
                </h3>
                <p className="font-cormorant text-gray-400 text-sm mb-4 leading-relaxed">
                  {item.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="font-cinzel text-lg text-ritual-red">
                    ${item.price}
                  </span>
                  <button
                    onClick={() => handleAddToCart(item)}
                    className={`add-btn-${item.id} px-4 py-2 bg-ritual-red text-white font-cormorant text-sm hover:bg-blood-red transition-colors duration-300 rounded`}
                  >
                    Add to Cart
                  </button>
                </div>
              </div>

              {/* Glow effect on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-ritual-red transition-opacity duration-500 pointer-events-none"></div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <button className="group relative px-8 py-4 bg-transparent border-2 border-antique-gold text-antique-gold font-cormorant text-lg hover:bg-antique-gold hover:text-deep-black transition-all duration-500 overflow-hidden">
            <span className="relative z-10">Explore Full Collection</span>
            <div className="absolute inset-0 bg-antique-gold transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
          </button>
        </div>
      </div>
    </section>
  );
};

export default BloodboundCollection;
