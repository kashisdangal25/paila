import { useState, useEffect } from 'react';
import {
  LayoutDashboard, MapPin, Users, Building2, BookOpen, Settings, ChevronLeft,
  Plus, Edit2, Trash2, Search, Star, Eye, TrendingUp, AlertCircle, LogOut
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { useThemeColors } from '../lib/ThemeContext';
import { cn } from '../lib/utils';

type AdminTab = 'dashboard' | 'destinations' | 'guides' | 'stays' | 'reviews' | 'settings';

interface AdminDashboardProps {
  onExit?: () => void;
}

export function AdminDashboard({ onExit }: AdminDashboardProps) {
  const { user } = useAuth();
  const colors = useThemeColors();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stats, setStats] = useState({
    destinations: 0,
    guides: 0,
    stays: 0,
    reviews: 0,
    users: 0,
    journals: 0,
  });
  const [destinations, setDestinations] = useState<any[]>([]);
  const [guides, setGuides] = useState<any[]>([]);
  const [stays, setStays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editItem, setEditItem] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const menuItems: { id: AdminTab; label: string; icon: any }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'destinations', label: 'Destinations', icon: MapPin },
    { id: 'guides', label: 'Guides', icon: Users },
    { id: 'stays', label: 'Stays', icon: Building2 },
    { id: 'reviews', label: 'Reviews', icon: Star },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [destCount, guideCount, stayCount, reviewCount, userCount, journalCount] = await Promise.all([
        supabase.from('destinations').select('id', { count: 'exact', head: true }),
        supabase.from('guides').select('id', { count: 'exact', head: true }),
        supabase.from('stays').select('id', { count: 'exact', head: true }),
        supabase.from('destination_reviews').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('user_journals').select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        destinations: destCount.count || 0,
        guides: guideCount.count || 0,
        stays: stayCount.count || 0,
        reviews: reviewCount.count || 0,
        users: userCount.count || 0,
        journals: journalCount.count || 0,
      });

      const { data: destData } = await supabase
        .from('destinations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (destData) setDestinations(destData);

      const { data: guideData } = await supabase
        .from('guides')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (guideData) setGuides(guideData);

      const { data: stayData } = await supabase
        .from('stays')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (stayData) setStays(stayData);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteDestination(id: string) {
    if (!confirm('Are you sure you want to delete this destination? This action cannot be undone.')) return;

    const { error } = await supabase.from('destinations').delete().eq('id', id);
    if (!error) {
      setDestinations(destinations.filter(d => d.id !== id));
    }
  }

  async function handleToggleFeatured(id: string, featured: boolean) {
    const { error } = await supabase
      .from('destinations')
      .update({ featured: !featured })
      .eq('id', id);
    if (!error) {
      setDestinations(destinations.map(d =>
        d.id === id ? { ...d, featured: !featured } : d
      ));
    }
  }

  const filteredDestinations = destinations.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.region?.toLowerCase().includes(search.toLowerCase()) ||
    d.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-forest-950 flex">
      {/* Sidebar */}
      <div className={cn(
        'bg-white dark:bg-forest-900 border-r border-stone-200 dark:border-forest-800 transition-all duration-300',
        sidebarOpen ? 'w-64' : 'w-16'
      )}>
        <div className="p-4 flex items-center justify-between border-b border-stone-200 dark:border-forest-800">
          {sidebarOpen && (
            <h1 className="font-display font-bold text-forest-600">
              Paila Admin
            </h1>
          )}
          <div className="flex items-center gap-2">
            {onExit && (
              <button
                onClick={onExit}
                className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-forest-800"
                title="Exit Admin"
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-forest-800"
            >
              <ChevronLeft className={cn('w-5 h-5 transition-transform', !sidebarOpen && 'rotate-180')} />
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
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-forest-800'
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-display font-bold text-stone-800 dark:text-white">Dashboard</h1>
                <p className="text-stone-500 dark:text-stone-400">Overview of Paila platform</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { label: 'Destinations', value: stats.destinations, icon: MapPin, color: 'bg-blue-500' },
                  { label: 'Guides', value: stats.guides, icon: Users, color: 'bg-green-500' },
                  { label: 'Stays', value: stats.stays, icon: Building2, color: 'bg-purple-500' },
                  { label: 'Reviews', value: stats.reviews, icon: Star, color: 'bg-amber-500' },
                  { label: 'Users', value: stats.users, icon: TrendingUp, color: 'bg-pink-500' },
                  { label: 'Journals', value: stats.journals, icon: BookOpen, color: 'bg-red-500' },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-white dark:bg-forest-900 rounded-xl p-4 border border-stone-200 dark:border-forest-800"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={cn('p-2 rounded-lg', stat.color)}>
                        <stat.icon className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="text-2xl font-display font-bold text-stone-800 dark:text-white">
                      {stat.value}
                    </div>
                    <div className="text-sm text-stone-500 dark:text-stone-400">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-forest-900 rounded-xl p-4 border border-stone-200 dark:border-forest-800">
                  <h3 className="font-semibold text-stone-800 dark:text-white mb-4">Latest Destinations</h3>
                  <div className="space-y-3">
                    {destinations.slice(0, 5).map((dest) => (
                      <div key={dest.id} className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-stone-100 dark:bg-forest-800">
                          {dest.image_url && (
                            <img src={dest.image_url} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-stone-800 dark:text-white truncate">{dest.name}</p>
                          <p className="text-xs text-stone-500">{dest.region}</p>
                        </div>
                        {dest.featured && (
                          <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded">Featured</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-forest-900 rounded-xl p-4 border border-stone-200 dark:border-forest-800">
                  <h3 className="font-semibold text-stone-800 dark:text-white mb-4">Active Guides</h3>
                  <div className="space-y-3">
                    {guides.slice(0, 5).map((guide) => (
                      <div key={guide.id} className="flex items-center gap-3">
                        <img
                          src={guide.avatar_url || 'https://via.placeholder.com/40'}
                          alt={guide.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-stone-800 dark:text-white truncate">{guide.name}</p>
                          <p className="text-xs text-stone-500">
                            {guide.specialties?.join(', ') || 'General Guide'}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-amber-500">
                          <Star className="w-3 h-3 fill-amber-500" />
                          {guide.rating?.toFixed(1) || 'N/A'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Destinations Tab */}
          {activeTab === 'destinations' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-display font-bold text-stone-800 dark:text-white">Destinations</h1>
                  <p className="text-stone-500 dark:text-stone-400">Manage all travel destinations</p>
                </div>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="btn-primary flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Destination
                </button>
              </div>

              {/* Search */}
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search destinations..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 dark:border-forest-700 bg-white dark:bg-forest-900 text-stone-800 dark:text-white"
                />
              </div>

              {/* Destinations Table */}
              <div className="bg-white dark:bg-forest-900 rounded-xl border border-stone-200 dark:border-forest-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-stone-50 dark:bg-forest-800">
                      <tr>
                        <th className="text-left p-4 text-sm font-medium text-stone-500 dark:text-stone-400">Destination</th>
                        <th className="text-left p-4 text-sm font-medium text-stone-500 dark:text-stone-400">Region</th>
                        <th className="text-left p-4 text-sm font-medium text-stone-500 dark:text-stone-400">Category</th>
                        <th className="text-left p-4 text-sm font-medium text-stone-500 dark:text-stone-400">Difficulty</th>
                        <th className="text-left p-4 text-sm font-medium text-stone-500 dark:text-stone-400">Rating</th>
                        <th className="text-left p-4 text-sm font-medium text-stone-500 dark:text-stone-400">Featured</th>
                        <th className="text-right p-4 text-sm font-medium text-stone-500 dark:text-stone-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200 dark:divide-forest-800">
                      {filteredDestinations.map((dest) => (
                        <tr key={dest.id} className="hover:bg-stone-50 dark:hover:bg-forest-800/50">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-lg overflow-hidden bg-stone-100 dark:bg-forest-800">
                                {dest.image_url && (
                                  <img src={dest.image_url} alt="" className="w-full h-full object-cover" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-stone-800 dark:text-white">{dest.name}</p>
                                <p className="text-xs text-stone-500">{dest.elevation_m?.toLocaleString() || '-'}m</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-stone-600 dark:text-stone-300">{dest.region || '-'}</td>
                          <td className="p-4">
                            <span className="px-2 py-1 bg-forest-100 dark:bg-forest-700 text-forest-700 dark:text-forest-200 text-xs rounded">
                              {dest.category || '-'}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={cn(
                              'px-2 py-1 text-xs rounded',
                              dest.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                              dest.difficulty === 'Moderate' ? 'bg-amber-100 text-amber-700' :
                              'bg-red-100 text-red-700'
                            )}>
                              {dest.difficulty || '-'}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                              <span className="text-stone-600 dark:text-stone-300">{dest.rating || '-'}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => handleToggleFeatured(dest.id, dest.featured)}
                              className={cn(
                                'px-3 py-1 rounded text-xs font-medium transition-colors',
                                dest.featured
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-stone-100 text-stone-600 hover:bg-amber-100'
                              )}
                            >
                              {dest.featured ? 'Featured' : 'Add'}
                            </button>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-forest-700">
                                <Eye className="w-4 h-4 text-stone-500" />
                              </button>
                              <button className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-forest-700">
                                <Edit2 className="w-4 h-4 text-stone-500" />
                              </button>
                              <button
                                onClick={() => handleDeleteDestination(dest.id)}
                                className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredDestinations.length === 0 && (
                  <div className="text-center py-8">
                    <MapPin className="w-12 h-12 mx-auto mb-2 text-stone-300" />
                    <p className="text-stone-500">No destinations found</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Guides Tab */}
          {activeTab === 'guides' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-display font-bold text-stone-800 dark:text-white">Guides</h1>
                  <p className="text-stone-500 dark:text-stone-400">Manage licensed local guides</p>
                </div>
                <button className="btn-primary flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Add Guide
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {guides.map((guide) => (
                  <div
                    key={guide.id}
                    className="bg-white dark:bg-forest-900 rounded-xl p-4 border border-stone-200 dark:border-forest-800"
                  >
                    <div className="flex items-start gap-4">
                      <img
                        src={guide.avatar_url || 'https://via.placeholder.com/60'}
                        alt={guide.name}
                        className="w-14 h-14 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-stone-800 dark:text-white">{guide.name}</h3>
                          {guide.verified && (
                            <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">Verified</span>
                          )}
                        </div>
                        <p className="text-sm text-stone-500">{guide.region}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                          <span className="text-sm text-stone-600 dark:text-stone-300">
                            {guide.rating?.toFixed(1)} ({guide.review_count})
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-3">
                      {guide.specialties?.slice(0, 3).map((s: string) => (
                        <span
                          key={s}
                          className="px-2 py-0.5 bg-forest-100 dark:bg-forest-700 text-forest-700 dark:text-forest-200 text-xs rounded"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-stone-200 dark:border-forest-700">
                      <span className={cn(
                        'px-2 py-1 text-xs rounded',
                        guide.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      )}>
                        {guide.available ? 'Available' : 'Unavailable'}
                      </span>
                      <span className="font-semibold text-stone-800 dark:text-white">
                        NPR {guide.price_per_day?.toLocaleString()}/day
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stays Tab */}
          {activeTab === 'stays' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-display font-bold text-stone-800 dark:text-white">Stays</h1>
                  <p className="text-stone-500 dark:text-stone-400">Manage accommodations</p>
                </div>
                <button className="btn-primary flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Add Stay
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stays.map((stay) => (
                  <div
                    key={stay.id}
                    className="bg-white dark:bg-forest-900 rounded-xl overflow-hidden border border-stone-200 dark:border-forest-800"
                  >
                    <div className="h-40 bg-stone-100 dark:bg-forest-800">
                      {stay.image_url && (
                        <img src={stay.image_url} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-stone-800 dark:text-white">{stay.name}</h3>
                          <p className="text-sm text-stone-500">{stay.location}</p>
                        </div>
                        <span className={cn(
                          'px-2 py-0.5 text-xs rounded',
                          stay.type === 'homestay' ? 'bg-blue-100 text-blue-700' :
                          stay.type === 'hotel' ? 'bg-purple-100 text-purple-700' :
                          'bg-green-100 text-green-700'
                        )}>
                          {stay.type}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-stone-200 dark:border-forest-700">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                          <span className="text-sm">{stay.rating || '-'}</span>
                        </div>
                        <span className="font-semibold text-forest-600">
                          NPR {stay.price_per_night?.toLocaleString()}/night
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-display font-bold text-stone-800 dark:text-white">Settings</h1>
                <p className="text-stone-500 dark:text-stone-400">Manage platform settings</p>
              </div>

              <div className="bg-white dark:bg-forest-900 rounded-xl p-6 border border-stone-200 dark:border-forest-800">
                <h3 className="font-semibold text-stone-800 dark:text-white mb-4">Database Actions</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-stone-50 dark:bg-forest-800">
                    <div>
                      <p className="font-medium text-stone-800 dark:text-white">Refresh Destination Data</p>
                      <p className="text-sm text-stone-500">Update elevation, coordinates and scores</p>
                    </div>
                    <button className="btn-secondary">Refresh</button>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-stone-50 dark:bg-forest-800">
                    <div>
                      <p className="font-medium text-stone-800 dark:text-white">Export Database</p>
                      <p className="text-sm text-stone-500">Download all data as JSON</p>
                    </div>
                    <button className="btn-secondary">Export</button>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
                    <div>
                      <p className="font-medium text-red-800 dark:text-red-300">Clear Demo Data</p>
                      <p className="text-sm text-red-600 dark:text-red-400">Remove all test entries</p>
                    </div>
                    <button className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600">
                      Clear
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-forest-900 rounded-xl p-6 border border-stone-200 dark:border-forest-800">
                <h3 className="font-semibold text-stone-800 dark:text-white mb-4">Admin Info</h3>
                <div className="space-y-2 text-sm">
                  <p className="text-stone-600 dark:text-stone-300">
                    <span className="font-medium">Email:</span> {user?.email}
                  </p>
                  <p className="text-stone-600 dark:text-stone-300">
                    <span className="font-medium">User ID:</span> {user?.id}
                  </p>
                  <p className="text-stone-600 dark:text-stone-300">
                    <span className="font-medium">Role:</span> Administrator
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-display font-bold text-stone-800 dark:text-white">Reviews</h1>
                <p className="text-stone-500 dark:text-stone-400">Manage user reviews</p>
              </div>

              <div className="bg-white dark:bg-forest-900 rounded-xl p-8 border border-stone-200 dark:border-forest-800 text-center">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 text-stone-300" />
                <p className="text-stone-500">Reviews will appear here once users start submitting them</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
