export default function HeroSection() {
  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Futsal Image Background */}
      <div className="absolute inset-0">
        <img
          src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/herobg.jpg`}
          alt="Futsal Court"
          className="w-full h-full object-cover"
        />
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/50"></div>
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-r from-green-900/30 via-transparent to-blue-900/30"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16 items-center">

        {/* LEFT CONTENT */}
        <div className="text-white space-y-8 ">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight">
            Feel the <span className="text-green-400">Intensity</span><br />
            of Indoor <span className="text-blue-400">Futsal</span>
          </h1>

          <p className="text-xl text-neutral-300 leading-relaxed">
            Indoor futsal is fast, fun, and full of energy. Play the game you love on quality courts made for speed and skill. Find nearby futsal courts and book your slot in just a few clicks. Enjoy a smooth, hassle-free booking experience every time.
          </p>

          <div className="text-lg font-medium text-neutral-200">
            Premium courts. Seamless booking. Elite experience 🔥⚽ Every time.
          </div>

          <div className="flex flex-row gap-2 mt-8">
            <button
              onClick={() => document.getElementById('venues')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-linear-to-r from-green-500 to-green-600 text-white font-bold py-2 px-4 sm:py-3 sm:px-8 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-sm sm:text-base"
            >
              Book Now
            </button>
            <button
              onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-linear-to-r from-blue-500 to-blue-600 text-white font-bold py-2 px-4 sm:py-3 sm:px-8 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-sm sm:text-base"
            >
              Learn More
            </button>
          </div>
        </div>

        {/* RIGHT CONTENT - New 3D / Glow Logo */}
        <div className="flex justify-center lg:justify-end  delay-300 relative">
          <div className="relative w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 flex items-center justify-center">
            <div className="absolute inset-0 rounded-lg bg-linear-to-br from-green-400/20 via-blue-500/20 to-purple-600/20 blur-3xl animate-pulse"></div>

            <img
              src="/logo/logo1.png"
              alt="BookMyFutsal Logo"
              className="relative z-10 w-full h-full object-contain drop-shadow-[0_0_25px_rgba(0,255,120,0.4)] animate-logo-float"
            />
          </div>
        </div>

      </div>

    </section>
  );
}