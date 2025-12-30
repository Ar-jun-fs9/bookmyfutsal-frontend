import { useTestimonials } from '@/hooks/useTestimonials';

export default function TestimonialSection() {
  const {
    visibleTestimonials,
    currentTestimonialIndex,
    subIndex,
    testimonialsPerPage,
    totalPages,
    goToNext,
    goToPrev,
    goToSlide,
  } = useTestimonials();

  return (
    <section className="py-16 bg-linear-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold bg-linear-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-4">
            What Our Players Say
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Hear from players who have experienced the thrill of futsal at our premium venues.
          </p>
        </div>

        {/* Testimonials Carousel */}
        <div className="relative">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {visibleTestimonials.map((testimonial, index) => (
              <div
                key={index}
                className={`bg-white rounded-2xl shadow-xl p-3 hover:shadow-2xl transform hover:scale-105 transition-all duration-500 border ${
                  index === subIndex && testimonialsPerPage > 1 ? 'border-green-500 ring-2 ring-green-200' : 'border-gray-100'
                }`}
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-linear-to-r from-green-400 to-blue-500 rounded-lg flex items-center justify-center text-2xl mr-4">
                    {testimonial.avatar}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600">{testimonial.venue}</p>
                  </div>
                  <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-lg">
                    {testimonial.tag}
                  </span>
                </div>
                <div className="flex items-center mb-3">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className={`w-5 h-5 ${i < testimonial.rating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-700 italic">"{testimonial.comment}"</p>
                <div className="mt-7 flex flex-wrap gap-1 justify-end">
                  {testimonial.sentimentTags.map((tag, tagIndex) => (
                    <span key={tagIndex} className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-lg">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Arrows */}
          <div className="flex justify-center items-center mt-6 space-x-3">
            <button
              onClick={goToPrev}
              className="bg-white border border-gray-200 text-gray-700 p-2 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Indicators */}
            <div className="flex space-x-1">
              {Array.from({ length: totalPages }, (_, index) => {
                const isActive = testimonialsPerPage === 1
                  ? Math.floor(currentTestimonialIndex / 3) === index
                  : currentTestimonialIndex === index;
                return (
                  <button
                    key={index}
                    onClick={() => goToSlide(testimonialsPerPage === 1 ? index * 3 : index)}
                    className={`w-2 h-2 rounded-lg transition-all duration-300 ${
                      isActive ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                );
              })}
            </div>

            <button
              onClick={goToNext}
              className="bg-white border border-gray-200 text-gray-700 p-2 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}