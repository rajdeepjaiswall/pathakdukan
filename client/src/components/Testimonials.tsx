import { useState, useEffect, useRef } from 'react';
import { Star, Quote, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

const STATIC_TESTIMONIALS = [
  {
    id: 1,
    user_name: 'Priya Sharma',
    product_name: 'Pineapple Cream Cake',
    rating: 5,
    review_text: 'The pineapple cake from Pathak Bhandar is absolutely divine! We order for every family celebration. The freshness and quality is unmatched in the city.',
  },
  {
    id: 2,
    user_name: 'Rajesh Verma',
    product_name: 'Multigrain Bread Loaf',
    rating: 5,
    review_text: "Been their customer for 15 years. The bread is always fresh, and the delivery is prompt. Pathak Bhandar is our family's trusted bakery!",
  },
  {
    id: 3,
    user_name: 'Meena Gupta',
    product_name: 'Custom Birthday Cake',
    rating: 5,
    review_text: 'Ordered a custom birthday cake and they exceeded all expectations. The design was perfect and the taste was phenomenal. Highly recommend!',
  },
  {
    id: 4,
    user_name: 'Amit Tiwari',
    product_name: 'Butter Croissants',
    rating: 5,
    review_text: 'The croissants and pastries are so authentic — reminds me of my travels abroad! These folks really know their craft. Keep it up!',
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`}
        />
      ))}
    </div>
  );
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function TestimonialCard({ testimonial, visible }: { testimonial: any; visible: boolean }) {
  return (
    <div
      className={`transition-all duration-700 ease-in-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      } bg-white rounded-2xl p-5 shadow-sm border border-amber-100 hover:shadow-md`}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-amber-800 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {getInitials(testimonial.user_name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-semibold text-navy text-sm truncate">{testimonial.user_name}</p>
            <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" title="Verified Purchase" />
          </div>
          <p className="text-xs text-amber-700 font-medium truncate">{testimonial.product_name}</p>
        </div>
      </div>
      <StarRating rating={testimonial.rating} />
      <div className="mt-3 relative">
        <Quote className="h-5 w-5 text-amber-200 absolute -top-1 -left-1" />
        <p className="text-gray-600 text-sm leading-relaxed pl-4 italic line-clamp-4">
          {testimonial.review_text}
        </p>
      </div>
    </div>
  );
}

export default function Testimonials() {
  const { data: dynamicTestimonials = [] } = useQuery<any[]>({
    queryKey: ['/api/testimonials/homepage'],
    staleTime: 5 * 60 * 1000,
  });

  const testimonials = dynamicTestimonials.length >= 4 ? dynamicTestimonials : STATIC_TESTIMONIALS;
  const totalCount = dynamicTestimonials.length > 0 ? `${dynamicTestimonials.length}+` : '2,000+';

  const [visibleIndices, setVisibleIndices] = useState<number[]>([0, 1, 2, 3]);
  const [fade, setFade] = useState(true);
  const offsetRef = useRef(0);

  // Rotate cards every 4 seconds
  useEffect(() => {
    if (testimonials.length <= 4) return;
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        offsetRef.current = (offsetRef.current + 1) % testimonials.length;
        const next: number[] = [];
        for (let i = 0; i < 4; i++) {
          next.push((offsetRef.current + i) % testimonials.length);
        }
        setVisibleIndices(next);
        setFade(true);
      }, 350);
    }, 4000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  const displayed = visibleIndices.map(i => testimonials[i]).filter(Boolean);

  return (
    <section className="py-12 bg-gradient-to-b from-amber-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-navy mb-2">What Our Customers Say</h2>
          <p className="text-gray-500 text-sm md:text-base">Trusted by thousands of families in Prayagraj</p>
          <div className="flex justify-center items-center gap-2 mt-3">
            <div className="flex">
              {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} className="h-5 w-5 text-amber-400 fill-amber-400" />
              ))}
            </div>
            <span className="text-gray-600 text-sm font-medium">4.9 out of 5 · {totalCount} reviews</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {displayed.map((testimonial, idx) => (
            <TestimonialCard key={`${testimonial.id}-${idx}`} testimonial={testimonial} visible={fade} />
          ))}
        </div>

        {/* Dot indicators */}
        {testimonials.length > 4 && (
          <div className="flex justify-center gap-1.5 mt-6">
            {Array.from({ length: Math.min(testimonials.length, 8) }).map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  visibleIndices.includes(i)
                    ? 'w-5 h-2 bg-amber-600'
                    : 'w-2 h-2 bg-amber-200'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
