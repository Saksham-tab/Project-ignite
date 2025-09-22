import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const FloatingParticles: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Create floating particles
    const particleCount = 20;
    const particles: HTMLDivElement[] = [];

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'absolute w-1 h-1 bg-ritual-red rounded-full opacity-30';
      
      // Random starting position
      particle.style.left = Math.random() * 100 + '%';
      particle.style.top = Math.random() * 100 + '%';
      
      container.appendChild(particle);
      particles.push(particle);

      // Animate each particle
      gsap.to(particle, {
        x: (Math.random() - 0.5) * 200,
        y: (Math.random() - 0.5) * 200,
        opacity: Math.random() * 0.5 + 0.1,
        duration: Math.random() * 10 + 5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: Math.random() * 2
      });

      // Occasional glow effect
      if (Math.random() < 0.3) {
        gsap.to(particle, {
          boxShadow: '0 0 10px #fe0101, 0 0 20px #fe0101',
          duration: 2,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: Math.random() * 5
        });
      }
    }

    return () => {
      particles.forEach(particle => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      });
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
    />
  );
};

export default FloatingParticles;