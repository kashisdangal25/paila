import { useState, useEffect } from 'react';
import { Search, MapPin, Star, Users, Navigation, Shield, Calendar, BookOpen, ChevronRight, Mountain, Quote, Heart, Play } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LandingPageProps {
  openAuthModal: (mode: 'login' | 'register') => void;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

// Nepal travel images from Pexels (royalty-free, reliable CDN)
const heroImages = [
  'https://images.pexels.com/photos/4194617/pexels-photo-4194617.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'https://images.pexels.com/photos/1271619/pexels-photo-1271619.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'https://images.pexels.com/photos/3593922/pexels-photo-3593922.jpeg?auto=compress&cs=tinysrgb&w=1600',
];

const featuredDestinations = [
  {
    name: 'Annapurna Base Camp',
    tag: 'Trekking',
    image: 'https://images.pexels.com/photos/4194617/pexels-photo-4194617.jpeg?auto=compress&cs=tinysrgb&w=800',
    rating: 4.9,
    reviews: 3400,
    difficulty: 'Moderate',
    days: 7,
  },
  {
    name: 'Phulchoki Hike',
    tag: 'Day Hike',
    image: 'https://images.pexels.com/photos/1271619/pexels-photo-1271619.jpeg?auto=compress&cs=tinysrgb&w=800',
    rating: 4.6,
    reviews: 321,
    difficulty: 'Easy',
    days: 1,
  },
  {
    name: 'Rara Lake',
    tag: 'Hidden Gem',
    image: 'https://images.pexels.com/photos/3593922/pexels-photo-3593922.jpeg?auto=compress&cs=tinysrgb&w=800',
    rating: 4.9,
    reviews: 210,
    difficulty: 'Moderate',
    days: 5,
  },
];

const quotes = [
  { text: "The mountains are calling and I must go.", author: "John Muir" },
  { text: "In every walk with nature, one receives far more than he seeks.", author: "John Muir" },
  { text: "Not all those who wander are lost.", author: "J.R.R. Tolkien" },
  { text: "The best view comes after the hardest climb.", author: "Unknown" },
];

export default function LandingPage({ openAuthModal, showToast }: LandingPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentQuote, setCurrentQuote] = useState(0);
  const [currentHero, setCurrentHero] = useState(0);

  // Rotate quotes
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % quotes.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Rotate hero images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHero((prev) => (prev + 1) % heroImages.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <a href="#" className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-forest-600 rounded-xl flex items-center justify-center shadow-sm">
                <Mountain className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-display text-xl font-bold text-forest-700">Paila</span>
            </a>

            {/* Nav Links - Desktop */}
            <div className="hidden md:flex items-center gap-1">
              {['Features', 'Destinations', 'Safety', 'Guides'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-stone-600 hover:text-forest-700 hover:bg-forest-50 transition-all"
                >
                  {item}
                </a>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => openAuthModal('login')}
                className="btn-ghost text-sm hidden sm:block"
              >
                Sign in
              </button>
              <button
                onClick={() => openAuthModal('register')}
                className="btn-primary"
              >
                Start exploring
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Cinematic */}
      <section className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          {heroImages.map((img, idx) => (
            <div
              key={img}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                idx === currentHero ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img
                src={img}
                alt="Nepal mountains"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-forest-900/40 via-forest-900/30 to-stone-900" />
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center pt-16">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white text-xs font-bold tracking-wider uppercase mb-6 animate-fade-in">
            <Star className="w-3.5 h-3.5 text-star fill-star" />
            Nepal's #1 Travel Companion
          </div>

          {/* Main Headline */}
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6 animate-fade-in animate-delay-100">
            Namaste, traveler.
            <br />
            <span className="text-forest-300">Walk with confidence.</span>
          </h1>

          <p className="text-lg sm:text-xl text-white/80 mb-8 max-w-2xl mx-auto animate-fade-in animate-delay-200">
            Discover hidden gems, plan perfect trips, navigate safely, and connect
            with trusted local guides — all in one place.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto animate-fade-in animate-delay-300">
            <div className="flex items-center bg-white rounded-2xl shadow-xl p-2 gap-2">
              <div className="flex-1 flex items-center gap-3 px-4">
                <Search className="w-5 h-5 text-stone-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search places, trails, guides..."
                  className="flex-1 py-3 text-stone-800 placeholder:text-stone-400 focus:outline-none"
                />
              </div>
              <button
                onClick={() => openAuthModal('register')}
                className="btn-primary px-6 py-3 whitespace-nowrap"
              >
                Start exploring
              </button>
            </div>
          </div>

          {/* Quick Chips */}
          <div className="flex flex-wrap justify-center gap-2 mt-6 animate-fade-in animate-delay-400">
            {['Hiking', 'Trekking', 'Cultural', 'Lakes', 'Wildlife'].map((chip) => (
              <button
                key={chip}
                className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-medium hover:bg-white/20 transition-all"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <span className="text-white/60 text-sm">Scroll to explore</span>
          <ChevronRight className="w-5 h-5 text-white/40 rotate-90" />
        </div>
      </section>

      {/* Quote Banner */}
      <section className="bg-forest-700 py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <Quote className="w-8 h-8 text-star mx-auto mb-4" />
          <p className="font-display text-xl sm:text-2xl font-semibold text-white mb-2 transition-opacity duration-500">
            "{quotes[currentQuote].text}"
          </p>
          <p className="text-forest-300 text-sm italic">
            — {quotes[currentQuote].author}
          </p>
          {/* Dots */}
          <div className="flex justify-center gap-2 mt-4">
            {quotes.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentQuote(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentQuote
                    ? 'w-6 bg-star rounded'
                    : 'bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Destinations */}
      <section id="destinations" className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="eyebrow">Destinations</div>
            <h2 className="section-title">From peaks to plains</h2>
            <p className="section-subtitle mx-auto">
              Famous landmarks and hidden treasures, all mapped and ready to explore.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {featuredDestinations.map((dest) => (
              <div
                key={dest.name}
                className="group relative h-80 rounded-2xl overflow-hidden cursor-pointer"
              >
                <img
                  src={dest.image}
                  alt={dest.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-forest-900/90 via-forest-900/40 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="tag mb-2">{dest.tag}</div>
                  <h3 className="font-display text-xl font-bold text-white mb-1">
                    {dest.name}
                  </h3>
                  <div className="flex items-center gap-4 text-white/70 text-sm">
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-star fill-star" />
                      {dest.rating}
                    </span>
                    <span>{dest.difficulty}</span>
                    <span>{dest.days} Days</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 bg-stone-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="eyebrow">Main features</div>
            <h2 className="section-title">Everything you need</h2>
            <p className="section-subtitle mx-auto">
              One connected ecosystem covering every stage of your journey.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <MapPin className="w-6 h-6" />,
                title: 'Map & Navigation',
                desc: 'Interactive Nepal map with tourist spots, trekking routes, GPS tracking, and offline maps for remote areas.',
              },
              {
                icon: <Calendar className="w-6 h-6" />,
                title: 'AI Trip Planner',
                desc: 'Tell us your destination, budget, and interests. Get a complete day-by-day itinerary in seconds.',
              },
              {
                icon: <Shield className="w-6 h-6" />,
                title: 'Safety First',
                desc: 'SOS button, check-in timer, live location sharing, weather alerts, and emergency contacts.',
              },
              {
                icon: <Users className="w-6 h-6" />,
                title: 'Community',
                desc: 'Real travelers sharing photos, route updates, trail conditions, and honest reviews.',
              },
              {
                icon: <BookOpen className="w-6 h-6" />,
                title: 'Journey Log',
                desc: 'Track every trip with photos, notes, expenses, and memories. Your personal adventure diary.',
              },
              {
                icon: <Navigation className="w-6 h-6" />,
                title: 'Local Services',
                desc: 'Book verified guides, homestays, and transport. Connect directly to Nepal\'s local economy.',
              },
            ].map((feature) => (
              <div key={feature.title} className="card card-hover p-6">
                <div className="w-12 h-12 rounded-xl bg-forest-50 text-forest-600 flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="font-display text-lg font-bold text-forest-700 mb-2">
                  {feature.title}
                </h3>
                <p className="text-stone-600 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hidden Gems Section */}
      <section className="py-20 px-4 bg-forest-700">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="eyebrow text-forest-300" style={{ letterSpacing: '0.15em' }}>
              Hidden Gems
            </div>
            <h2 className="font-display text-display-lg text-white mb-4">
              Underrated treasures
            </h2>
            <p className="text-forest-300 text-lg max-w-xl mx-auto">
              Beyond the famous trails — places locals love and few travelers ever find.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="relative h-96 rounded-2xl overflow-hidden group">
              <img
                src="https://images.unsplash.com/photo-1606298855672-3efb63017be8?w=800&q=80"
                alt="Rara Lake"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-forest-900/90 via-forest-900/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="tag bg-star text-forest-800">Pilot Pick</span>
                  <span className="px-2 py-0.5 rounded bg-forest-600 text-white text-xs font-bold">
                    9.4 Nature Score
                  </span>
                </div>
                <h3 className="font-display text-2xl font-bold text-white mb-1">
                  Rara Lake
                </h3>
                <p className="text-white/70 text-sm">
                  Nepal's largest lake — turquoise basin ringed by pine forest.
                </p>
              </div>
            </div>

            <div className="grid gap-6">
              {[
                {
                  name: 'Khopra Ridge',
                  tag: 'Guide Favorite',
                  image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80',
                },
                {
                  name: 'Shey Phoksundo',
                  tag: 'Hidden',
                  image: 'https://images.unsplash.com/photo-1545153996-9097ab2c9d2c?w=800&q=80',
                },
              ].map((gem) => (
                <div
                  key={gem.name}
                  className="relative h-44 rounded-2xl overflow-hidden group"
                >
                  <img
                    src={gem.image}
                    alt={gem.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-forest-900/90 via-forest-900/50 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <span className="tag text-xs">{gem.tag}</span>
                    <h3 className="font-display text-lg font-bold text-white mt-1">
                      {gem.name}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-forest-800 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            {[
              { num: '50K+', label: 'Active travelers' },
              { num: '800+', label: 'Trails & destinations' },
              { num: '120+', label: 'Local guides' },
              { num: '77', label: 'Districts covered' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-display text-3xl md:text-4xl font-bold text-white">
                  {stat.num}
                </div>
                <div className="text-forest-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Safety Section */}
      <section id="safety" className="py-20 px-4 bg-stone-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Phone Mockup */}
            <div className="relative mx-auto">
              <div className="phone-frame w-72 mx-auto">
                <div className="phone-notch" />
                <div className="phone-screen h-[520px] relative">
                  {/* Status Bar */}
                  <div className="bg-forest-700 px-4 py-3 flex justify-between items-center text-white text-xs">
                    <span>9:41</span>
                    <div className="flex gap-1">
                      <div className="w-4 h-4 rounded-full bg-white/20" />
                    </div>
                  </div>

                  {/* SOS Card */}
                  <div className="p-4">
                    <div className="bg-danger rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <div className="text-white font-bold text-lg tracking-wider">SOS</div>
                        <div className="text-white/80 text-xs">Emergency help</div>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                        <Shield className="w-5 h-5 text-danger" />
                      </div>
                    </div>
                  </div>

                  {/* Safety Features List */}
                  <div className="px-4 space-y-3">
                    {[
                      { icon: '📍', label: 'Share live location' },
                      { icon: '⛅', label: 'Weather alerts' },
                      { icon: '🥾', label: 'Trail safety tips' },
                      { icon: '📞', label: 'Emergency contacts' },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between p-3 bg-white rounded-xl border border-stone-200"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{item.icon}</span>
                          <span className="text-stone-800 text-sm font-medium">
                            {item.label}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-stone-400" />
                      </div>
                    ))}
                  </div>

                  {/* Badge */}
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="bg-forest-50 text-forest-700 text-center py-2 rounded-lg text-sm font-semibold">
                      Your safety is our priority ✓
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div>
              <div className="eyebrow">Safety first</div>
              <h2 className="section-title">Travel Nepal with total peace of mind</h2>
              <div className="space-y-4">
                {[
                  {
                    title: 'SOS emergency help',
                    desc: 'One tap sends your location to emergency contacts and local authorities.',
                  },
                  {
                    title: 'Weather & trail alerts',
                    desc: 'Real-time updates so you\'re never caught off guard by sudden mountain weather.',
                  },
                  {
                    title: 'Check-in timer',
                    desc: 'If you don\'t check in on time, Paila automatically alerts your contacts.',
                  },
                  {
                    title: 'Altitude tracker',
                    desc: 'Monitor your altitude in real time with AMS symptom warnings.',
                  },
                ].map((item) => (
                  <div key={item.title} className="flex gap-3">
                    <div className="w-10 h-10 rounded-xl bg-forest-50 flex items-center justify-center text-forest-600 flex-shrink-0">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-forest-700 mb-1">{item.title}</h3>
                      <p className="text-stone-600 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Guides Section */}
      <section id="guides" className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="eyebrow">Guides & Services</div>
            <h2 className="section-title">Trek with someone who knows every stone</h2>
            <p className="section-subtitle mx-auto">
              Paila connects you to licensed, verified local guides.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'Nima Sherpa',
                avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
                specialties: ['Everest', 'High Altitude', 'Mountaineering'],
                languages: 'English, Nepali, Tibetan',
                rating: 4.9,
                reviews: 182,
                price: 4500,
              },
              {
                name: 'Pemba Tamang',
                avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80',
                specialties: ['Annapurna Circuit', 'Cultural Tours'],
                languages: 'English, Nepali, Hindi, German',
                rating: 4.8,
                reviews: 134,
                price: 3800,
              },
              {
                name: 'Dorje Lama',
                avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80',
                specialties: ['Langtang Valley', 'Wildlife', 'Day Hikes'],
                languages: 'English, Nepali, French',
                rating: 4.9,
                reviews: 97,
                price: 3200,
              },
            ].map((guide) => (
              <div key={guide.name} className="card card-hover p-6 relative">
                {/* Available Indicator */}
                <div className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-success" />

                {/* Avatar & Name */}
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={guide.avatar}
                    alt={guide.name}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-display font-bold text-forest-700">
                      {guide.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 text-forest-500" />
                      <span className="text-xs text-forest-600 font-medium">
                        Licensed Guide
                      </span>
                    </div>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex text-star">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-star" />
                    ))}
                  </div>
                  <span className="text-sm text-stone-600">
                    {guide.rating} · {guide.reviews} reviews
                  </span>
                </div>

                {/* Specialties */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {guide.specialties.map((s) => (
                    <span key={s} className="tag-outline text-xs">
                      {s}
                    </span>
                  ))}
                </div>

                {/* Languages */}
                <p className="text-xs text-stone-500 mb-4">
                  <span className="font-medium text-stone-600">Languages:</span> {guide.languages}
                </p>

                {/* Price & CTA */}
                <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                  <div>
                    <span className="font-display font-bold text-forest-700 text-lg">
                      NPR {guide.price.toLocaleString()}
                    </span>
                    <span className="text-stone-400 text-sm">/day</span>
                  </div>
                  <button
                    onClick={() => openAuthModal('register')}
                    className="btn-primary text-sm"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-forest-700">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-display-lg text-white mb-4">
            Nepal is waiting.
            <br />
            Download Paila first.
          </h2>
          <p className="text-forest-300 text-lg mb-8 max-w-xl mx-auto">
            Join thousands of travelers exploring Nepal with confidence — from Kathmandu
            to Everest Base Camp and every hidden trail in between.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => openAuthModal('register')}
              className="px-8 py-4 bg-white text-forest-700 rounded-xl font-bold hover:bg-forest-50 transition-colors"
            >
              Start exploring
            </button>
            <button className="px-8 py-4 bg-transparent border-2 border-white/30 text-white rounded-xl font-medium hover:bg-white/10 transition-colors">
              List your business
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-forest-900 pt-16 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 bg-forest-600 rounded-lg flex items-center justify-center">
                  <Mountain className="w-4 h-4 text-white" />
                </div>
                <span className="font-display text-lg font-bold text-white">Paila</span>
              </div>
              <p className="text-forest-400 text-xs tracking-widest uppercase mb-3">
                Walk with confidence.
              </p>
              <p className="text-forest-500 text-sm leading-relaxed">
                Nepal's digital gateway for travelers — helping people discover, plan, navigate, and explore.
              </p>
            </div>

            {/* Explore */}
            <div>
              <h4 className="text-xs font-bold tracking-widest uppercase text-forest-400 mb-4">
                Explore
              </h4>
              <div className="space-y-2">
                {['Discovery map', 'Destinations', 'Hidden gems', 'Categories'].map((item) => (
                  <a key={item} href="#" className="block text-forest-300 text-sm hover:text-white transition-colors">
                    {item}
                  </a>
                ))}
              </div>
            </div>

            {/* Plan */}
            <div>
              <h4 className="text-xs font-bold tracking-widest uppercase text-forest-400 mb-4">
                Plan
              </h4>
              <div className="space-y-2">
                {['AI trip planner', 'Budget tool', 'Offline maps', 'Best seasons'].map((item) => (
                  <a key={item} href="#" className="block text-forest-300 text-sm hover:text-white transition-colors">
                    {item}
                  </a>
                ))}
              </div>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-xs font-bold tracking-widest uppercase text-forest-400 mb-4">
                Company
              </h4>
              <div className="space-y-2">
                {['About Paila', 'Our vision', 'For businesses', 'Safety', 'Contact'].map((item) => (
                  <a key={item} href="#" className="block text-forest-300 text-sm hover:text-white transition-colors">
                    {item}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="pt-8 border-t border-forest-800 flex flex-wrap justify-between items-center gap-4">
            <p className="text-forest-600 text-sm">
              © 2026 Paila — Walk with confidence
            </p>
            <div className="flex gap-4">
              {['Privacy', 'Terms', 'Cookies'].map((item) => (
                <a key={item} href="#" className="text-forest-600 text-sm hover:text-forest-500 transition-colors">
                  {item}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
