import { useState, useEffect, useRef } from 'react';
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
  AlertTriangle,
  Upload,
  Camera,
  Phone,
  Mail,
  Globe,
  FileText,
  Save,
  Trash2,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';

type VendorTab = 'dashboard' | 'listings' | 'bookings' | 'reviews' | 'profile';

interface Booking {
  id: string;
  customer_name: string;
  customer_email: string;
  start_date: string;
  end_date: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes: string;
  created_at: string;
}

interface Review {
  id: string;
  customer_name: string;
  rating: number;
  date: string;
  comment: string;
  reply?: string;
}

interface VendorListing {
  id: string;
  name: string;
  type: string;
  location: string;
  price: number;
  price_unit: string;
  rating: number;
  review_count: number;
  status: 'active' | 'pending' | 'inactive';
  description: string;
  image: string;
  created_at: string;
}

const BUSINESS_TYPES = [
  { id: 'guide', icon: '🧭', label: 'Licensed Guide' },
  { id: 'homestay', icon: '🏡', label: 'Homestay / Guesthouse' },
  { id: 'transport', icon: '🚌', label: 'Transport / Jeep' },
  { id: 'cafe', icon: '☕', label: 'Café / Restaurant' },
  { id: 'hotel', icon: '🏨', label: 'Hotel / Lodge' },
  { id: 'tour_operator', icon: '🎒', label: 'Tour Operator' },
  { id: 'rental', icon: '🛍', label: 'Rental Service' },
];

const PRICE_UNITS = ['day', 'trip', 'hour', 'night', 'person', 'item'];

export default function VendorDashboard() {
  const { profile, vendor, signOut, userType } = useAuth();
  const [activeTab, setActiveTab] = useState<VendorTab>('dashboard');
  const [showAddListing, setShowAddListing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Real data state
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [listings, setListings] = useState<VendorListing[]>([]);
  const [stats, setStats] = useState({
    totalBookings: 0,
    thisMonth: 0,
    avgRating: 0,
    profileViews: 0,
    thisMonthGrowth: '+12%',
    pendingBookings: 0,
    confirmedBookings: 0,
    completedBookings: 0
  });

  // New listing form
  const [newListing, setNewListing] = useState({
    name: '',
    type: 'guide',
    description: '',
    price: '',
    priceUnit: 'day',
    location: '',
    image: ''
  });

  // Edit profile form
  const [profileForm, setProfileForm] = useState({
    business_name: '',
    description: '',
    location: '',
    phone: '',
    email: '',
    website: ''
  });

  const [bookingFilter, setBookingFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');

  const businessName = vendor?.business_name || profile?.name || 'Vendor';
  const businessType = vendor?.business_type || 'guide';

  // Fetch data on mount
  useEffect(() => {
    fetchVendorData();
  }, [vendor]);

  async function fetchVendorData() {
    setLoading(true);
    try {
      // Fetch vendor's listings
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', profile?.id)
        .single();

      if (vendorData) {
        // In a real app, you'd have separate listings, bookings, and reviews tables
        // For now, we'll use mock data but structure it properly

        // Mock bookings for demo
        const mockBookings: Booking[] = [
          {
            id: '1024',
            customer_name: 'Suman Rai',
            customer_email: 'suman@email.com',
            start_date: '2026-07-15',
            end_date: '2026-07-17',
            amount: 6000,
            status: 'confirmed',
            notes: 'Trekking guide for ABC',
            created_at: new Date().toISOString()
          },
          {
            id: '1023',
            customer_name: 'Tom Miller',
            customer_email: 'tom@email.com',
            start_date: '2026-07-10',
            end_date: '2026-07-12',
            amount: 4500,
            status: 'completed',
            notes: 'Day tour',
            created_at: new Date(Date.now() - 86400000).toISOString()
          },
          {
            id: '1022',
            customer_name: 'Priya Kumar',
            customer_email: 'priya@email.com',
            start_date: '2026-07-08',
            end_date: '2026-07-08',
            amount: 2000,
            status: 'pending',
            notes: 'Waiting for confirmation',
            created_at: new Date(Date.now() - 172800000).toISOString()
          },
        ];

        setBookings(mockBookings);
        setStats({
          totalBookings: mockBookings.length,
          thisMonth: mockBookings.reduce((sum, b) => sum + b.amount, 0),
          avgRating: 4.8,
          profileViews: 142,
          thisMonthGrowth: '+12%',
          pendingBookings: mockBookings.filter(b => b.status === 'pending').length,
          confirmedBookings: mockBookings.filter(b => b.status === 'confirmed').length,
          completedBookings: mockBookings.filter(b => b.status === 'completed').length
        });

        // Mock listing based on vendor data
        const mockListing: VendorListing = {
          id: vendorData.id,
          name: vendorData.business_name,
          type: vendorData.business_type,
          location: vendorData.location || vendorData.district,
          price: 3500,
          price_unit: 'day',
          rating: 4.8,
          review_count: 45,
          status: 'active',
          description: vendorData.description,
          image: 'https://images.pexels.com/photos/1271619/pexels-photo-1271619.jpeg?auto=compress&cs=tinysrgb&w=400',
          created_at: vendorData.created_at
        };

        setListings([mockListing]);

        // Mock reviews
        setReviews([
          {
            id: '1',
            customer_name: 'Tom Miller',
            rating: 5,
            date: 'Jul 12, 2024',
            comment: 'Amazing experience! The guide was incredibly knowledgeable and the homestay was perfect.'
          },
          {
            id: '2',
            customer_name: 'Emma Schmidt',
            rating: 4,
            date: 'Jul 8, 2024',
            comment: 'Great location and friendly host. Would recommend for anyone trekking in the area.'
          },
          {
            id: '3',
            customer_name: 'Kenji Tanaka',
            rating: 5,
            date: 'Jun 25, 2024',
            comment: 'Everything was well organized. Felt very safe and well taken care of.'
          }
        ]);

        setProfileForm({
          business_name: vendorData.business_name,
          description: vendorData.description || '',
          location: vendorData.location || '',
          phone: vendorData.phone || '',
          email: vendorData.email || profile?.email || '',
          website: ''
        });
      }
    } catch (err) {
      console.error('Error fetching vendor data:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('vendors')
        .update({
          business_name: profileForm.business_name,
          description: profileForm.description,
          location: profileForm.location,
          phone: profileForm.phone,
          email: profileForm.email
        })
        .eq('user_id', profile?.id);

      if (error) throw error;

      // Refresh data
      fetchVendorData();
      alert('Profile updated successfully!');
    } catch (err) {
      console.error('Error saving profile:', err);
      alert('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddListing = async () => {
    setSaving(true);
    try {
      // In a real app, you'd create a new listing
      // For now, just update the vendor's main listing
      const { error } = await supabase
        .from('vendors')
        .update({
          business_name: newListing.name,
          business_type: newListing.type,
          description: newListing.description,
          location: newListing.location
        })
        .eq('user_id', profile?.id);

      if (error) throw error;

      setShowAddListing(false);
      setNewListing({
        name: '',
        type: 'guide',
        description: '',
        price: '',
        priceUnit: 'day',
        location: '',
        image: ''
      });

      fetchVendorData();
      alert('Listing created successfully!');
    } catch (err) {
      console.error('Error creating listing:', err);
      alert('Failed to create listing. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, newStatus: Booking['status']) => {
    try {
      // In a real app, you'd update the booking in database
      setBookings(bookings.map(b =>
        b.id === bookingId ? { ...b, status: newStatus } : b
      ));

      setStats(prev => ({
        ...prev,
        pendingBookings: bookings.filter(b => b.status === 'pending').length,
        confirmedBookings: bookings.filter(b => b.status === 'confirmed').length,
        completedBookings: bookings.filter(b => b.status === 'completed').length
      }));
    } catch (err) {
      console.error('Error updating booking:', err);
    }
  };

  const filteredBookings = bookings.filter(b =>
    bookingFilter === 'all' ? true : b.status === bookingFilter
  );

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
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-forest-600" />
        </div>
      );
    }

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
            { label: 'Total Bookings', value: stats.totalBookings, icon: Calendar, color: 'bg-blue-50 text-blue-600', trend: `${stats.pendingBookings} pending` },
            { label: 'This Month', value: `NPR ${stats.thisMonth.toLocaleString()}`, icon: DollarSign, color: 'bg-green-50 text-green-600', trend: stats.thisMonthGrowth },
            { label: 'Avg Rating', value: stats.avgRating, icon: Star, color: 'bg-yellow-50 text-yellow-600', trend: `${reviews.length} reviews` },
            { label: 'Profile Views', value: stats.profileViews, icon: Eye, color: 'bg-purple-50 text-purple-600', trend: 'Last 30 days' },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-stone-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-stone-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-forest-700 mt-1">{stat.value}</p>
                  <span className="inline-block text-xs text-stone-500 mt-1">{stat.trend}</span>
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
            {bookings.slice(0, 3).map((booking) => (
              <div key={booking.id} className="p-4 flex items-center justify-between hover:bg-stone-50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-stone-500" />
                  </div>
                  <div>
                    <p className="font-medium text-forest-700">#{booking.id} {booking.customer_name}</p>
                    <p className="text-sm text-stone-500">
                      {new Date(booking.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {' - '}
                      {new Date(booking.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
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
              <select
                value={newListing.type}
                onChange={(e) => setNewListing({ ...newListing, type: e.target.value })}
                className="input"
              >
                {BUSINESS_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>{t.icon} {t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Name of Service</label>
              <input
                type="text"
                value={newListing.name}
                onChange={(e) => setNewListing({ ...newListing, name: e.target.value })}
                className="input"
                placeholder="e.g., ABC Trekking Guide"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-stone-700 mb-2">Description</label>
              <textarea
                value={newListing.description}
                onChange={(e) => setNewListing({ ...newListing, description: e.target.value })}
                className="input resize-none"
                rows={3}
                placeholder="Describe your service..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Price (NPR)</label>
              <input
                type="number"
                value={newListing.price}
                onChange={(e) => setNewListing({ ...newListing, price: e.target.value })}
                className="input"
                placeholder="e.g., 5000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Per</label>
              <select
                value={newListing.priceUnit}
                onChange={(e) => setNewListing({ ...newListing, priceUnit: e.target.value })}
                className="input"
              >
                {PRICE_UNITS.map((u) => (
                  <option key={u} value={u}>Per {u.charAt(0).toUpperCase() + u.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-stone-700 mb-2">Location</label>
              <input
                type="text"
                value={newListing.location}
                onChange={(e) => setNewListing({ ...newListing, location: e.target.value })}
                className="input"
                placeholder="e.g., Pokhara, Kaski"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-stone-700 mb-2">Photos</label>
              <button className="w-full border-2 border-dashed border-stone-200 rounded-xl p-8 text-center hover:border-forest-300 transition-colors">
                <Upload className="w-8 h-8 text-stone-400 mx-auto mb-2" />
                <p className="text-sm text-stone-500">Click to upload up to 5 photos</p>
              </button>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleAddListing}
              disabled={saving || !newListing.name || !newListing.location}
              className="btn-primary flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Publish Listing'
              )}
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
        {listings.map((listing) => (
          <div key={listing.id} className="bg-white rounded-2xl border border-stone-200 overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-video bg-stone-100 relative">
              {listing.image && (
                <img
                  src={listing.image}
                  alt={listing.name}
                  className="w-full h-full object-cover"
                />
              )}
              <span className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${
                listing.status === 'active' ? 'bg-green-500 text-white' :
                listing.status === 'pending' ? 'bg-yellow-500 text-white' :
                'bg-stone-400 text-white'
              }`}>
                {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
              </span>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{BUSINESS_TYPES.find(t => t.id === listing.type)?.icon || '🌿'}</span>
                <h3 className="font-semibold text-forest-700">{listing.name}</h3>
              </div>
              <div className="flex items-center gap-2 text-sm text-stone-500 mt-1">
                <MapPin className="w-4 h-4" />
                {listing.location}
              </div>
              <p className="text-sm text-stone-600 mt-2 line-clamp-2">{listing.description}</p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-stone-100">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-medium">{listing.rating}</span>
                  <span className="text-xs text-stone-400">({listing.review_count})</span>
                </div>
                <span className="font-bold text-forest-700">NPR {listing.price?.toLocaleString()}/{listing.price_unit}</span>
              </div>
              <div className="flex gap-2 mt-4">
                <button className="flex-1 btn-secondary text-sm py-2">Edit</button>
                <button className="p-2 text-stone-400 hover:text-red-600">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {listings.length === 0 && !showAddListing && (
        <div className="text-center py-12 bg-white rounded-2xl border border-stone-200">
          <Plus className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="font-semibold text-forest-700 mb-1">No listings yet</h3>
          <p className="text-sm text-stone-500 mb-4">Create your first listing to start receiving bookings!</p>
          <button onClick={() => setShowAddListing(true)} className="btn-primary">
            Create First Listing
          </button>
        </div>
      )}
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
            {filter === 'all' && ` (${bookings.length})`}
            {filter === 'pending' && ` (${stats.pendingBookings})`}
            {filter === 'confirmed' && ` (${stats.confirmedBookings})`}
            {filter === 'completed' && ` (${stats.completedBookings})`}
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
                      <div>
                        <div className="font-medium text-stone-700">{booking.customer_name}</div>
                        <div className="text-xs text-stone-500">{booking.customer_email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-stone-600">
                    {new Date(booking.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {' - '}
                    {new Date(booking.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </td>
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
                          <button
                            onClick={() => handleUpdateBookingStatus(booking.id, 'confirmed')}
                            className="p-1.5 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleUpdateBookingStatus(booking.id, 'cancelled')}
                            className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {booking.status === 'confirmed' && (
                        <button
                          onClick={() => handleUpdateBookingStatus(booking.id, 'completed')}
                          className="p-1.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                        >
                          <Check className="w-4 h-4" />
                        </button>
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

      {filteredBookings.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-stone-200">
          <Calendar className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="font-semibold text-forest-700 mb-1">No bookings found</h3>
          <p className="text-sm text-stone-500">
            {bookingFilter !== 'all' ? `No ${bookingFilter} bookings` : 'You don\'t have any bookings yet'}
          </p>
        </div>
      )}
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
          <p className="text-sm text-stone-500 mt-1">Based on {reviews.length} reviews</p>
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
        {reviews.map((review) => (
          <div key={review.id} className="bg-white rounded-2xl border border-stone-200 p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-forest-100 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-forest-600" />
                </div>
                <div>
                  <p className="font-medium text-forest-700">{review.customer_name}</p>
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

      {reviews.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-stone-200">
          <Star className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="font-semibold text-forest-700 mb-1">No reviews yet</h3>
          <p className="text-sm text-stone-500">Your reviews will appear here once customers start leaving them</p>
        </div>
      )}
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
            <h2 className="font-semibold text-forest-700 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Business Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Business Name</label>
                <input
                  type="text"
                  value={profileForm.business_name}
                  onChange={(e) => setProfileForm({ ...profileForm, business_name: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Description</label>
                <textarea
                  value={profileForm.description}
                  onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                  className="input resize-none"
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Location</label>
                <input
                  type="text"
                  value={profileForm.location}
                  onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="input"
                  placeholder="+977 98XXXXXXXX"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email
                </label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  <Globe className="w-4 h-4 inline mr-1" />
                  Website (optional)
                </label>
                <input
                  type="url"
                  value={profileForm.website}
                  onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                  className="input"
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="btn-primary mt-6 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>

        {/* Side info */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200 p-6">
            <h2 className="font-semibold text-forest-700 mb-4">Profile Photo</h2>
            <div className="w-24 h-24 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto">
              <User className="w-12 h-12 text-stone-400" />
            </div>
            <button className="btn-secondary w-full mt-4 text-sm flex items-center justify-center gap-2">
              <Camera className="w-4 h-4" />
              Upload Photo
            </button>
          </div>

          <div className="bg-forest-50 rounded-2xl p-6">
            <h2 className="font-semibold text-forest-700 mb-3">Account Status</h2>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <span className="text-sm text-forest-700">Active & Verified</span>
            </div>
            <p className="text-xs text-forest-600 mt-2">Your account is active and visible to travelers.</p>
          </div>

          <div className="bg-amber-50 rounded-2xl p-6">
            <h2 className="font-semibold text-amber-700 mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Pro Tip
            </h2>
            <p className="text-sm text-amber-600">
              Complete your profile with a photo and detailed description to get 3x more bookings!
            </p>
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
