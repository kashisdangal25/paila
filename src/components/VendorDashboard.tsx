import { useState, useEffect } from 'react';
import {
  Store, Calendar, DollarSign, Star, Edit2, Plus, ChevronRight, Loader2, X,
  TrendingUp, Clock, Check, AlertCircle, Camera, MapPin, Languages, Briefcase
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

interface VendorData {
  id: string;
  business_name: string;
  business_type: string;
  contact_person: string | null;
  phone: string;
  email: string;
  location: string;
  district: string | null;
  province: string | null;
  description: string;
  years_experience: number | null;
  languages: string[];
  services_offered: string[];
  profile_photo_url: string | null;
  logo_url: string | null;
  gallery_urls: string[] | null;
  pricing: { hourly: number | null; daily: number | null; nightly: number | null; package: number | null } | null;
  availability: Record<string, boolean> | null;
  rating: number;
  review_count: number;
  cover_photo_url: string | null;
  status: string;
}

interface Booking {
  id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  booking_date: string;
  end_date: string | null;
  status: string;
  total_amount: number;
  notes: string | null;
  created_at: string;
}

interface Review {
  id: string;
  user_id: string;
  rating: number;
  content: string;
  user_name: string;
  created_at: string;
}

type Tab = 'dashboard' | 'bookings' | 'reviews' | 'profile';

const NATURE_COVER = 'https://images.pexels.com/photos/4194617/pexels-photo-4194617.jpeg?auto=compress&cs=tinysrgb&w=1200';

export default function VendorDashboard() {
  const { user, profile, signOut } = useAuth();
  const [vendor, setVendor] = useState<VendorData | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [error, setError] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState<Partial<VendorData>>({});

  useEffect(() => {
    if (user) { fetchVendorData(); }
  }, [user]);

  async function fetchVendorData() {
    if (!user) return;
    setLoading(true);
    const { data: vendorData } = await supabase.from('vendors').select('*').eq('user_id', user.id).maybeSingle();
    if (vendorData) {
      setVendor(vendorData as VendorData);
      setEditForm(vendorData as VendorData);
      const { data: bookingData } = await supabase.from('vendor_bookings').select('*').eq('vendor_id', vendorData.id).order('created_at', { ascending: false });
      if (bookingData) setBookings(bookingData as Booking[]);
      const { data: reviewData } = await supabase.from('reviews').select('*').eq('guide_id', vendorData.id).order('created_at', { ascending: false });
      if (reviewData) setReviews(reviewData as Review[]);
    }
    setLoading(false);
  }

  async function updateBookingStatus(bookingId: string, status: string) {
    const { error } = await supabase.from('vendor_bookings').update({ status }).eq('id', bookingId);
    if (error) { setError('Failed to update booking'); return; }
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status } : b));
  }

  async function saveProfile() {
    if (!user || !vendor) return;
    const { error } = await supabase.from('vendors').update({
      business_name: editForm.business_name,
      description: editForm.description,
      location: editForm.location,
      phone: editForm.phone,
      email: editForm.email,
      years_experience: editForm.years_experience,
      languages: editForm.languages,
      services_offered: editForm.services_offered,
      pricing: editForm.pricing,
    }).eq('id', vendor.id);
    if (error) { setError('Failed to save'); return; }
    setVendor(prev => prev ? { ...prev, ...editForm } as VendorData : prev);
    setEditingProfile(false);
  }

  function toggleAvailabilityDay(date: string) {
    if (!vendor || !vendor.availability) return;
    const newAvail = { ...vendor.availability, [date]: !vendor.availability[date] };
    setVendor(prev => prev ? { ...prev, availability: newAvail } : prev);
    supabase.from('vendors').update({ availability: newAvail }).eq('id', vendor.id);
  }

  // Calculate stats
  const totalEarnings = bookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + Number(b.total_amount), 0);
  const monthlyEarnings = bookings.filter(b => b.status === 'completed' && new Date(b.booking_date).getMonth() === new Date().getMonth()).reduce((sum, b) => sum + Number(b.total_amount), 0);
  const dailyEarnings = bookings.filter(b => b.status === 'completed' && b.booking_date === new Date().toISOString().split('T')[0]).reduce((sum, b) => sum + Number(b.total_amount), 0);
  const pendingBookings = bookings.filter(b => b.status === 'pending').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-forest-600" />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Store className="w-12 h-12 mx-auto mb-3 text-stone-400" />
          <h2 className="text-xl font-bold text-stone-700 mb-2">No vendor profile found</h2>
          <p className="text-sm text-stone-500 mb-4">Please complete vendor onboarding first.</p>
          <button onClick={signOut} className="text-forest-600 font-medium">Sign out</button>
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: typeof Store }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { id: 'bookings', label: 'Bookings', icon: Calendar },
    { id: 'reviews', label: 'Reviews', icon: Star },
    { id: 'profile', label: 'Profile', icon: Edit2 },
  ];

  const inputClass = 'w-full px-4 py-2.5 rounded-xl border-2 border-stone-200 focus:border-forest-500 focus:ring-2 focus:ring-forest-200 focus:outline-none transition-all bg-white text-stone-800';

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header with nature cover */}
      <div className="relative h-48 bg-cover bg-center" style={{ backgroundImage: `url(${vendor.cover_photo_url || NATURE_COVER})` }}>
        <div className="absolute inset-0 bg-gradient-to-b from-forest-900/40 to-stone-900/60" />
        <div className="relative max-w-5xl mx-auto px-4 pt-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
              <Store className="w-6 h-6 text-white" />
            </div>
            <span className="font-display text-xl font-bold text-white">Vendor Dashboard</span>
          </div>
          <button onClick={signOut} className="text-sm text-white/80 hover:text-white">Sign out</button>
        </div>
        <div className="relative max-w-5xl mx-auto px-4 pt-8">
          <div className="flex items-end gap-4">
            <div className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-white shadow-lg">
              {vendor.profile_photo_url ? (
                <img src={vendor.profile_photo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-forest-600 flex items-center justify-center text-2xl font-bold text-white">{vendor.business_name[0]}</div>
              )}
            </div>
            <div className="pb-2">
              <h1 className="text-2xl font-display font-bold text-white">{vendor.business_name}</h1>
              <div className="flex items-center gap-2 text-sm text-white/80">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span>{vendor.rating || 'New'}</span>
                <span>•</span>
                <MapPin className="w-3 h-3" /> {vendor.location}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors', activeTab === tab.id ? 'bg-forest-600 text-white' : 'bg-white text-stone-600 hover:bg-stone-100')}>
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        {error && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white rounded-xl p-4 border border-stone-200">
                <DollarSign className="w-5 h-5 text-forest-600 mb-2" />
                <p className="text-2xl font-bold text-stone-800">NPR {totalEarnings.toLocaleString()}</p>
                <p className="text-xs text-stone-500">Total earnings</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-stone-200">
                <Calendar className="w-5 h-5 text-forest-600 mb-2" />
                <p className="text-2xl font-bold text-stone-800">NPR {monthlyEarnings.toLocaleString()}</p>
                <p className="text-xs text-stone-500">This month</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-stone-200">
                <Clock className="w-5 h-5 text-forest-600 mb-2" />
                <p className="text-2xl font-bold text-stone-800">{pendingBookings}</p>
                <p className="text-xs text-stone-500">Pending bookings</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-stone-200">
                <Star className="w-5 h-5 text-forest-600 mb-2" />
                <p className="text-2xl font-bold text-stone-800">{vendor.rating || '—'}</p>
                <p className="text-xs text-stone-500">Rating ({vendor.review_count} reviews)</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setActiveTab('profile')} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-stone-200 text-sm font-medium text-stone-700 hover:bg-stone-50">
                <Edit2 className="w-4 h-4" /> Edit Profile
              </button>
              <button onClick={() => setActiveTab('bookings')} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-stone-200 text-sm font-medium text-stone-700 hover:bg-stone-50">
                <Calendar className="w-4 h-4" /> View Bookings
              </button>
            </div>

            {/* Recent Bookings */}
            <div className="bg-white rounded-xl border border-stone-200 p-4">
              <h3 className="font-semibold text-stone-800 mb-3">Recent Bookings</h3>
              {bookings.length === 0 ? (
                <p className="text-sm text-stone-500 text-center py-4">No bookings yet</p>
              ) : (
                <div className="space-y-2">
                  {bookings.slice(0, 5).map(b => (
                    <div key={b.id} className="flex items-center justify-between p-3 rounded-lg bg-stone-50">
                      <div>
                        <p className="text-sm font-medium text-stone-800">{b.customer_name}</p>
                        <p className="text-xs text-stone-500">{new Date(b.booking_date).toLocaleDateString()}</p>
                      </div>
                      <span className={cn('px-2 py-1 rounded-full text-xs font-medium', b.status === 'confirmed' ? 'bg-green-100 text-green-700' : b.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : b.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700')}>{b.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Availability Calendar */}
            <div className="bg-white rounded-xl border border-stone-200 p-4">
              <h3 className="font-semibold text-stone-800 mb-3">Availability Calendar</h3>
              <div className="grid grid-cols-7 gap-1 max-h-48 overflow-y-auto">
                {vendor.availability && Object.entries(vendor.availability).map(([date, available]) => (
                  <button key={date} onClick={() => toggleAvailabilityDay(date)} className={cn('aspect-square rounded-lg text-xs font-medium transition-colors flex flex-col items-center justify-center', available ? 'bg-forest-600 text-white' : 'bg-stone-100 text-stone-400')}>
                    <span>{new Date(date).getDate()}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-lg font-bold text-stone-800">All Bookings</h2>
            {bookings.length === 0 ? (
              <div className="bg-white rounded-xl border border-stone-200 p-8 text-center">
                <Calendar className="w-10 h-10 mx-auto mb-3 text-stone-300" />
                <p className="text-sm text-stone-500">No bookings yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {bookings.map(b => (
                  <div key={b.id} className="bg-white rounded-xl border border-stone-200 p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium text-stone-800">{b.customer_name}</p>
                        <p className="text-xs text-stone-500">{new Date(b.booking_date).toLocaleDateString()} {b.end_date && `→ ${new Date(b.end_date).toLocaleDateString()}`}</p>
                        {b.customer_phone && <p className="text-xs text-stone-500 mt-1">{b.customer_phone}</p>}
                        {b.notes && <p className="text-xs text-stone-500 mt-1">{b.notes}</p>}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-stone-800">NPR {Number(b.total_amount).toLocaleString()}</p>
                        <span className={cn('px-2 py-1 rounded-full text-xs font-medium', b.status === 'confirmed' ? 'bg-green-100 text-green-700' : b.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : b.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700')}>{b.status}</span>
                      </div>
                    </div>
                    {b.status === 'pending' && (
                      <div className="flex gap-2">
                        <button onClick={() => updateBookingStatus(b.id, 'confirmed')} className="flex-1 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700">Confirm</button>
                        <button onClick={() => updateBookingStatus(b.id, 'cancelled')} className="flex-1 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600">Decline</button>
                      </div>
                    )}
                    {b.status === 'confirmed' && (
                      <button onClick={() => updateBookingStatus(b.id, 'completed')} className="w-full py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">Mark Completed</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-lg font-bold text-stone-800">Reviews</h2>
            <div className="bg-white rounded-xl border border-stone-200 p-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-stone-800">{vendor.rating || '—'}</p>
                  <div className="flex">{[...Array(5)].map((_, i) => <Star key={i} className={cn('w-4 h-4', i < Math.round(vendor.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-stone-300')} />)}</div>
                  <p className="text-xs text-stone-500 mt-1">{vendor.review_count} reviews</p>
                </div>
              </div>
              {reviews.length === 0 ? (
                <p className="text-sm text-stone-500 text-center py-4">No reviews yet</p>
              ) : (
                <div className="space-y-3">
                  {reviews.map(r => (
                    <div key={r.id} className="p-3 rounded-lg bg-stone-50">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-stone-800">{r.user_name}</p>
                        <div className="flex">{[...Array(5)].map((_, i) => <Star key={i} className={cn('w-3 h-3', i < r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-stone-300')} />)}</div>
                      </div>
                      <p className="text-sm text-stone-600">{r.content}</p>
                      <p className="text-xs text-stone-400 mt-1">{new Date(r.created_at).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-stone-800">Business Profile</h2>
              <button onClick={() => { setEditingProfile(!editingProfile); setEditForm(vendor); }} className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors', editingProfile ? 'bg-stone-100 text-stone-700' : 'bg-forest-600 text-white hover:bg-forest-700')}>
                {editingProfile ? 'Cancel' : <><Edit2 className="w-4 h-4" /> Edit</>}
              </button>
            </div>

            {editingProfile ? (
              <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block text-stone-700">Business Name</label>
                  <input type="text" value={editForm.business_name || ''} onChange={e => setEditForm(prev => ({ ...prev, business_name: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block text-stone-700">Description</label>
                  <textarea value={editForm.description || ''} onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))} rows={3} className={cn(inputClass, 'resize-none')} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block text-stone-700">Phone</label>
                    <input type="tel" value={editForm.phone || ''} onChange={e => setEditForm(prev => ({ ...prev, phone: e.target.value }))} className={inputClass} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block text-stone-700">Email</label>
                    <input type="email" value={editForm.email || ''} onChange={e => setEditForm(prev => ({ ...prev, email: e.target.value }))} className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block text-stone-700">Location</label>
                  <input type="text" value={editForm.location || ''} onChange={e => setEditForm(prev => ({ ...prev, location: e.target.value }))} className={inputClass} />
                </div>
                <button onClick={saveProfile} className="w-full py-3 rounded-xl bg-forest-600 text-white font-medium hover:bg-forest-700">Save Changes</button>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-3">
                <div>
                  <p className="text-xs text-stone-500">Description</p>
                  <p className="text-sm text-stone-800">{vendor.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-xs text-stone-500">Phone</p><p className="text-sm text-stone-800">{vendor.phone}</p></div>
                  <div><p className="text-xs text-stone-500">Email</p><p className="text-sm text-stone-800">{vendor.email}</p></div>
                  <div><p className="text-xs text-stone-500">Location</p><p className="text-sm text-stone-800">{vendor.location}</p></div>
                  <div><p className="text-xs text-stone-500">Experience</p><p className="text-sm text-stone-800">{vendor.years_experience || 0} years</p></div>
                </div>
                {vendor.languages && vendor.languages.length > 0 && (
                  <div>
                    <p className="text-xs text-stone-500 mb-1">Languages</p>
                    <div className="flex flex-wrap gap-1">
                      {vendor.languages.map(l => <span key={l} className="px-2 py-1 rounded-full bg-stone-100 text-xs text-stone-700">{l}</span>)}
                    </div>
                  </div>
                )}
                {vendor.services_offered && vendor.services_offered.length > 0 && (
                  <div>
                    <p className="text-xs text-stone-500 mb-1">Services</p>
                    <div className="flex flex-wrap gap-1">
                      {vendor.services_offered.map(s => <span key={s} className="px-2 py-1 rounded-full bg-forest-50 text-xs text-forest-700">{s}</span>)}
                    </div>
                  </div>
                )}
                {vendor.pricing && (
                  <div>
                    <p className="text-xs text-stone-500 mb-1">Pricing</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {vendor.pricing.hourly && <span>Hourly: NPR {vendor.pricing.hourly}</span>}
                      {vendor.pricing.daily && <span>Daily: NPR {vendor.pricing.daily}</span>}
                      {vendor.pricing.nightly && <span>Nightly: NPR {vendor.pricing.nightly}</span>}
                      {vendor.pricing.package && <span>Package: NPR {vendor.pricing.package}</span>}
                    </div>
                  </div>
                )}
                {vendor.gallery_urls && vendor.gallery_urls.length > 0 && (
                  <div>
                    <p className="text-xs text-stone-500 mb-1">Gallery</p>
                    <div className="flex flex-wrap gap-2">
                      {vendor.gallery_urls.map((url, i) => (
                        <div key={i} className="w-16 h-16 rounded-lg overflow-hidden">
                          <img src={url} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
