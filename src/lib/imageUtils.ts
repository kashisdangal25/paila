import { supabase } from './supabase';

// Category-based search query mappings for better image results
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

interface ImageResult {
  image_url: string;
  photographer?: string;
  photographer_url?: string;
  source: string;
}

/**
 * Fetches a real image for a place using the edge function
 * Results are cached in the destinations table
 */
export async function fetchPlaceImage(
  placeId: string,
  placeName: string,
  category: string,
  currentImageUrl?: string | null,
  cachedImageUrl?: string | null
): Promise<string> {
  // If we already have a cached image URL, use it
  if (cachedImageUrl) {
    return cachedImageUrl;
  }

  // If current image is a good Unsplash URL (not a generic placeholder), use it
  if (currentImageUrl && currentImageUrl.includes('images.unsplash.com') && !currentImageUrl.includes('?query=')) {
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

    // Cache the image URL in the database
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
    // Fallback to a themed placeholder based on category
    return getCategoryFallbackImage(category, placeName);
  }
}

/**
 * Returns a fallback image URL based on category
 * Uses Unsplash Source for category-themed images
 */
export function getCategoryFallbackImage(category: string, placeName?: string): string {
  const keywords: Record<string, string> = {
    'Trekking': 'mountains,nepal,himalaya',
    'Hiking': 'hiking,trail,nature',
    'Lake': 'lake,nepal,water',
    'Wildlife': 'wildlife,safari,nature',
    'Adventure': 'adventure,mountains,nepal',
    'Cultural': 'temple,nepal,heritage',
    'Heritage': 'heritage,architecture,nepal',
    'Nature': 'nature,mountains,nepal',
    'Pilgrimage': 'temple,stupa,nepal',
    'City': 'kathmandu,city,nepal',
  };

  const query = keywords[category] || 'nepal,travel,mountains';

  // Use Unsplash source with category keywords
  // This URL pattern returns relevant images without API calls
  return `https://source.unsplash.com/800x600/?${query}`;
}

/**
 * Gets the best available image for a place, fetching if needed
 * This is the main function components should use
 */
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
  // Check cached first
  if (!options?.skipCache && place.cached_image_url) {
    return place.cached_image_url;
  }

  // Use existing image if it's good quality Unsplash
  if (place.image_url && place.image_url.includes('images.unsplash.com')) {
    return place.image_url;
  }

  // Fetch new image
  return fetchPlaceImage(
    place.id,
    place.name,
    place.category,
    place.image_url,
    place.cached_image_url
  );
}
