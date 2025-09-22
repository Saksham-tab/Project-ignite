import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const OurFlame: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 80%',
        end: 'bottom 20%',
        toggleActions: 'play none none reverse'
      }
    });

    tl.fromTo(titleRef.current,
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }
    )
    .fromTo(Array.from(contentRef.current?.children || []),
  { opacity: 0, y: 30 },
  { opacity: 1, y: 0, duration: 0.8, stagger: 0.2, ease: 'power2.out' }
)


    return () => {
      tl.kill();
    };
  }, []);

  return (
    <section id="our-flame" ref={sectionRef} className="py-20 bg-gradient-to-b from-deep-black to-ash-gray/20">
      <div className="container mx-auto px-6">
        <h2 
          ref={titleRef}
          className="font-cinzel text-4xl md:text-5xl text-center text-antique-gold mb-16"
        >
          Our Flame
        </h2>
        
        <div ref={contentRef} className="max-w-4xl mx-auto text-center space-y-8">
          <p className="font-cormorant text-xl md:text-2xl text-gray-300 leading-relaxed">
            In the depths of darkness, we found our light. Not the blinding glare of false prophets, 
            but the steady, eternal flame that burns within the chosen few.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            {[
              { icon: '🔥', title: 'Ignite', text: 'Awaken the dormant power that lies within your soul' },
              { icon: '⚡', title: 'Transform', text: 'Shed the chains of conformity and embrace your true nature' },
              { icon: '⭐', title: 'Ascend', text: 'Rise above the mundane and join the eternal circle' }
            ].map((item, index) => (
              <div key={index} className="group">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center group-hover:animate-glow transition-all duration-300 
                  backdrop-blur-xl bg-white/10 border border-ritual-red/30 shadow-inner shadow-ritual-red/30">
                  <span className="text-2xl">{item.icon}</span>
                </div>
                <h3 className="font-cinzel text-xl text-antique-gold mb-2">{item.title}</h3>
                <p className="font-cormorant text-gray-400">{item.text}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-16 p-8 bg-ash-gray/30 rounded-lg border border-ritual-red/20">
            <blockquote className="font-cormorant text-lg italic text-gray-300">
              "We are not a brand. We are a calling. We are not selling products. 
              We are offering transformation. Join us, and discover what lies beyond the veil."
            </blockquote>
            <cite className="block mt-4 text-antique-gold font-cinzel">— The Circle</cite>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OurFlame;
