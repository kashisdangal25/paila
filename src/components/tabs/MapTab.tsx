import { useEffect, useState, useRef } from 'react';
import { Search, Navigation as NavIcon, Star, Heart } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useSaved } from '../../lib/useSaved';
import { useThemeColors } from '../../lib/ThemeContext';
import { cn } from '../../lib/utils';
import { DestinationDetail } from './DestinationDetail';

// Extend Window for Leaflet
declare global {
  interface Window {
    L: any;
  }
}

interface MapPlace {
  id: string;
  name: string;
  type: 'destination' | 'hidden_gem' | 'stay' | 'guide' | 'vendor';
  lat: number;
  lng: number;
  image_url?: string;
  rating?: number;
  region?: string;
  category?: string;
  difficulty?: string;
}

// Real Nepal GPS coordinates
const NEPAL_COORDS: Record<string, [number, number]> = {
  'Annapurna Base Camp': [28.5303, 83.8769],
  'Everest Base Camp': [28.0026, 86.8528],
  'Phewa Lake': [28.2096, 83.9556],
  'Pokhara': [28.2096, 83.9856],
  'Kathmandu': [27.7172, 85.3240],
  'Chitwan National Park': [27.5291, 84.3542],
  'Rara Lake': [29.5278, 82.0856],
  'Poon Hill': [28.3964, 83.6906],
  'Langtang Valley': [28.2136, 85.5639],
  'Lumbini': [27.4833, 83.2764],
  'Nagarkot': [27.7167, 85.5167],
  'Khopra Ridge': [28.4386, 83.6083],
  'Ghandruk': [28.3833, 83.8167],
  'Bandipur': [27.9167, 84.2500],
  'Bhaktapur': [27.6710, 85.4298],
  'Patan': [27.6644, 85.3188],
  'Namche Bazaar': [27.8036, 86.7211],
  'Tengboche': [27.6944, 86.8461],
  'Mardi Himal': [28.3947, 83.8531],
  'Panchase': [28.2086, 83.8503],
  'Tansen': [27.8667, 83.5500],
  'Gorkha': [28.0000, 84.6333],
  'Ilam': [26.9167, 87.9167],
  'Janakpur': [26.7167, 85.9333],
  'Mustang': [28.9969, 83.8453],
  'Dolpa': [28.9167, 82.8000],
  'Manang': [28.5500, 84.0167],
};

const filterChips = [
  { id: 'all', name: 'All', icon: '🗺️' },
  { id: 'destination', name: 'Trekking', icon: '🏔️' },
  { id: 'hidden_gem', name: 'Hidden', icon: '💎' },
  { id: 'stay', name: 'Stays', icon: '🏨' },
  { id: 'guide', name: 'Guides', icon: '👤' },
  { id: 'vendor', name: 'Services', icon: '🏪' },
];

export function MapTab() {
  const colors = useThemeColors();
  const { isSaved, toggleSave } = useSaved();
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<any[]>([]);

  const [places, setPlaces] = useState<MapPlace[]>([]);
  const [filteredPlaces, setFilteredPlaces] = useState<MapPlace[]>([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedPlace, setSelectedPlace] = useState<MapPlace | null>(null);
  const [viewingDestination, setViewingDestination] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Show destination detail
  if (viewingDestination) {
    return <DestinationDetail destinationId={viewingDestination} onBack={() => setViewingDestination(null)} />;
  }

  // Fetch all map data
  useEffect(() => {
    async function fetchMapData() {
      setLoading(true);
      const allPlaces: MapPlace[] = [];

      // Destinations
      const { data: destinations } = await supabase
        .from('destinations')
        .select('id, name, category, region, image_url, rating, difficulty')
        .not('latitude', 'is', null);

      if (destinations) {
        destinations.forEach((d) => {
          const coords = NEPAL_COORDS[d.name] || [28.3949 + (Math.random() - 0.5) * 2, 84.1240 + (Math.random() - 0.5) * 2];
          allPlaces.push({
            id: d.id,
            name: d.name,
            type: 'destination',
            lat: coords[0],
            lng: coords[1],
            image_url: d.image_url,
            rating: Number(d.rating) || 0,
            region: d.region,
            category: d.category,
            difficulty: d.difficulty,
          });
        });
      }

      // Hidden gems
      const { data: gems } = await supabase
        .from('hidden_gems')
        .select('id, name, region, image_url, nature_score');

      if (gems) {
        gems.forEach((g, i) => {
          const coords = NEPAL_COORDS[g.name] || [27.5 + i * 0.3, 83.5 + i * 0.2];
          allPlaces.push({
            id: g.id,
            name: g.name,
            type: 'hidden_gem',
            lat: coords[0],
            lng: coords[1],
            image_url: g.image_url,
            rating: Number(g.nature_score) || 4.5,
            region: g.region,
          });
        });
      }

      // Stays
      const { data: stays } = await supabase
        .from('stays')
        .select('id, name, region, location, image_url, rating');

      if (stays) {
        stays.forEach((s, i) => {
          const coords = NEPAL_COORDS[s.name] || NEPAL_COORDS[s.location] || [28.0 + i * 0.15, 84.0 + i * 0.1];
          allPlaces.push({
            id: s.id,
            name: s.name,
            type: 'stay',
            lat: coords[0],
            lng: coords[1],
            image_url: s.image_url,
            rating: Number(s.rating) || 0,
            region: s.region || s.location,
          });
        });
      }

      // Guides
      const { data: guides } = await supabase
        .from('guides')
        .select('id, name, avatar_url, rating, region')
        .eq('available', true);

      if (guides) {
        guides.forEach((g, i) => {
          const coords = NEPAL_COORDS[g.region] || [28.2096, 83.9856];
          allPlaces.push({
            id: g.id,
            name: g.name,
            type: 'guide',
            lat: coords[0] + (i * 0.02),
            lng: coords[1] + (i * 0.02),
            image_url: g.avatar_url,
            rating: Number(g.rating) || 0,
            region: g.region,
          });
        });
      }

      // Vendors (approved businesses)
      const { data: vendors } = await supabase
        .from('vendors')
        .select('id, business_name, business_type, location, district, status')
        .eq('status', 'approved');

      if (vendors) {
        vendors.forEach((v, i) => {
          const coords = NEPAL_COORDS[v.location] || NEPAL_COORDS[v.district] || [28.0 + i * 0.1, 84.0 + i * 0.1];
          allPlaces.push({
            id: v.id,
            name: v.business_name,
            type: 'vendor',
            lat: coords[0],
            lng: coords[1],
            region: v.location || v.district,
            category: v.business_type,
          });
        });
      }

      setPlaces(allPlaces);
      setFilteredPlaces(allPlaces);
      setLoading(false);
    }

    fetchMapData();
  }, []);

  // Filter places
  useEffect(() => {
    let filtered = places;

    if (activeFilter !== 'all') {
      filtered = filtered.filter(p => p.type === activeFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.region?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredPlaces(filtered);

    // Update map markers
    if (mapRef.current) {
      markersRef.current.forEach(m => mapRef.current.removeLayer(m));
      markersRef.current = [];

      filtered.forEach(place => {
        const marker = createMarker(place);
        marker.addTo(mapRef.current);
        markersRef.current.push(marker);
      });
    }
  }, [activeFilter, searchQuery, places]);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || !window.L) return;

    const L = window.L;

    // Create map centered on Nepal
    const map = L.map(mapContainerRef.current, {
      center: [28.3949, 84.1240],
      zoom: 7,
      zoomControl: false,
    });

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    // Add markers after map is ready
    setTimeout(() => {
      filteredPlaces.forEach(place => {
        const marker = createMarker(place);
        marker.addTo(map);
        markersRef.current.push(marker);
      });
    }, 100);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [loading]);

  // Create marker function
  function createMarker(place: MapPlace) {
    const L = window.L;

    const iconColor =
      place.type === 'destination' ? '#2D6A4F' :
      place.type === 'hidden_gem' ? '#9B59B6' :
      place.type === 'stay' ? '#0D9488' :
      place.type === 'guide' ? '#F59E0B' : '#E8A820';

    const icon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="
        width: 32px;
        height: 32px;
        background: ${iconColor};
        border: 3px solid #fff;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      "><span style="transform: rotate(45deg); font-size: 12px;">${
        place.type === 'destination' ? '🏔️' :
        place.type === 'hidden_gem' ? '💎' :
        place.type === 'stay' ? '🏨' :
        place.type === 'guide' ? '👤' : '🏪'
      }</span></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });

    const marker = L.marker([place.lat, place.lng], { icon });

    // Popup content
    const popupContent = `
      <div style="width:200px;font-family:'Plus Jakarta Sans',sans-serif">
        ${place.image_url ? `<img src="${place.image_url}" style="width:100%;height:90px;object-fit:cover;border-radius:8px;margin-bottom:8px" alt="${place.name}">` : ''}
        <div style="font-weight:700;font-size:14px;color:#1B4332;margin-bottom:4px">${place.name}</div>
        ${place.region ? `<div style="font-size:12px;color:#666;margin-bottom:6px">📍 ${place.region}</div>` : ''}
        <div style="display:flex;gap:4px;margin-bottom:8px">
          <span style="background:#D8F3DC;color:#2D6A4F;font-size:10px;font-weight:600;padding:2px 8px;border-radius:12px">${place.type.replace('_', ' ')}</span>
          ${place.rating ? `<span style="color:#F59E0B;font-size:12px;font-weight:600">★ ${place.rating}</span>` : ''}
        </div>
        <button onclick="window.pailaSelectPlace && window.pailaSelectPlace('${place.id}')" style="width:100%;background:#2D6A4F;color:#fff;border:none;border-radius:8px;padding:8px;font-size:12px;font-weight:600;cursor:pointer">View Details</button>
      </div>
    `;

    marker.bindPopup(popupContent);

    return marker;
  }

  // Global function for popup button
  useEffect(() => {
    (window as any).pailaSelectPlace = (id: string) => {
      const place = places.find(p => p.id === id);
      if (place) {
        setSelectedPlace(place);
        if (place.type === 'destination') {
          setViewingDestination(place.id);
        }
      }
    };
    return () => { delete (window as any).pailaSelectPlace; };
  }, [places]);

  // Fly to place when selected from bottom drawer
  const flyToPlace = (place: MapPlace) => {
    if (mapRef.current) {
      mapRef.current.flyTo([place.lat, place.lng], 12, { duration: 1.2 });
      setSelectedPlace(place);
    }
  };

  // My Location
  const handleMyLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          if (mapRef.current) {
            mapRef.current.flyTo([latitude, longitude], 13, { duration: 1.5 });

            const L = window.L;
            L.marker([latitude, longitude], {
              icon: L.divIcon({
                className: 'user-location',
                html: `<div style="
                  width: 20px;
                  height: 20px;
                  background: #3B82F6;
                  border: 3px solid #fff;
                  border-radius: 50%;
                  box-shadow: 0 0 0 8px rgba(59,130,246,0.2);
                "></div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10],
              })
            }).addTo(mapRef.current).bindPopup('📍 You are here').openPopup();
          }
        },
        () => alert('Location access denied. Enable location in browser settings.')
      );
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] animate-fade-in">
      {/* Search + Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search places..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-forest-500"
          />
        </div>

        {/* Filter chips */}
        {filterChips.map((chip) => (
          <button
            key={chip.id}
            onClick={() => setActiveFilter(chip.id)}
            className={cn(
              'px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 transition-all',
              activeFilter === chip.id
                ? 'bg-forest-600 text-white'
                : 'bg-white border border-stone-200 text-stone-700 hover:bg-forest-50'
            )}
          >
            <span>{chip.icon}</span>
            <span className="hidden sm:inline">{chip.name}</span>
          </button>
        ))}
      </div>

      {/* Map Container */}
      <div className="relative flex-1 rounded-xl overflow-hidden">
        {/* Map */}
        <div
          ref={mapContainerRef}
          id="pailaMap"
          style={{ width: '100%', height: '100%', zIndex: 1 }}
          className="rounded-xl"
        />

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-forest-200 border-t-forest-600 rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-stone-600">Loading map...</p>
            </div>
          </div>
        )}

        {/* My Location Button */}
        <button
          onClick={handleMyLocation}
          className="absolute top-4 right-4 z-20 px-3 py-2 rounded-xl bg-white border border-stone-200 shadow-md flex items-center gap-2 text-sm font-medium text-forest-700 hover:bg-forest-50 transition-colors"
        >
          <NavIcon className="w-4 h-4" />
          <span className="hidden sm:inline">My Location</span>
        </button>

        {/* Place count */}
        {!loading && (
          <div className="absolute bottom-20 left-4 z-20 px-3 py-1.5 rounded-lg bg-white/90 backdrop-blur-sm text-xs font-medium text-stone-600 shadow">
            {filteredPlaces.length} places
          </div>
        )}
      </div>

      {/* Bottom Drawer - Horizontal scroll of cards */}
      <div className="mt-4 -mx-4 px-4">
        <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
          {filteredPlaces.slice(0, 20).map((place) => (
            <button
              key={place.id}
              onClick={() => flyToPlace(place)}
              className={cn(
                'flex-shrink-0 w-[160px] snap-start rounded-xl overflow-hidden border-2 transition-all',
                selectedPlace?.id === place.id
                  ? 'border-forest-500 ring-2 ring-forest-200'
                  : 'border-transparent hover:border-stone-200'
              )}
            >
              <div className="relative h-24 bg-stone-100">
                {place.image_url ? (
                  <img src={place.image_url} alt={place.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-forest-100">
                    <span className="text-2xl">
                      {place.type === 'destination' ? '🏔️' :
                       place.type === 'hidden_gem' ? '💎' :
                       place.type === 'stay' ? '🏨' :
                       place.type === 'guide' ? '👤' : '🏪'}
                    </span>
                  </div>
                )}
                {/* Save button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSave(
                      place.type === 'hidden_gem' ? 'hidden_gem' :
                      place.type === 'stay' ? 'stay' :
                      place.type === 'guide' ? 'guide' : 'destination',
                      place.id
                    );
                  }}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center"
                >
                  <Heart className={cn(
                    'w-3.5 h-3.5 transition-colors',
                    isSaved(
                      place.type === 'hidden_gem' ? 'hidden_gem' :
                      place.type === 'stay' ? 'stay' :
                      place.type === 'guide' ? 'guide' : 'destination',
                      place.id
                    ) ? 'fill-red-500 text-red-500' : 'text-stone-400'
                  )} />
                </button>
              </div>
              <div className="p-2 text-left">
                <p className="text-xs font-semibold text-stone-900 truncate">{place.name}</p>
                <div className="flex items-center gap-1 mt-1">
                  {place.rating ? (
                    <span className="flex items-center gap-0.5 text-xs text-amber-600">
                      <Star className="w-3 h-3 fill-amber-500" />
                      {place.rating}
                    </span>
                  ) : null}
                  {place.region && (
                    <span className="text-[10px] text-stone-500 truncate">{place.region}</span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
