import { supabase } from './supabase';

const categoryQueries: Record<string, string> = {
  'Trekking': 'Nepal Himalaya mountains trekking',
  'Hiking': 'Nepal hiking trails nature',
  'Lake': 'Nepal lakes Phewa Rara',
  'Wildlife': 'Nepal wildlife Chitwan rhino tiger',
  'Adventure': 'Nepal adventure paragliding bungee',
  'Cultural': 'Nepal temples heritage architecture',
  'Heritage': 'Nepal heritage temples durbar square',
  'Nature': 'Nepal nature mountains landscape',
  'Pilgrimage': 'Nepal pilgrimage temple stupa',
  'City': 'Nepal Kathmandu city streets',
};

// Reliable fallback images per category (Pexels CDN - these are permanent URLs)
// All images are Nepal-specific and match category theme (NATURE, CULTURE, PEOPLE EXPLORING)
const fallbackImages: Record<string, string> = {
  'Trekking': 'https://images.pexels.com/photos/4194617/pexels-photo-4194617.jpeg?auto=compress&cs=tinysrgb&w=800', // Mountain vista
  'Hiking': 'https://images.pexels.com/photos/1271619/pexels-photo-1271619.jpeg?auto=compress&cs=tinysrgb&w=800', // Person hiking on trail
  'Lake': 'https://images.pexels.com/photos/3593922/pexels-photo-3593922.jpeg?auto=compress&cs=tinysrgb&w=800', // Phewa Lake with mountain reflection
  'Wildlife': 'https://images.pexels.com/photos/162240/rhino-pexels-photo-162240.jpeg?auto=compress&cs=tinysrgb&w=800', // Rhino in nature
  'Adventure': 'https://images.pexels.com/photos/2387873/pexels-photo-2387873.jpeg?auto=compress&cs=tinysrgb&w=800', // Paragliding over mountains
  'Cultural': 'https://images.pexels.com/photos/161853/nepal-kathmandu-boudhanath-buddhism-161853.jpeg?auto=compress&cs=tinysrgb&w=800', // Boudhanath Stupa
  'Heritage': 'https://images.pexels.com/photos/161853/nepal-kathmandu-boudhanath-buddhism-161853.jpeg?auto=compress&cs=tinysrgb&w=800', // Heritage site
  'Nature': 'https://images.pexels.com/photos/4194617/pexels-photo-4194617.jpeg?auto=compress&cs=tinysrgb&w=800', // Mountain nature
  'Pilgrimage': 'https://images.pexels.com/photos/161853/nepal-kathmandu-boudhanath-buddhism-161853.jpeg?auto=compress&cs=tinysrgb&w=800', // Religious site
  'City': 'https://images.pexels.com/photos/3593922/pexels-photo-3593922.jpeg?auto=compress&cs=tinysrgb&w=800', // Scenic lake view
};

const defaultFallback = 'https://images.pexels.com/photos/4194617/pexels-photo-4194617.jpeg?auto=compress&cs=tinysrgb&w=800';

interface ImageResult {
  image_url: string;
  photographer?: string;
  photographer_url?: string;
  source: string;
}

export async function fetchPlaceImage(
  placeId: string,
  placeName: string,
  category: string,
  currentImageUrl?: string | null,
  cachedImageUrl?: string | null
): Promise<string> {
  if (cachedImageUrl) {
    return cachedImageUrl;
  }

  if (currentImageUrl && currentImageUrl.includes('images.unsplash.com') && !currentImageUrl.includes('?query=')) {
    return currentImageUrl;
  }

  if (currentImageUrl && currentImageUrl.includes('images.pexels.com')) {
    return currentImageUrl;
  }

  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const response = await fetch(
      `${supabaseUrl}/functions/v1/fetch-place-image?place=${encodeURIComponent(placeName)}&category=${encodeURIComponent(category)}`,
      {
        headers: {
          Authorization: `Bearer ${anonKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch image');
    }

    const data: ImageResult = await response.json();

    if (placeId && data.image_url) {
      await supabase
        .from('destinations')
        .update({
          cached_image_url: data.image_url,
          image_search_query: `${categoryQueries[category] || 'Nepal travel'} ${placeName}`
        })
        .eq('id', placeId);
    }

    return data.image_url;
  } catch (error) {
    console.error('Error fetching place image:', error);
    return getCategoryFallbackImage(category);
  }
}

export function getCategoryFallbackImage(category: string): string {
  return fallbackImages[category] || defaultFallback;
}

export async function getPlaceImage(
  place: {
    id: string;
    name: string;
    category: string;
    image_url: string | null;
    cached_image_url?: string | null;
  },
  options?: { skipCache?: boolean }
): Promise<string> {
  if (!options?.skipCache && place.cached_image_url) {
    return place.cached_image_url;
  }

  if (place.image_url && place.image_url.includes('images.unsplash.com')) {
    return place.image_url;
  }

  if (place.image_url && place.image_url.includes('images.pexels.com')) {
    return place.image_url;
  }

  return fetchPlaceImage(
    place.id,
    place.name,
    place.category,
    place.image_url,
    place.cached_image_url
  );
}
