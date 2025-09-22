import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const Hero: React.FC = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const tl = gsap.timeline({ delay: 2 });
    return () => {
  tl.kill();

  // Remove blood moon if it exists
  const existingMoon = document.querySelector('.bg-ritual-red.rounded-full.blur-xl');
  if (existingMoon) {
    existingMoon.remove();
  }
};


    // Hero text animations
    tl.fromTo(titleRef.current,
      { opacity: 0, y: 50, scale: 0.9 },
      { opacity: 1, y: 0, scale: 1, duration: 1.5, ease: 'power3.out' }
    )
    .fromTo(subtitleRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1, ease: 'power2.out' },
      '-=0.8'
    )
    .fromTo(ctaRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' },
      '-=0.5'
    );

    // Parallax effect
    gsap.to(heroRef.current, {
      yPercent: -30,
      ease: 'none',
      scrollTrigger: {
        trigger: heroRef.current,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true
      }
    });

    // Blood moon effect (rare)
   

    // Lightning flicker effect (rare)
    const lightningChance = Math.random();
    if (lightningChance < 0.05) { // 5% chance
      const flicker = () => {
        gsap.to('.breathing-bg', {
          opacity: 0.1,
          duration: 0.05,
          yoyo: true,
          repeat: 3,
          onComplete: () => {
            gsap.set('.breathing-bg', { opacity: 1 });
          }
        });
      };
      
      setTimeout(flicker, Math.random() * 5000 + 2000);
    }

    return () => {
      tl.kill();
    };
  }, []);

  const scrollToFlame = () => {
    const flameSection = document.getElementById('our-flame');
    if (flameSection) {
      flameSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-deep-black via-deep-black to-blood-red/10">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 breathing-bg"></div>
      <div className="absolute inset-0 bg-gradient-radial from-ritual-red/8 via-transparent to-transparent"></div>
      
      {/* Animated Background Symbols */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 text-4xl md:text-6xl font-cinzel animate-float text-ritual-red"></div>
        <div className="absolute top-3/4 right-1/4 text-3xl md:text-4xl font-cinzel animate-float animate-delay-2s text-antique-gold"></div>
        <div className="absolute bottom-1/4 left-1/3 text-3xl md:text-5xl font-cinzel animate-float animate-delay-4s text-ritual-red"></div>
        <div className="absolute top-1/2 right-1/3 text-2xl md:text-3xl font-cinzel animate-float animate-delay-6s text-antique-gold"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 max-w-6xl">
        <h1 
          ref={titleRef}
          className="font-cinzel text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl text-antique-gold mb-4 sm:mb-6 leading-tight drop-shadow-2xl font-bold"
        >
          EMBRACE THE
          <br />
          <span className="text-ritual-red tracking-wider inline mt-2">DARKNESS</span>

        </h1>
        
        <div 
          ref={subtitleRef}
          className="font-cormorant text-lg sm:text-xl md:text-2xl text-gray-200 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed drop-shadow-lg space-y-2"
        >
          <p>Kindle the flame within. Join the circle of the enlightened.</p>
          <p className="text-antique-gold text-base sm:text-lg md:text-xl">Where shadows dance and spirits ignite.</p>
        </div>
        
        <button 
          ref={ctaRef}
          onClick={scrollToFlame}
          className="btn-ritual group relative px-6 sm:px-8 py-3 sm:py-4 bg-transparent border-2 border-ritual-red text-ritual-red font-cormorant text-base sm:text-lg hover:bg-ritual-red hover:text-white transition-all duration-500 overflow-hidden rounded-lg shadow-lg hover:shadow-ritual-red/50 font-semibold tracking-wide"
        >
          <span className="relative z-10">Begin Your Journey</span>
          <div className="absolute inset-0 bg-ritual-red transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div> 
        </button>
      </div>
      
    </section>
  );
};

export default Hero;