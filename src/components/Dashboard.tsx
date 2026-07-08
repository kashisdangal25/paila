import { useState, useEffect } from 'react';
import {
  Home,
  Search,
  MapPin,
  Compass,
  Mountain,
  Calendar,
  Shield,
  BookOpen,
  User,
  Star,
  Heart,
  Settings,
  LogOut,
  ChevronRight,
  Cloud,
  Bell,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';

interface DashboardProps {
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

type Tab = 'home' | 'explore' | 'gems' | 'planner' | 'safety' | 'journal' | 'profile';

export default function Dashboard({ showToast }: DashboardProps) {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [userName, setUserName] = useState('Traveler');
  const [greeting, setGreeting] = useState('Hello');

  useEffect(() => {
    // Set user name
    if (user?.email) {
      setUserName(user.email.split('@')[0]);
    }

    // Set time-based greeting
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    // Fetch user profile
    async function fetchProfile() {
      if (user?.id) {
        const { data } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', user.id)
          .maybeSingle();
        if (data?.name) {
          setUserName(data.name.split(' ')[0]);
        }
      }
    }
    fetchProfile();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    showToast('Signed out. See you on the trail!', 'info');
  };

  const handleSOS = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            await supabase.from('sos_alerts').insert({
              user_id: user?.id,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              message: 'SOS triggered from Paila dashboard',
            });
            showToast('SOS alert sent! Emergency contacts notified.', 'error');
          } catch {
            showToast('Could not send SOS. Please try again.', 'error');
          }
        },
        () => {
          showToast('Location permission denied. SOS needs your location.', 'error');
        }
      );
    }
  };

  return (
    <div className="flex h-screen bg-stone-50">
      {/* Sidebar */}
      <aside className="w-60 bg-forest-700 flex flex-col border-r border-forest-600">
        {/* Logo */}
        <div className="p-4 border-b border-forest-600">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-forest-500 rounded-lg flex items-center justify-center">
              <Mountain className="w-4 h-4 text-white" />
            </div>
            <span className="font-display text-lg font-bold text-white">Paila</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {[
            { id: 'home', icon: <Home className="w-4 h-4" />, label: 'Home' },
            { id: 'explore', icon: <Compass className="w-4 h-4" />, label: 'Explore' },
            { id: 'gems', icon: <Star className="w-4 h-4" />, label: 'Hidden Gems' },
            { id: 'planner', icon: <Calendar className="w-4 h-4" />, label: 'Trip Planner' },
            { id: 'safety', icon: <Shield className="w-4 h-4" />, label: 'Safety' },
            { id: 'journal', icon: <BookOpen className="w-4 h-4" />, label: 'My Journal' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as Tab)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === item.id
                  ? 'bg-white/10 text-white'
                  : 'text-forest-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        {/* SOS Button */}
        <div className="p-3">
          <button
            onClick={handleSOS}
            className="w-full bg-danger hover:bg-red-600 text-white rounded-lg py-3 flex items-center justify-center gap-2 font-bold text-sm transition-colors"
          >
            <Shield className="w-4 h-4" />
            SOS
          </button>
        </div>

        {/* Profile & Settings */}
        <div className="p-3 border-t border-forest-600 space-y-1">
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'profile'
                ? 'bg-white/10 text-white'
                : 'text-forest-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            Profile
          </button>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-forest-300 hover:bg-white/5 hover:text-white transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Home Tab */}
        {activeTab === 'home' && (
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-display font-bold text-forest-700">
                  {greeting}, {userName} 👋
                </h1>
                <p className="text-stone-500 text-sm">Where would you like to explore today?</p>
              </div>
              <Bell className="w-5 h-5 text-stone-400 hover:text-stone-600 cursor-pointer transition-colors" />
            </div>

            {/* Search */}
            <div className="relative mb-8">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <input
                type="text"
                placeholder="Search places, trails, guides..."
                className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-stone-200 rounded-xl focus:outline-none focus:border-forest-500 transition-colors"
              />
            </div>

            {/* Featured Destination */}
            <div className="relative h-48 rounded-2xl overflow-hidden mb-8">
              <img
                src="https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1200&q=80"
                alt="Featured destination"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-forest-900/90 via-forest-900/60 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <div className="tag bg-white/20 backdrop-blur-sm border border-white/30 text-white text-xs mb-2">
                  Featured Trek
                </div>
                <h2 className="text-white font-display text-2xl font-bold mb-1">
                  Annapurna Base Camp
                </h2>
                <div className="flex items-center gap-4 text-white/80 text-sm">
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-star fill-star" />
                    4.9
                  </span>
                  <span>7 Days</span>
                  <span>4,130m</span>
                  <span>Moderate</span>
                </div>
              </div>
              <button className="absolute bottom-6 right-6 bg-star hover:bg-yellow-400 text-forest-800 px-4 py-2 rounded-lg font-semibold text-sm transition-colors">
                Explore route →
              </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-xl p-4 border border-stone-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-forest-50 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-forest-600" />
                  </div>
                  <div className="text-2xl font-display font-bold text-forest-700">23</div>
                </div>
                <div className="text-stone-500 text-sm">Places visited</div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-stone-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Compass className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-2xl font-display font-bold text-forest-700">7</div>
                </div>
                <div className="text-stone-500 text-sm">Provinces explored</div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-stone-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                    <Star className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="text-2xl font-display font-bold text-forest-700">12</div>
                </div>
                <div className="text-stone-500 text-sm">Trips completed</div>
              </div>
            </div>

            {/* Recommended Destinations */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold text-forest-700">Recommended for you</h3>
                <button className="text-sm text-forest-600 hover:text-forest-700 flex items-center gap-1">
                  See all <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { name: 'Phulchoki Hike', tag: 'Easy · 1 Day', bg: 'from-forest-600 to-forest-400' },
                  { name: 'Pokhara', tag: 'Lakes · Weekend', bg: 'from-blue-600 to-blue-400' },
                  { name: 'Chitwan Safari', tag: 'Wildlife · 2 Days', bg: 'from-amber-600 to-amber-400' },
                ].map((dest) => (
                  <div
                    key={dest.name}
                    className={`relative h-28 rounded-xl overflow-hidden cursor-pointer group`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${dest.bg}`} />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <div className="text-white font-display font-bold">{dest.name}</div>
                      <div className="text-white/70 text-xs">{dest.tag}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Weather Widget */}
            <div className="bg-white rounded-xl p-5 border border-stone-200">
              <div className="flex items-center gap-2 mb-3">
                <Cloud className="w-5 h-5 text-blue-500" />
                <span className="text-stone-500 text-sm font-medium">Weather — Kathmandu</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-4xl font-display font-bold text-forest-700">22°C</div>
                  <div className="text-stone-500 text-sm">Partly cloudy · Good for hiking</div>
                </div>
                <div className="flex gap-4">
                  {[
                    { day: 'Thu', temp: '20°' },
                    { day: 'Fri', temp: '17°' },
                    { day: 'Sat', temp: '24°' },
                  ].map((d) => (
                    <div key={d.day} className="text-center">
                      <div className="text-stone-500 text-xs">{d.day}</div>
                      <div className="text-stone-700 font-semibold text-sm">{d.temp}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Explore Tab */}
        {activeTab === 'explore' && (
          <ExploreTab />
        )}

        {/* Hidden Gems Tab */}
        {activeTab === 'gems' && (
          <GemsTab />
        )}

        {/* Trip Planner Tab */}
        {activeTab === 'planner' && (
          <PlannerTab showToast={showToast} />
        )}

        {/* Safety Tab */}
        {activeTab === 'safety' && (
          <SafetyTab handleSOS={handleSOS} user={user} />
        )}

        {/* Journal Tab */}
        {activeTab === 'journal' && (
          <JournalTab />
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <ProfileTab user={user} userName={userName} />
        )}
      </main>
    </div>
  );
}

// Sub-components for each tab

function ExploreTab() {
  const [activeFilter, setActiveFilter] = useState('All');

  const destinations = [
    { name: 'Phulchoki Hike', tag: 'Easy · 1 Day · 2,783m', rating: 4.6, reviews: 321, distance: '16 km' },
    { name: 'Nagarkot Hike', tag: 'Easy · 1 Day · 2,195m', rating: 4.5, reviews: 96, distance: '19 km' },
    { name: 'Shivapuri Nat. Park', tag: 'Moderate · 2–3 Days', rating: 4.7, reviews: 210, distance: '23 km' },
    { name: 'Langtang Valley Trek', tag: 'Moderate · 7 Days', rating: 4.8, reviews: 320, distance: '98 km' },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-display font-bold text-forest-700 mb-2">Explore Nepal</h1>
      <p className="text-stone-500 text-sm mb-6">25+ trails and destinations found</p>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['All', 'Hiking', 'Trekking', 'Cultural', 'Lakes', 'Wildlife'].map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeFilter === filter
                ? 'bg-forest-600 text-white'
                : 'bg-white text-stone-600 border border-stone-200 hover:border-forest-300'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Destination List */}
      <div className="space-y-3">
        {destinations.map((dest) => (
          <div
            key={dest.name}
            className="flex items-center gap-4 p-4 bg-white rounded-xl border border-stone-200 hover:border-forest-200 transition-colors cursor-pointer"
          >
            <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-forest-500 to-forest-300 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-forest-700">{dest.name}</div>
              <div className="text-stone-500 text-sm">{dest.tag}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-star text-sm">★ {dest.rating}</span>
                <span className="text-stone-400 text-xs">({dest.reviews})</span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="font-semibold text-forest-600">{dest.distance}</div>
            </div>
            <ChevronRight className="w-5 h-5 text-stone-400" />
          </div>
        ))}
      </div>
    </div>
  );
}

function GemsTab() {
  const gems = [
    { name: 'Rara Lake', tag: 'Underrated', score: 9.4, pilot: true },
    { name: 'Khopra Ridge', tag: 'Hidden Gem', score: 9.1, guide: true },
    { name: 'Shey Phoksundo', tag: 'Underrated', score: 9.6 },
    { name: 'Pathivara Hills', tag: 'Off the path', score: 8.7, pilot: true },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-display font-bold text-forest-700 mb-2">Hidden Gems</h1>
      <p className="text-stone-500 text-sm mb-6">Places locals love and few travelers ever find</p>

      <div className="grid grid-cols-2 gap-4">
        {gems.map((gem) => (
          <div key={gem.name} className="bg-white rounded-xl overflow-hidden border border-stone-200 hover:shadow-lg transition-all cursor-pointer">
            <div className="h-28 bg-gradient-to-br from-forest-700 to-forest-500 relative">
              <div className="absolute top-3 left-3 flex gap-2">
                {gem.pilot && <span className="tag bg-white/90 text-forest-700 text-xs">Pilot Pick</span>}
                {gem.guide && <span className="tag bg-star text-forest-800 text-xs">Guide Fav</span>}
              </div>
              <div className="absolute top-3 right-3 bg-forest-600 text-white text-xs font-bold px-2 py-1 rounded">
                {gem.score}
              </div>
            </div>
            <div className="p-4">
              <div className="font-display font-bold text-forest-700">{gem.name}</div>
              <div className="text-stone-500 text-sm">{gem.tag}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlannerTab({ showToast }: { showToast: (message: string, type: 'success' | 'error' | 'info') => void }) {
  const [calculating, setCalculating] = useState(false);
  const [trip, setTrip] = useState({
    destination: 'Annapurna Base Camp',
    duration: '5 Days',
    budget: '10,000 – 20,000',
    travelers: '2 People',
    fitness: 'Moderate',
  });

  const handlePlan = () => {
    setCalculating(true);
    setTimeout(() => {
      setCalculating(false);
      showToast('Trip estimate ready! NPR 27,500 per person.', 'success');
    }, 1500);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-display font-bold text-forest-700 mb-2">AI Trip Planner</h1>
      <p className="text-stone-500 text-sm mb-6">Build your perfect Nepal itinerary</p>

      {/* Form */}
      <div className="bg-white rounded-xl p-6 border border-stone-200 mb-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Destination</label>
            <div className="input flex items-center justify-between">
              {trip.destination}
              <ChevronRight className="w-4 h-4 text-stone-400 rotate-90" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Duration</label>
            <div className="input flex items-center justify-between">
              {trip.duration}
              <ChevronRight className="w-4 h-4 text-stone-400 rotate-90" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Budget (NPR)</label>
            <div className="input flex items-center justify-between">
              {trip.budget}
              <ChevronRight className="w-4 h-4 text-stone-400 rotate-90" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Travelers</label>
            <div className="input flex items-center justify-between">
              {trip.travelers}
              <ChevronRight className="w-4 h-4 text-stone-400 rotate-90" />
            </div>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-stone-700 mb-2">Fitness level</label>
          <div className="input flex items-center justify-between">
            {trip.fitness}
            <ChevronRight className="w-4 h-4 text-stone-400 rotate-90" />
          </div>
        </div>

        <button
          onClick={handlePlan}
          disabled={calculating}
          className="w-full btn-primary py-3.5 text-base disabled:opacity-50"
        >
          {calculating ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Planning...
            </span>
          ) : (
            '✦ Plan my trip'
          )}
        </button>
      </div>

      {/* Budget Breakdown */}
      <div className="bg-forest-50 rounded-xl p-6 border border-forest-200">
        <div className="text-sm font-semibold text-forest-700 mb-4">Estimated budget breakdown</div>
        <div className="space-y-2">
          {[
            { label: 'Transport', amount: 'NPR 3,000' },
            { label: 'Permits', amount: 'NPR 2,000' },
            { label: 'Guide & Porter', amount: 'NPR 10,000' },
            { label: 'Food', amount: 'NPR 4,500' },
            { label: 'Accommodation', amount: 'NPR 6,000' },
            { label: 'Miscellaneous', amount: 'NPR 2,000' },
          ].map((item) => (
            <div key={item.label} className="flex justify-between text-sm">
              <span className="text-stone-600">{item.label}</span>
              <span className="font-medium text-forest-700">{item.amount}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between pt-4 mt-4 border-t border-forest-300">
          <span className="font-semibold text-forest-800">Estimated Total</span>
          <span className="font-display font-bold text-forest-700 text-lg">NPR 27,500</span>
        </div>
      </div>
    </div>
  );
}

function SafetyTab({ handleSOS, user }: { handleSOS: () => void; user: any }) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-display font-bold text-forest-700 mb-2">Safety Center</h1>
      <p className="text-stone-500 text-sm mb-6">Your emergency toolkit — always ready</p>

      {/* SOS Card */}
      <div
        onClick={handleSOS}
        className="bg-danger hover:bg-red-600 rounded-xl p-6 flex items-center justify-between mb-6 cursor-pointer transition-colors"
      >
        <div>
          <div className="text-white font-display text-2xl font-bold tracking-wider mb-1">SOS</div>
          <div className="text-white/80 text-sm">Tap to send emergency alert with your location</div>
        </div>
        <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
          <Shield className="w-8 h-8 text-danger" />
        </div>
      </div>

      {/* Safety Features */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { icon: '📍', title: 'Live location', desc: 'Share with family & friends' },
          { icon: '⛅', title: 'Weather alerts', desc: 'Heavy rain in Langtang region' },
          { icon: '🏔️', title: 'Altitude tracker', desc: 'Current: 1,400m · Safe' },
          { icon: '📞', title: 'Emergency numbers', desc: 'Police 100 · Rescue 1144' },
        ].map((item) => (
          <div key={item.title} className="bg-white rounded-xl p-4 border border-stone-200">
            <div className="text-2xl mb-2">{item.icon}</div>
            <div className="font-semibold text-forest-700 text-sm mb-1">{item.title}</div>
            <div className="text-stone-500 text-xs">{item.desc}</div>
          </div>
        ))}
      </div>

      {/* Safety Badge */}
      <div className="mt-6 bg-forest-50 border border-forest-200 rounded-xl p-4 text-center">
        <span className="text-forest-700 font-semibold text-sm">Your safety is our priority ✓</span>
      </div>
    </div>
  );
}

function JournalTab() {
  const trips = [
    { name: 'Annapurna Base Camp', dates: 'May 2–8, 2025', rating: 5 },
    { name: 'Langtang Valley Trek', dates: 'Apr 10–16, 2025', rating: 5 },
    { name: 'Phulchoki Hike', dates: 'Mar 20, 2025', rating: 5 },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-display font-bold text-forest-700 mb-2">My Journey Log</h1>
      <p className="text-stone-500 text-sm mb-6">23 trips · 12 provinces · 67 places</p>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { num: 23, label: 'Trips' },
          { num: 12, label: 'Provinces' },
          { num: 67, label: 'Places' },
          { num: 142, label: 'Photos' },
        ].map((stat) => (
          <div key={stat.label} className="bg-forest-50 rounded-xl p-4 text-center">
            <div className="font-display text-2xl font-bold text-forest-700">{stat.num}</div>
            <div className="text-stone-500 text-xs">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Trips */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-forest-700">Recent Trips</h3>
        <button className="text-sm text-forest-600 hover:text-forest-700 flex items-center gap-1">
          See all <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        {trips.map((trip) => (
          <div
            key={trip.name}
            className="flex items-center gap-4 p-4 bg-white rounded-xl border border-stone-200 hover:border-forest-200 transition-colors cursor-pointer"
          >
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-forest-600 to-forest-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-forest-700">{trip.name}</div>
              <div className="text-stone-500 text-sm">{trip.dates}</div>
            </div>
            <div className="text-star">{'★'.repeat(trip.rating)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileTab({ user, userName }: { user: any; userName: string }) {
  return (
    <div className="p-6">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-forest-700 to-forest-500 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 text-white flex items-center justify-center text-2xl font-display font-bold">
            {userName[0].toUpperCase()}
          </div>
          <div>
            <div className="text-white text-xl font-display font-bold">{userName}</div>
            <div className="text-forest-200 text-sm">Explorer Level 4 · Kathmandu, Nepal</div>
            <div className="flex gap-6 mt-2">
              <div className="text-center">
                <div className="text-white font-display font-bold text-lg">23</div>
                <div className="text-forest-200 text-xs">Trips</div>
              </div>
              <div className="text-center">
                <div className="text-white font-display font-bold text-lg">12</div>
                <div className="text-forest-200 text-xs">Provinces</div>
              </div>
              <div className="text-center">
                <div className="text-white font-display font-bold text-lg">67</div>
                <div className="text-forest-200 text-xs">Places</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="space-y-2">
        {[
          { icon: <Calendar className="w-4 h-4" />, label: 'My Bookings' },
          { icon: <BookOpen className="w-4 h-4" />, label: 'My Journey Log' },
          { icon: <Heart className="w-4 h-4" />, label: 'Wishlist' },
          { icon: <Star className="w-4 h-4" />, label: 'Achievements' },
          { icon: <Settings className="w-4 h-4" />, label: 'Settings' },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between p-4 bg-white rounded-xl border border-stone-200 hover:border-forest-200 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="text-forest-600">{item.icon}</div>
              <span className="text-stone-700">{item.label}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-stone-400" />
          </div>
        ))}
      </div>
    </div>
  );
}
