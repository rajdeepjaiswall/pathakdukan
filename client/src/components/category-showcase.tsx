import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import type { Category } from "@shared/schema";

export default function CategoryShowcase() {
  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const foodCategories = [
    {
      id: 1,
      name: "Biscuits",
      image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      link: "/products?category=1"
    },
    {
      id: 2,
      name: "Snacks",
      image: "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      link: "/products?category=2"
    },
    {
      id: 3,
      name: "Cookies",
      image: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      link: "/products?category=3"
    },
    {
      id: 4,
      name: "Pastries",
      image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      link: "/products?category=4"
    },
    {
      id: 5,
      name: "Cake",
      image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      link: "/products?category=5"
    },
    {
      id: 6,
      name: "Rolls",
      image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      link: "/products?category=6"
    }
  ];

  // Create multiple copies for seamless infinite scroll
  const infiniteCategories = [
    ...foodCategories,
    ...foodCategories,
    ...foodCategories,
    ...foodCategories
  ];

  if (isLoading) {
    return (
      <div className="py-6 px-4">
        <div className="max-w-full mx-auto">
          <h2 className="text-xl md:text-2xl font-bold text-navy text-center mb-5">
            Our Specialties
          </h2>
          <div className="flex space-x-4 animate-pulse overflow-hidden">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="flex-shrink-0">
                <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-14 mx-auto"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 px-4 bg-gradient-to-b from-white to-almond/20 overflow-hidden">
      <div className="max-w-full mx-auto">
        <h2 className="text-xl md:text-2xl font-bold text-navy text-center mb-5">
          Our Specialties
        </h2>

        {/* Infinite Scrolling Carousel */}
        <div className="relative">
          <div className="overflow-hidden">
            <div className="flex space-x-5 lg:space-x-6 animate-scroll">
              {infiniteCategories.map((category, index) => (
                <Link key={`${category.id}-${index}`} href={category.link}>
                  <div className="flex-shrink-0 text-center group cursor-pointer">
                    {/* Smaller circle with brown border */}
                    <div className="relative w-16 h-16 lg:w-18 lg:h-18 mx-auto mb-2 overflow-hidden rounded-full bg-white shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-110 border-2 border-[#6B3E2E]/25 group-hover:border-[#6B3E2E]/60">
                      <img
                        src={category.image}
                        alt={category.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <h3 className="text-xs font-semibold text-navy group-hover:text-[#6B3E2E] transition-colors duration-300 whitespace-nowrap">
                      {category.name}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
