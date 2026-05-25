import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Chanda Mwale",
    role: "Teacher, Lusaka",
    initials: "CM",
    color: "bg-orange-500",
    rating: 5,
    text: "WePay helped me pay my children's school fees when I needed it most. The process was so simple  I applied on Monday and had the money by Tuesday morning!",
  },
  
];

export function Testimonials() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="text-sm font-semibold text-purple-500 uppercase tracking-wider">
            Customer Stories
          </span>
          <h2 className="mt-2 text-4xl font-black text-[#1a1f36]">
            Trusted by thousands of Zambians
          </h2>
          <p className="mt-4 text-gray-600 max-w-xl mx-auto">
            Real stories from real people who have transformed their financial lives with WePay.
          </p>

          {/* Overall rating */}
          <div className="mt-6 inline-flex items-center space-x-2 bg-yellow-50 rounded-full px-5 py-2 border border-yellow-200">
            <div className="flex">
              {[0, 0, 0, 0, 0].map((i) => (
                <Star key={i} size={16} className="text-yellow-500 fill-yellow-500" />
              ))}
            </div>
            <span className="font-bold text-[#1a1f36]">0.0</span>
            <span className="text-gray-500 text-sm">from 0,000+ reviews</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 relative"
            >
              <Quote size={32} className="text-gray-100 absolute top-4 right-4" /> 

              {/* Stars */}
              <div className="flex mb-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} size={14} className="text-yellow-500 fill-yellow-500" />
                ))}
              </div>

              {/* Text */}
              <p className="text-gray-600 text-sm leading-relaxed mb-6 relative z-10">
                &ldquo;{t.text}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 ${t.color} rounded-full flex items-center justify-center flex-shrink-0`}>
                  <span className="text-white text-sm font-bold">{t.initials}</span>
                </div>
                <div>
                  <p className="font-semibold text-[#1a1f36] text-sm">{t.name}</p>
                  <p className="text-gray-500 text-xs">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
