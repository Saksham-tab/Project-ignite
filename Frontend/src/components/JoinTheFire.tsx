import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAuth } from '../context/AuthContext'; // ✅ import useAuth

gsap.registerPlugin(ScrollTrigger);

const JoinTheFire: React.FC = () => {
  const { user } = useAuth(); // ✅ Get user if logged in
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    gsap.fromTo(
      sectionRef.current,
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        duration: 1.5,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
          toggleActions: 'play none none reverse',
        },
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    gsap.to(formRef.current, {
      scale: 0.95,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        setIsSubmitted(true);

        gsap.to('.success-message', {
          opacity: 1,
          scale: 1,
          duration: 0.5,
          ease: 'back.out(1.7)',
        });
      },
    });

    localStorage.setItem('ignite_subscriber', email);
  };

  return (
    <section ref={sectionRef} className="py-20 bg-gradient-to-b from-ash-gray/20 to-deep-black">
      <div className="container mx-auto px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-cinzel text-4xl md:text-5xl text-antique-gold mb-6">
            Join The Fire
          </h2>
          <p className="font-cormorant text-xl text-gray-300 mb-8 leading-relaxed">
            Be the first to know when new artifacts are revealed. 
            Receive exclusive invitations to Circle gatherings and sacred knowledge.
          </p>

          {/* ✅ If logged in, show welcome message instead of form */}
          {user ? (
            <div className="p-8 bg-gradient-to-r from-ritual-red/20 to-antique-gold/20 rounded-lg border border-ritual-red/30">
              <h3 className="font-cinzel text-2xl text-antique-gold mb-2">
                Welcome back, {user.firstName}!
              </h3>
              <p className="font-cormorant text-lg text-gray-300">
                You are already part of the Circle. Let the fire guide you deeper.
              </p>
            </div>
          ) : !isSubmitted ? (
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email to join the Circle..."
                  className="w-full px-6 py-4 bg-ash-gray/50 border-2 border-ritual-red/30 rounded-lg text-white placeholder-gray-400 font-cormorant text-lg focus:outline-none focus:border-ritual-red transition-all duration-300"
                  required
                />
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-ritual-red/20 to-antique-gold/20 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>

              <button
                type="submit"
                className="group relative w-full px-8 py-4 bg-ritual-red text-white font-cormorant text-lg hover:bg-blood-red transition-all duration-500 overflow-hidden rounded-lg"
              >
                <span className="relative z-10 flex items-center justify-center">
                  Ignite My Journey <span className="ml-2 text-xl">🔥</span>
                </span>
                <div className="absolute inset-0 bg-blood-red transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
              </button>
            </form>
          ) : (
            <div className="success-message opacity-0 scale-0">
              <div className="p-8 bg-gradient-to-r from-ritual-red/20 to-antique-gold/20 rounded-lg border border-ritual-red/30">
                <div className="text-4xl mb-4">🔥</div>
                <h3 className="font-cinzel text-2xl text-antique-gold mb-2">
                  Welcome to The Circle
                </h3>
                <p className="font-cormorant text-lg text-gray-300">
                  Your journey into the darkness begins now. 
                  Check your email for your first sacred message.
                </p>
              </div>
            </div>
          )}

          <div className="mt-12 grid grid-cols-3 gap-8 opacity-60">
            <div className="text-center">
              <div className="text-3xl mb-2">⚡</div>
              <p className="font-cormorant text-sm text-gray-400">Exclusive Access</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🌙</div>
              <p className="font-cormorant text-sm text-gray-400">Sacred Knowledge</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">👁️</div>
              <p className="font-cormorant text-sm text-gray-400">Inner Circle</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default JoinTheFire;
