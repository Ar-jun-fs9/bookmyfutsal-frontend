export default function WhyChooseUs() {
  return (
    <section id="about" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold bg-linear-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-4">
            Why Choose Us?
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Experience the difference with our premium futsal facilities and exceptional service.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              icon: "⚽",
              title: "Premium Courts",
              description: "State-of-the-art futsal courts with professional-grade flooring and lighting for the best playing experience."
            },
            {
              icon: "🏆",
              title: "Top Ratings",
              description: "Consistently rated 4.5+ stars by our players. Quality venues with excellent facilities and service."
            },
            {
              icon: "📱",
              title: "Easy Booking",
              description: "Book instantly through our user-friendly platform. Real-time availability and instant confirmation."
            },
            {
              icon: "💪",
              title: "Expert Support",
              description: "Dedicated support team available to help with bookings, venue information, and any questions."
            }
          ].map((feature, index) => (
            <div
              key={index}
              className="text-center p-6 rounded-2xl bg-linear-to-br from-green-50 to-blue-50 hover:from-green-100 hover:to-blue-100 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div className="text-6xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}