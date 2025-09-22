import React, { useEffect } from 'react';
import { gsap } from 'gsap';

interface PreloaderProps {
  onComplete: () => void;
}

const Preloader: React.FC<PreloaderProps> = ({ onComplete }) => {
  useEffect(() => {
    const tl = gsap.timeline({
      onComplete: () => {
        setTimeout(onComplete, 500);
      }
    });

    // Fade in the full text together
    tl.fromTo(
      '.preloader-text',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 1, ease: 'power2.out' }
    ).to('.preloader', {
      opacity: 0,
      duration: 0.8,
      delay: 1
    });

    return () => {
      tl.kill();
    };
  }, [onComplete]);

  return (
    <div className="preloader fixed inset-0 bg-deep-black z-50 flex items-center justify-center">
      <div className="text-center">
        <div className="preloader-text">
          <h1 className="font-cinzel text-4xl text-antique-gold mb-2">IGNITE</h1>
          <p className="font-cormorant text-lg text-gray-300">Embrace the darkness...</p>
        </div>
      </div>
    </div>
  );
};

export default Preloader;
