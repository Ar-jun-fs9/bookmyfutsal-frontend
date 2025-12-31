import { useState, useEffect } from 'react';

const testimonials = [
  {
    name: "Rajesh Thapa",
    avatar: "👤",
    rating: 5,
    comment: "Amazing venue! The court was top-notch and the booking was seamless. The staff was incredibly helpful and the facilities were spotless. Will definitely book again!",
    venue: "Premium Futsal Arena",
    tag: "Player",
    sentimentTags: ["Top-notch Court", "Seamless Booking"]
  },
  {
    name: "Priya Khadka",
    avatar: "👩",
    rating: 5,
    comment: "Perfect for our team practice sessions. The lighting and ventilation are excellent, and the ball quality is outstanding. Highly recommend for serious players!",
    venue: "Elite Sports Complex",
    tag: "Captain",
    sentimentTags: ["Perfect Practice", "Highly Recommended"]
  },
  {
    name: "Amit Shah",
    avatar: "👨",
    rating: 4,
    comment: "Great experience overall! The booking process was smooth, and the venue exceeded our expectations. Minor suggestion for parking, but otherwise perfect.",
    venue: "Champion's Field",
    tag: "Manager",
    sentimentTags: ["Great Experience", "Perfect Venue"]
  },
  {
    name: "Kavita Shrestha",
    avatar: "👩",
    rating: 5,
    comment: "Outstanding facilities for kids! Safe and fun environment with professional staff. My children absolutely loved it and can't wait to come back.",
    venue: "City Futsal Park",
    tag: "Parent",
    sentimentTags: ["Outstanding Facilities", "Family Friendly"]
  },
  {
    name: "Rohan Thapa",
    avatar: "👨‍🏫",
    rating: 5,
    comment: "Ideal training ground for my students. Excellent equipment and court conditions. The management is very cooperative and supportive.",
    venue: "Sports Academy",
    tag: "Coach",
    sentimentTags: ["Ideal Training", "Excellent Equipment"]
  },
  {
    name: "Meera Joshi",
    avatar: "👩‍💼",
    rating: 4,
    comment: "Booked for our office team building event. Everyone had a great time and the game was well organized. Some minor improvements could be made.",
    venue: "Corporate Sports Hub",
    tag: "Corporate",
    sentimentTags: ["Great Team Building", "Well Organized"]
  },
  {
    name: "Sanjay Bhujel",
    avatar: "👤",
    rating: 5,
    comment: "Perfect venue for our tournament! Everything was flawless from start to finish. The referees were excellent and the game was fair.",
    venue: "National Futsal Center",
    tag: "Player",
    sentimentTags: ["Perfect Tournament", "Fair Play"]
  },
  {
    name: "Anuradha Saud",
    avatar: "👩",
    rating: 5,
    comment: "Wonderful experience for our women's team. Very welcoming environment with all necessary facilities. Will definitely return!",
    venue: "Women's Sports Club",
    tag: "Player",
    sentimentTags: ["Wonderful Experience", "Will Return"]
  },
  {
    name: "Vikram Adhikari",
    avatar: "👨",
    rating: 4,
    comment: "Good management and everything ran on time. Some technical improvements could be made but overall very satisfactory experience.",
    venue: "Metro Futsal Hall",
    tag: "Manager",
    sentimentTags: ["Good Management", "Reliable Venue"]
  }
];

export function useTestimonials() {
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [testimonialsPerPage, setTestimonialsPerPage] = useState(3);

  // Responsive testimonials per page
  useEffect(() => {
    const updateTestimonialsPerPage = () => {
      const newPerPage = window.innerWidth < 768 ? 1 : 3;
      setTestimonialsPerPage(newPerPage);
      // Reset subIndex when changing perPage
      setSubIndex(0);
    };

    updateTestimonialsPerPage();
    window.addEventListener('resize', updateTestimonialsPerPage);

    return () => window.removeEventListener('resize', updateTestimonialsPerPage);
  }, []);

  const goToNext = () => {
    if (testimonialsPerPage === 1) {
      setCurrentTestimonialIndex(prev => prev < testimonials.length - 1 ? prev + 1 : 0);
    } else {
      setSubIndex(prevSub => {
        if (prevSub < testimonialsPerPage - 1) {
          return prevSub + 1;
        } else {
          setCurrentTestimonialIndex(prev => prev < Math.floor(testimonials.length / testimonialsPerPage) - 1 ? prev + 1 : 0);
          return 0;
        }
      });
    }
  };

  const goToPrev = () => {
    if (testimonialsPerPage === 1) {
      setCurrentTestimonialIndex(prev => prev > 0 ? prev - 1 : testimonials.length - 1);
    } else {
      setSubIndex(prevSub => {
        if (prevSub > 0) {
          return prevSub - 1;
        } else {
          setCurrentTestimonialIndex(prev => prev > 0 ? prev - 1 : Math.floor(testimonials.length / testimonialsPerPage) - 1);
          return testimonialsPerPage - 1;
        }
      });
    }
  };

  const goToSlide = (index: number) => {
    setCurrentTestimonialIndex(index);
    setSubIndex(0);
  };

  const visibleTestimonials = testimonials.slice(
    currentTestimonialIndex * testimonialsPerPage,
    (currentTestimonialIndex * testimonialsPerPage) + testimonialsPerPage
  );

  return {
    testimonials,
    visibleTestimonials,
    currentTestimonialIndex,
    subIndex,
    testimonialsPerPage,
    totalPages: Math.ceil(testimonials.length / 3),
    goToNext,
    goToPrev,
    goToSlide,
  };
}