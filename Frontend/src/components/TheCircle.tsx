import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const TheCircle: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const events = [
    {
      date: 'The Beginning',
      title: 'GREED',
      description:
        'In the depths of winter, the first flame was kindled. A spark that would grow to illuminate the path for thousands.',
      symbol: '🔥',
    },
    {
      date: 'The Gathering',
      title: 'DELUSION',
      description:
        'Seven souls united under the blood moon. The Circle was born, and with it, a new understanding of power.',
      symbol: '⭕',
    },
    {
      date: 'The Awakening',
      title: 'LUST',
      description:
        'The message spread like wildfire. Across continents, the awakened began to recognize each other.',
      symbol: '⚡',
    },
    {
      date: 'The Present',
      title: 'EGO',
      description:
        'Now, the Circle calls to you. Will you answer? Will you join the ranks of the enlightened?',
      symbol: '👁️',
    },
    {
      date: 'The Future',
      title: 'PRIDE',
      description:
        'The flame continues to spread. With every new soul, the darkness transforms. The future belongs to the awakened.',
      symbol: '🔮',
    },
  ];

  useEffect(() => {
    const timeline = timelineRef.current;
    if (!timeline) return;

    const items = timeline.children;

    gsap.fromTo(
      items,
      { opacity: 0, x: -100 },
      {
        opacity: 1,
        x: 0,
        duration: 1,
        stagger: 0.3,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 60%',
          toggleActions: 'play none none reverse',
        },
      }
    );

    gsap.fromTo(
      '.timeline-line',
      { scaleY: 0 },
      {
        scaleY: 1,
        duration: 2,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 60%',
          toggleActions: 'play none none reverse',
        },
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <section
      id="circle"
      ref={sectionRef}
      className="py-20 bg-gradient-to-b from-deep-black to-ash-gray/20"
    >
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="font-cinzel text-4xl md:text-5xl text-antique-gold mb-4">
            The Circle
          </h2>
          <p className="font-cormorant text-xl text-gray-300 max-w-2xl mx-auto">
            Every great movement has its history. Every transformation has its moment. This is ours.
          </p>
        </div>

        <div className="relative max-w-4xl mx-auto">
          {/* Vertical Timeline Line */}
          <div className="timeline-line absolute left-8 top-0 w-0.5 h-full bg-ritual-red origin-top"></div>

          <div ref={timelineRef} className="space-y-12">
            {events.map((event, index) => (
              <div key={index} className="relative flex items-start">
                {/* Glassy Timeline Dot */}
                <div className="relative z-10 w-16 h-16 rounded-full flex items-center justify-center text-2xl border border-ritual-red/30 backdrop-blur-xl bg-white/10 shadow-inner shadow-ritual-red/30">
                  {event.symbol}
                </div>

                {/* Event Content */}
                <div className="ml-8 flex-1">
                  <div className="bg-ash-gray/30 rounded-lg p-6 border border-ritual-red/20 hover:border-ritual-red/50 transition-all duration-300">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-cinzel text-xl text-antique-gold">{event.title}</h3>
                      <span className="font-cormorant text-sm text-ritual-red">{event.date}</span>
                    </div>
                    <p className="font-cormorant text-gray-300 leading-relaxed">{event.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TheCircle;
