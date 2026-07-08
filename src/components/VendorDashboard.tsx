import { useState } from 'react';
import {
  LayoutDashboard,
  List,
  Calendar,
  Star,
  User,
  LogOut,
  Plus,
  Mountain,
  Eye,
  Edit3,
  ChevronRight,
  TrendingUp,
  Users,
  DollarSign,
  MapPin,
  Search,
  Filter,
  MoreVertical,
  Check,
  X,
  Clock,
  MessageSquare,
  Lock,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

type VendorTab = 'dashboard' | 'listings' | 'bookings' | 'reviews' | 'profile';

interface Booking {
  id: string;
  customerName: string;
  dates: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
}

interface Review {
  id: string;
  customerName: string;
  rating: number;
  date: string;
  comment: string;
}

interface Listing {
  id: string;
  name: string;
  type: string;
  location: string;
  price: number;
  rating: number;
  reviewCount: number;
  status: 'active' | 'pending' | 'inactive';
  image: string;
}

// Mock data for demo
const MOCK_BOOKINGS: Booking[] = [
  { id: '1024', customerName: 'Suman Rai', dates: 'Jul 15-17', amount: 6000, status: 'confirmed' },
  { id: '1023', customerName: 'Tom Miller', dates: 'Jul 10-12', amount: 4500, status: 'completed' },
  { id: '1022', customerName: 'Priya Kumar', dates: 'Jul 8', amount: 2000, status: 'pending' },
  { id: '1021', customerName: 'Kenji Tanaka', dates: 'Jul 5-7', amount: 8500, status: 'completed' },
];

const MOCK_REVIEWS: Review[] = [
  { id: '1', customerName: 'Tom Miller', rating: 5, date: 'Jul 12, 2024', comment: 'Amazing experience! The guide was incredibly knowledgeable and the homestay was perfect.' },
  { id: '2', customerName: 'Emma Schmidt', rating: 4, date: 'Jul 8, 2024', comment: 'Great location and friendly host. Would recommend for anyone trekking in the area.' },
  { id: '3', customerName: 'Priya Kumar', rating: 5, date: 'Jun 25, 2024', comment: 'Everything was well organized. Felt very safe and well taken care of.' },
];

const MOCK_LISTINGS: Listing[] = [
  {
    id: '1',
    name: 'Mountain View Homestay',
    type: 'homestay',
    location: 'Nagarkot',
    price: 2500,
    rating: 4.9,
    reviewCount: 87,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&q=80'
  },
];

export default function VendorDashboard() {
  const { profile, vendor, signOut, userType } = useAuth();
  const [activeTab, setActiveTab] = useState<VendorTab>('dashboard');
  const [showAddListing, setShowAddListing] = useState(false);
  const [bookingFilter, setBookingFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');

  const businessName = vendor?.business_name || profile?.name || 'Vendor';
  const businessType = vendor?.business_type || 'guide';

  const stats = {
    totalBookings: 24,
    thisMonth: 36000,
    avgRating: 4.8,
    profileViews: 142,
    thisMonthGrowth: '+12%'
  };

  const filteredBookings = MOCK_BOOKINGS.filter(b =>
    bookingFilter === 'all' ? true : b.status === bookingFilter
  );

  const handleSignOut = async () => {
    await signOut();
  };

  const renderSidebar = () => (
    <aside className="w-64 bg-white border-r border-stone-200 h-screen sticky top-0 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-forest-700 rounded-xl flex items-center justify-center">
            <Mountain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-forest-700">Paila</h1>
            <p className="text-xs text-stone-400">Vendor Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {[
          { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
          { id: 'listings', icon: List, label: 'My Listings' },
          { id: 'bookings', icon: Calendar, label: 'Bookings' },
          { id: 'reviews', icon: Star, label: 'Reviews' },
          { id: 'profile', icon: User, label: 'Profile' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as VendorTab)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === item.id
                ? 'bg-forest-50 text-forest-700'
                : 'text-stone-600 hover:bg-stone-50'
            }`}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </button>
        ))}
      </nav>

      {/* Sign out */}
      <div className="p-4 border-t border-stone-200">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-stone-600 hover:bg-red-50 hover:text-red-600 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );

  const renderOverview = () => {
    return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-display font-bold text-forest-700">Good morning, {businessName}! 👋</h1>
        <p className="text-stone-500 mt-1">Here's how your business is performing today.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Bookings', value: stats.totalBookings, icon: Calendar, color: 'bg-blue-50 text-blue-600' },
          { label: 'This Month', value: `NPR ${stats.thisMonth.toLocaleString()}`, icon: DollarSign, color: 'bg-green-50 text-green-600', trend: stats.thisMonthGrowth },
          { label: 'Avg Rating', value: stats.avgRating, icon: Star, color: 'bg-yellow-50 text-yellow-600' },
          { label: 'Profile Views', value: stats.profileViews, icon: Eye, color: 'bg-purple-50 text-purple-600' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-stone-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-stone-500">{stat.label}</p>
                <p className="text-2xl font-bold text-forest-700 mt-1">{stat.value}</p>
                {stat.trend && (
                  <span className="inline-flex items-center gap-1 text-xs text-green-600 mt-1">
                    <TrendingUp className="w-3 h-3" />
                    {stat.trend}
                  </span>
                )}
              </div>
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent bookings */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="p-5 border-b border-stone-200 flex items-center justify-between">
          <h2 className="font-display font-bold text-forest-700">Recent Bookings</h2>
          <button
            onClick={() => setActiveTab('bookings')}
            className="text-sm text-forest-600 hover:text-forest-700 flex items-center gap-1"
          >
            View All <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="divide-y divide-stone-100">
          {MOCK_BOOKINGS.slice(0, 3).map((booking) => (
            <div key={booking.id} className="p-4 flex items-center justify-between hover:bg-stone-50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-stone-500" />
                </div>
                <div>
                  <p className="font-medium text-forest-700">#{booking.id} {booking.customerName}</p>
                  <p className="text-sm text-stone-500">{booking.dates}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-semibold text-forest-700">NPR {booking.amount.toLocaleString()}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                  booking.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                  booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex gap-3">
        <button
          onClick={() => { setShowAddListing(true); setActiveTab('listings'); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add New Listing
        </button>
        <button
          onClick={() => setActiveTab('bookings')}
          className="btn-secondary flex items-center gap-2"
        >
          View All Bookings
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className="btn-secondary flex items-center gap-2"
        >
          Edit Profile
        </button>
      </div>
    </div>
    );
  };

  const renderListings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-forest-700">My Listings</h1>
          <p className="text-stone-500 mt-1">Manage your guides, homestays, and services</p>
        </div>
        <button
          onClick={() => setShowAddListing(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add New Listing
        </button>
      </div>

      {/* Add listing form */}
      {showAddListing && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <h3 className="font-display font-bold text-lg text-forest-700 mb-4">Add New Listing</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Listing Type</label>
              <select className="input">
                <option value="">Select type</option>
                <option value="guide">Guide Service</option>
                <option value="homestay">Homestay</option>
                <option value="transport">Transport</option>
                <option value="cafe">Cafe / Restaurant</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Name of Service</label>
              <input type="text" className="input" placeholder="e.g., ABC Trekking Guide" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-stone-700 mb-2">Description</label>
              <textarea className="input resize-none" rows={3} placeholder="Describe your service..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Price (NPR)</label>
              <input type="number" className="input" placeholder="e.g., 5000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Per</label>
              <select className="input">
                <option value="day">Per Day</option>
                <option value="night">Per Night</option>
                <option value="person">Per Person</option>
                <option value="trip">Per Trip</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-stone-700 mb-2">Location</label>
              <input type="text" className="input" placeholder="e.g., Pokhara, Kaski" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-stone-700 mb-2">Photos</label>
              <div className="border-2 border-dashed border-stone-200 rounded-xl p-8 text-center hover:border-forest-300 transition-colors cursor-pointer">
                <UploadIcon className="w-8 h-8 text-stone-400 mx-auto mb-2" />
                <p className="text-sm text-stone-500">Click to upload up to 5 photos</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setShowAddListing(false)}
              className="btn-primary"
            >
              Publish Listing
            </button>
            <button
              onClick={() => setShowAddListing(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Listings grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {MOCK_LISTINGS.map((listing) => (
          <div key={listing.id} className="bg-white rounded-2xl border border-stone-200 overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-video bg-stone-100 relative">
              <img
                src={listing.image}
                alt={listing.name}
                className="w-full h-full object-cover"
              />
              <span className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${
                listing.status === 'active' ? 'bg-green-500 text-white' :
                listing.status === 'pending' ? 'bg-yellow-500 text-white' :
                'bg-stone-400 text-white'
              }`}>
                {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
              </span>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-forest-700">{listing.name}</h3>
              <div className="flex items-center gap-2 text-sm text-stone-500 mt-1">
                <MapPin className="w-4 h-4" />
                {listing.location}
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-stone-100">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-medium">{listing.rating}</span>
                  <span className="text-xs text-stone-400">({listing.reviewCount})</span>
                </div>
                <span className="font-bold text-forest-700">NPR {listing.price.toLocaleString()}</span>
              </div>
              <div className="flex gap-2 mt-4">
                <button className="flex-1 btn-secondary text-sm py-2">Edit</button>
                <button className="p-2 text-stone-400 hover:text-stone-600">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderBookings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-forest-700">Bookings</h1>
          <p className="text-stone-500 mt-1">Manage your customer bookings</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input type="text" placeholder="Search bookings..." className="input pl-10 w-48" />
          </div>
          <button className="p-2 border border-stone-200 rounded-xl hover:bg-stone-50">
            <Filter className="w-5 h-5 text-stone-500" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setBookingFilter(filter)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              bookingFilter === filter
                ? 'bg-forest-600 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            {filter.charAt(0).toUpperCase() + filter.slice(1)}
          </button>
        ))}
      </div>

      {/* Bookings table */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="text-left px-5 py-3 text-sm font-semibold text-stone-700">Booking ID</th>
                <th className="text-left px-5 py-3 text-sm font-semibold text-stone-700">Customer</th>
                <th className="text-left px-5 py-3 text-sm font-semibold text-stone-700">Dates</th>
                <th className="text-left px-5 py-3 text-sm font-semibold text-stone-700">Amount</th>
                <th className="text-left px-5 py-3 text-sm font-semibold text-stone-700">Status</th>
                <th className="text-left px-5 py-3 text-sm font-semibold text-stone-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-stone-50">
                  <td className="px-5 py-4 font-mono text-sm text-forest-700">#{booking.id}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-forest-100 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-forest-600" />
                      </div>
                      <span className="font-medium text-stone-700">{booking.customerName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-stone-600">{booking.dates}</td>
                  <td className="px-5 py-4 font-semibold text-forest-700">NPR {booking.amount.toLocaleString()}</td>
                  <td className="px-5 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                      booking.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      {booking.status === 'pending' && (
                        <>
                          <button className="p-1.5 bg-green-100 text-green-600 rounded-lg hover:bg-green-200">
                            <Check className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200">
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button className="p-1.5 bg-stone-100 text-stone-600 rounded-lg hover:bg-stone-200">
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderReviews = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-forest-700">Reviews</h1>
        <p className="text-stone-500 mt-1">What your customers are saying about you</p>
      </div>

      {/* Average rating */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 flex items-center gap-6">
        <div className="text-center">
          <div className="text-4xl font-bold text-forest-700">{stats.avgRating}</div>
          <div className="flex items-center justify-center gap-0.5 mt-1">
            {[1,2,3,4,5].map((i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${i <= Math.round(stats.avgRating) ? 'text-yellow-500 fill-yellow-500' : 'text-stone-200'}`}
              />
            ))}
          </div>
          <p className="text-sm text-stone-500 mt-1">Based on {MOCK_REVIEWS.length} reviews</p>
        </div>
        <div className="flex-1 space-y-2">
          {[5,4,3,2,1].map((stars) => (
            <div key={stars} className="flex items-center gap-2">
              <span className="text-sm text-stone-600 w-3">{stars}</span>
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-500 rounded-full"
                  style={{ width: `${stars === 5 ? 70 : stars === 4 ? 20 : stars === 3 ? 7 : 3}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews list */}
      <div className="space-y-4">
        {MOCK_REVIEWS.map((review) => (
          <div key={review.id} className="bg-white rounded-2xl border border-stone-200 p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-forest-100 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-forest-600" />
                </div>
                <div>
                  <p className="font-medium text-forest-700">{review.customerName}</p>
                  <p className="text-sm text-stone-500">{review.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                {[1,2,3,4,5].map((i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i <= review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-stone-200'}`}
                  />
                ))}
              </div>
            </div>
            <p className="text-stone-600 mt-4">{review.comment}</p>
            <button className="flex items-center gap-2 text-sm text-forest-600 hover:text-forest-700 mt-4">
              <MessageSquare className="w-4 h-4" />
              Reply
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-forest-700">Business Profile</h1>
        <p className="text-stone-500 mt-1">Manage your business information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main profile */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200 p-6">
            <h2 className="font-semibold text-forest-700 mb-4">Business Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Business Name</label>
                <input
                  type="text"
                  className="input"
                  defaultValue={businessName}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Description</label>
                <textarea
                  className="input resize-none"
                  rows={3}
                  defaultValue={vendor?.description || "Your trusted local guide and homestay provider in Nepal's beautiful mountains."}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">Location</label>
                  <input
                    type="text"
                    className="input"
                    defaultValue={vendor?.location || "Kathmandu"}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    className="input"
                    defaultValue={vendor?.phone || "+977 98XXXXXXXX"}
                  />
                </div>
              </div>
            </div>
            <button className="btn-primary mt-6">Save Changes</button>
          </div>
        </div>

        {/* Side info */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200 p-6">
            <h2 className="font-semibold text-forest-700 mb-4">Profile Photo</h2>
            <div className="w-24 h-24 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto">
              <User className="w-12 h-12 text-stone-400" />
            </div>
            <button className="btn-secondary w-full mt-4 text-sm">Upload Photo</button>
          </div>

          <div className="bg-forest-50 rounded-2xl p-6">
            <h2 className="font-semibold text-forest-700 mb-3">Account Status</h2>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <span className="text-sm text-forest-700">Active & Verified</span>
            </div>
            <p className="text-xs text-forest-600 mt-2">Your account is active and visible to travelers.</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderOverview();
      case 'listings': return renderListings();
      case 'bookings': return renderBookings();
      case 'reviews': return renderReviews();
      case 'profile': return renderProfile();
      default: return renderOverview();
    }
  };

  return (
    <div className="flex min-h-screen bg-stone-50">
      {renderSidebar()}
      <main className="flex-1 flex flex-col">
        <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
          {renderContent()}
        </div>
        <footer className="text-center py-3 text-xs text-stone-400 border-t border-stone-200">
          © 2026 Paila — Walk with confidence
        </footer>
      </main>
    </div>
  );
}

// Upload icon
function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  );
}
