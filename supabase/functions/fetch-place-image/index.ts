import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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

// Reliable fallback images per category (Pexels stock photos, direct CDN URLs)
const fallbackImages: Record<string, string> = {
  'Trekking': 'https://images.pexels.com/photos/4194617/pexels-photo-4194617.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Hiking': 'https://images.pexels.com/photos/1271619/pexels-photo-1271619.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Lake': 'https://images.pexels.com/photos/3593922/pexels-photo-3593922.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Wildlife': 'https://images.pexels.com/photos/247431/pexels-photo-247431.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Adventure': 'https://images.pexels.com/photos/1271619/pexels-photo-1271619.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Cultural': 'https://images.pexels.com/photos/161853/nepal-kathmandu-boudhanath-buddhism-161853.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Heritage': 'https://images.pexels.com/photos/161853/nepal-kathmandu-boudhanath-buddhism-161853.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Nature': 'https://images.pexels.com/photos/4194617/pexels-photo-4194617.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Pilgrimage': 'https://images.pexels.com/photos/161853/nepal-kathmandu-boudhanath-buddhism-161853.jpeg?auto=compress&cs=tinysrgb&w=800',
  'City': 'https://images.pexels.com/photos/3593922/pexels-photo-3593922.jpeg?auto=compress&cs=tinysrgb&w=800',
};

const defaultFallback = 'https://images.pexels.com/photos/4194617/pexels-photo-4194617.jpeg?auto=compress&cs=tinysrgb&w=800';

function buildSearchQuery(placeName: string, category: string): string {
  const categoryPrefix = categoryQueries[category] || 'Nepal travel';
  return `${categoryPrefix} ${placeName}`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const placeName = url.searchParams.get('place');
    const category = url.searchParams.get('category') || 'Nature';

    if (!placeName) {
      return new Response(
        JSON.stringify({ error: 'Missing place parameter' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const searchQuery = buildSearchQuery(placeName, category);

    // Try Pexels API first
    const pexelsApiKey = Deno.env.get('PEXELS_API_KEY');

    if (pexelsApiKey) {
      try {
        const pexelsResponse = await fetch(
          `https://api.pexels.com/v1/search?query=${encodeURIComponent(searchQuery)}&per_page=3&orientation=landscape`,
          {
            headers: {
              'Authorization': pexelsApiKey,
            },
          }
        );

        if (pexelsResponse.ok) {
          const data = await pexelsResponse.json();

          if (data.photos && data.photos.length > 0) {
            const photo = data.photos[0];
            return new Response(
              JSON.stringify({
                image_url: photo.src.large,
                photographer: photo.photographer,
                photographer_url: photo.photographer_url,
                source: 'pexels'
              }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }
      } catch (err) {
        console.error('Pexels API error:', err);
      }
    }

    // Fallback: use a reliable static Pexels image based on category
    const fallbackUrl = fallbackImages[category] || defaultFallback;

    return new Response(
      JSON.stringify({
        image_url: fallbackUrl,
        photographer: 'Pexels',
        photographer_url: 'https://pexels.com',
        source: 'fallback'
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error('Error fetching image:', err);
    return new Response(
      JSON.stringify({
        image_url: defaultFallback,
        source: 'error-fallback'
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
