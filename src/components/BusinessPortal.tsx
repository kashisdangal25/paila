import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, Building2, Calendar, Star, ChevronLeft, Plus, Edit2,
  Phone, Mail, MapPin, Clock, DollarSign, Shield, CheckCircle, AlertCircle, Camera, FileText, LogOut
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { cn } from '../lib/utils';

type BusinessTab = 'dashboard' | 'profile' | 'bookings' | 'reviews' | 'earnings';

interface BusinessProfile {
  id: string;
  business_type: 'guide' | 'homestay' | 'both';
  name: string;
  description: string;
  region: string;
  phone: string;
  email: string;
  avatar_url: string;
  rating: number;
  review_count: number;
  specialties: string[];
  available: boolean;
  verified: boolean;
  price_per_day?: number;
  price_per_night?: number;
}

interface BusinessPortalProps {
  onExit?: () => void;
}

export function BusinessPortal({ onExit }: BusinessPortalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<BusinessTab>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    fetchBusinessProfile();
  }, [user]);

  async function fetchBusinessProfile() {
    if (!user) return;
    setLoading(true);

    // Check if user has a guide profile
    const { data: guideData } = await supabase
      .from('guides')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (guideData) {
      setProfile({
        id: guideData.id,
        business_type: 'guide',
        name: guideData.name,
        description: guideData.bio || '',
        region: guideData.region || '',
        phone: '',
        email: user.email || '',
        avatar_url: guideData.avatar_url,
        rating: guideData.rating || 0,
        review_count: guideData.review_count || 0,
        specialties: guideData.specialties || [],
        available: guideData.available,
        verified: guideData.verified,
        price_per_day: guideData.price_per_day,
      });
    }

    setLoading(false);
  }

  async function updateProfile(updates: Partial<BusinessProfile>) {
    if (!profile) return;

    if (profile.business_type === 'guide') {
      const { error } = await supabase
        .from('guides')
        .update({
          name: updates.name,
          bio: updates.description,
          region: updates.region,
          available: updates.available,
          price_per_day: updates.price_per_day,
          specialties: updates.specialties,
        })
        .eq('id', profile.id);

      if (!error) {
        setProfile({ ...profile, ...updates });
        setEditing(false);
      }
    }
  }

  const menuItems: { id: BusinessTab; label: string; icon: any }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'profile', label: 'My Profile', icon: Users },
    { id: 'bookings', label: 'Bookings', icon: Calendar },
    { id: 'reviews', label: 'Reviews', icon: Star },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-forest-200 border-t-forest-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-stone-500">Loading your business portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 flex">
      {/* Sidebar */}
      <div className={cn(
        'bg-white border-r border-stone-200 transition-all duration-300 flex-shrink-0',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}>
        <div className="p-4 flex items-center justify-between border-b border-stone-200">
          {!sidebarCollapsed && (
            <h1 className="font-display font-bold text-forest-600">Business Portal</h1>
          )}
          <div className="flex items-center gap-2">
            {onExit && (
              <button
                onClick={onExit}
                className="p-2 rounded-lg hover:bg-stone-100"
                title="Exit to App"
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 rounded-lg hover:bg-stone-50"
            >
              <ChevronLeft className={cn('w-5 h-5 transition-transform', sidebarCollapsed && 'rotate-180')} />
            </button>
          </div>
        </div>

        <nav className="p-2 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                activeTab === item.id
                  ? 'bg-forest-600 text-white'
                  : 'text-stone-600 hover:bg-stone-50'
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6 max-w-5xl mx-auto">
          {/* Dashboard */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-display font-bold text-stone-800">Welcome back!</h1>
                <p className="text-stone-500">Manage your tourism business on Paila</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Profile Views', value: '1,234', change: '+12%' },
                  { label: 'Bookings', value: '23', change: '+8%' },
                  { label: 'Reviews', value: profile?.review_count || 0, change: '+2' },
                  { label: 'Rating', value: profile?.rating?.toFixed(1) || '0.0', change: '' },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white rounded-xl p-4 border border-stone-200">
                    <p className="text-sm text-stone-500 mb-1">{stat.label}</p>
                    <div className="flex items-end gap-2">
                      <span className="text-2xl font-display font-bold text-stone-800">{stat.value}</span>
                      {stat.change && (
                        <span className="text-sm text-green-600 font-medium">{stat.change}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl p-6 border border-stone-200">
                <h3 className="font-semibold text-stone-800 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button
                    onClick={() => setActiveTab('profile')}
                    className="p-4 rounded-xl bg-stone-50 hover:bg-stone-100 transition-colors text-center"
                  >
                    <Edit2 className="w-6 h-6 mx-auto mb-2 text-forest-600" />
                    <span className="text-sm font-medium text-stone-700">Edit Profile</span>
                  </button>
                  <button className="p-4 rounded-xl bg-stone-50 hover:bg-stone-100 transition-colors text-center">
                    <Calendar className="w-6 h-6 mx-auto mb-2 text-forest-600" />
                    <span className="text-sm font-medium text-stone-700">Set Availability</span>
                  </button>
                  <button className="p-4 rounded-xl bg-stone-50 hover:bg-stone-100 transition-colors text-center">
                    <Camera className="w-6 h-6 mx-auto mb-2 text-forest-600" />
                    <span className="text-sm font-medium text-stone-700">Upload Photos</span>
                  </button>
                  <button className="p-4 rounded-xl bg-stone-50 hover:bg-stone-100 transition-colors text-center">
                    <FileText className="w-6 h-6 mx-auto mb-2 text-forest-600" />
                    <span className="text-sm font-medium text-stone-700">View Reports</span>
                  </button>
                </div>
              </div>

              {/* Profile Completion */}
              <div className="bg-white rounded-xl p-6 border border-stone-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-stone-800">Profile Completion</h3>
                  <span className="text-forest-600 font-semibold">75%</span>
                </div>
                <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div className="h-full bg-forest-600 rounded-full" style={{ width: '75%' }} />
                </div>
                <div className="mt-4 space-y-2">
                  {[
                    { done: true, label: 'Basic information added' },
                    { done: true, label: 'Contact details verified' },
                    { done: true, label: 'Profile photo uploaded' },
                    { done: false, label: 'Add more photos (3+ recommended)' },
                    { done: false, label: 'Verify your identity' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      {item.done ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-amber-500" />
                      )}
                      <span className={cn('text-sm', item.done ? 'text-stone-500' : 'text-stone-700')}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Profile */}
          {activeTab === 'profile' && profile && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-display font-bold text-stone-800">My Profile</h1>
                  <p className="text-stone-500">Manage how travelers see your business</p>
                </div>
                <button
                  onClick={() => setEditing(!editing)}
                  className={cn('btn-primary', editing && 'bg-stone-500')}
                >
                  {editing ? 'Cancel' : 'Edit Profile'}
                </button>
              </div>

              <div className="bg-white rounded-xl p-6 border border-stone-200">
                {/* Avatar */}
                <div className="flex items-start gap-6 mb-6">
                  <div className="relative">
                    <img
                      src={profile.avatar_url || 'https://via.placeholder.com/100'}
                      alt={profile.name}
                      className="w-24 h-24 rounded-xl object-cover"
                    />
                    {editing && (
                      <button className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                        <Camera className="w-8 h-8 text-white" />
                      </button>
                    )}
                  </div>
                  <div className="flex-1">
                    {editing ? (
                      <input
                        type="text"
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        className="text-xl font-display font-bold text-stone-800 border-b-2 border-forest-500 pb-1 w-full"
                      />
                    ) : (
                      <h2 className="text-xl font-display font-bold text-stone-800">{profile.name}</h2>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className={cn(
                        'px-2 py-1 rounded text-xs font-medium',
                        profile.verified
                          ? 'bg-green-100 text-green-700'
                          : 'bg-amber-100 text-amber-700'
                      )}>
                        {profile.verified ? 'Verified' : 'Pending Verification'}
                      </span>
                      <span className={cn(
                        'px-2 py-1 rounded text-xs font-medium',
                        profile.available
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-red-100 text-red-700'
                      )}>
                        {profile.available ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                      <span className="font-semibold">{profile.rating.toFixed(1)}</span>
                      <span className="text-stone-500 text-sm">({profile.review_count} reviews)</span>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Region */}
                  <div>
                    <label className="block text-sm font-medium text-stone-500 mb-1">Region</label>
                    {editing ? (
                      <select
                        value={profile.region}
                        onChange={(e) => setProfile({ ...profile, region: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-stone-300"
                      >
                        {['Solukhumbu', 'Kaski', 'Rasuwa', 'Dolpa', 'Mustang', 'Taplejung', 'Gorkha', 'Mugu'].map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex items-center gap-2 text-stone-700">
                        <MapPin className="w-4 h-4" />
                        {profile.region || 'Not set'}
                      </div>
                    )}
                  </div>

                  {/* Price */}
                  <div>
                    <label className="block text-sm font-medium text-stone-500 mb-1">
                      Price (NPR per {profile.business_type === 'guide' ? 'day' : 'night'})
                    </label>
                    {editing ? (
                      <input
                        type="number"
                        value={profile.price_per_day || profile.price_per_night || ''}
                        onChange={(e) => setProfile({
                          ...profile,
                          price_per_day: parseInt(e.target.value),
                          price_per_night: parseInt(e.target.value),
                        })}
                        className="w-full px-3 py-2 rounded-lg border border-stone-300"
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-stone-700">
                        <DollarSign className="w-4 h-4" />
                        NPR {(profile.price_per_day || profile.price_per_night || 0).toLocaleString()}
                      </div>
                    )}
                  </div>

                  {/* Availability */}
                  {editing && (
                    <div>
                      <label className="block text-sm font-medium text-stone-500 mb-2">Availability</label>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setProfile({ ...profile, available: true })}
                          className={cn(
                            'flex-1 py-2 rounded-lg border font-medium transition-colors',
                            profile.available
                              ? 'bg-green-100 border-green-500 text-green-700'
                              : 'border-stone-300 text-stone-500'
                          )}
                        >
                          Available
                        </button>
                        <button
                          onClick={() => setProfile({ ...profile, available: false })}
                          className={cn(
                            'flex-1 py-2 rounded-lg border font-medium transition-colors',
                            !profile.available
                              ? 'bg-red-100 border-red-500 text-red-700'
                              : 'border-stone-300 text-stone-500'
                          )}
                        >
                          Unavailable
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bio */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-stone-500 mb-1">About</label>
                  {editing ? (
                    <textarea
                      value={profile.description}
                      onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 rounded-lg border border-stone-300"
                      placeholder="Tell travelers about your experience and services..."
                    />
                  ) : (
                    <p className="text-stone-700">{profile.description || 'No description added yet.'}</p>
                  )}
                </div>

                {/* Specialties */}
                {profile.business_type === 'guide' && (
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-stone-500 mb-2">Specialties</label>
                    <div className="flex flex-wrap gap-2">
                      {profile.specialties?.map((s, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-forest-100 text-forest-700 rounded-full text-sm"
                        >
                          {s}
                        </span>
                      ))}
                      {editing && (
                        <button className="px-3 py-1 border-2 border-dashed border-stone-300 rounded-full text-sm text-stone-500 hover:border-forest-500 hover:text-forest-600">
                          + Add
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Save Button */}
                {editing && (
                  <div className="mt-6 pt-6 border-t border-stone-200">
                    <button
                      onClick={() => updateProfile(profile)}
                      className="btn-primary w-full md:w-auto"
                    >
                      Save Changes
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bookings */}
          {activeTab === 'bookings' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-display font-bold text-stone-800">Bookings</h1>
                <p className="text-stone-500">Manage your upcoming and past bookings</p>
              </div>

              <div className="bg-white rounded-xl p-8 border border-stone-200 text-center">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-stone-300" />
                <p className="text-stone-600 font-medium">No bookings yet</p>
                <p className="text-sm text-stone-500 mt-1">
                  Once travelers book your services, they will appear here
                </p>
              </div>
            </div>
          )}

          {/* Reviews */}
          {activeTab === 'reviews' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-display font-bold text-stone-800">Reviews</h1>
                <p className="text-stone-500">See what travelers are saying about you</p>
              </div>

              {profile && profile.review_count > 0 ? (
                <div className="bg-white rounded-xl p-6 border border-stone-200">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-4xl font-display font-bold text-stone-800">
                      {profile.rating.toFixed(1)}
                    </div>
                    <div>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              'w-5 h-5',
                              i < Math.floor(profile.rating)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-stone-300'
                            )}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-stone-500">{profile.review_count} reviews</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl p-8 border border-stone-200 text-center">
                  <Star className="w-12 h-12 mx-auto mb-3 text-stone-300" />
                  <p className="text-stone-600 font-medium">No reviews yet</p>
                  <p className="text-sm text-stone-500 mt-1">
                    Complete your first booking to receive reviews
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
