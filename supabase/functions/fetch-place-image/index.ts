import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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

// Build search query from place name and category
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
            // Use the medium size image (good balance of quality and size)
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

    // Fallback: Use Unsplash Source API (no API key needed, but less reliable)
    // This creates a themed URL that selects relevant images
    const keywords = searchQuery.split(' ').slice(0, 3).join(',');
    const fallbackUrl = `https://source.unsplash.com/800x600/?${encodeURIComponent(keywords)}`;

    return new Response(
      JSON.stringify({
        image_url: fallbackUrl,
        photographer: 'Unsplash',
        photographer_url: 'https://unsplash.com',
        source: 'unsplash'
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error('Error fetching image:', err);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch image' }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
