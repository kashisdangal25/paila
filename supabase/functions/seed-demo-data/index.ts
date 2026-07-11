import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function createUser(email: string, password: string, name: string, userType: string) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "apikey": SERVICE_KEY, "Authorization": `Bearer ${SERVICE_KEY}` },
    body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { name, user_type: userType } }),
  });
  if (res.ok) {
    const data = await res.json();
    return data.id;
  }
  // Try to find existing
  const listRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(email)}`, {
    headers: { "apikey": SERVICE_KEY, "Authorization": `Bearer ${SERVICE_KEY}` },
  });
  const listData = await listRes.json();
  return listData?.users?.[0]?.id || null;
}

async function insertRow(table: string, data: any) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "apikey": SERVICE_KEY, "Authorization": `Bearer ${SERVICE_KEY}`, "Prefer": "return=representation,resolution=ignore-duplicates" },
    body: JSON.stringify(data),
  });
  return res.ok ? await res.json() : null;
}

const NATURE_IMAGES = [
  "https://images.pexels.com/photos/4194617/pexels-photo-4194617.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/1271619/pexels-photo-1271619.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/207615/pexels-photo-207615.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/1488318/pexels-photo-1488318.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/1761279/pexels-photo-1761279.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/2387873/pexels-photo-2387873.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/672532/pexels-photo-672532.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/618833/pexels-photo-618833.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/417173/pexels-photo-417173.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/705776/pexels-photo-705776.jpeg?auto=compress&cs=tinysrgb&w=800",
];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const results: any = { steps: [] };

    // 1. Create demo user
    const demoId = await createUser("demo@paila.com", "Demo@1234", "Demo User", "traveler");
    results.steps.push({ step: "demo_user", id: demoId });

    // 2. Create admin user
    const adminId = await createUser("admin@paila.com", "Admin@1234", "Admin", "traveler");
    if (adminId) {
      await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${adminId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "apikey": SERVICE_KEY, "Authorization": `Bearer ${SERVICE_KEY}` },
        body: JSON.stringify({ name: "Admin" }),
      });
    }
    results.steps.push({ step: "admin_user", id: adminId });

    // 3. Create 5 vendor users and vendor records
    const vendorData = [
      { email: "guide1@paila.com", name: "Pemba Sherpa", business: "Sherpa Trek Guides", type: "guide", location: "Namche Bazaar, Solukhumbu", district: "Solukhumbu", province: "Koshi", desc: "Expert high-altitude trekking guide with 15 years experience on Everest region trails.", langs: ["English","Nepali","Sherpa"], services: ["Trekking Guide","Porter Service"], price: 3500, priceType: "daily" },
      { email: "guide2@paila.com", name: "Mingma Tamang", business: "Annapurna Mountain Guides", type: "guide", location: "Pokhara, Kaski", district: "Kaski", province: "Gandaki", desc: "Certified mountain guide specializing in Annapurna Circuit and ABC trek.", langs: ["English","Nepali","Tamang"], services: ["Trekking Guide","Photography"], price: 3000, priceType: "daily" },
      { email: "stay1@paila.com", name: "Dawa Gurung", business: "Ghorepani Hilltop Homestay", type: "homestay", location: "Ghorepani, Myagdi", district: "Myagdi", province: "Gandaki", desc: "Family-run homestay with stunning mountain views on the Annapurna trek route.", langs: ["English","Nepali","Gurung"], services: ["Accommodation","Cooking"], price: 1500, priceType: "nightly" },
      { email: "stay2@paila.com", name: "Kamala Thapa", business: "Langtang Valley Homestay", type: "homestay", location: "Kyanjin Gompa, Rasuwa", district: "Rasuwa", province: "Bagmati", desc: "Authentic homestay in Langtang Valley with traditional Tibetan meals.", langs: ["English","Nepali","Tamang"], services: ["Accommodation","Cooking"], price: 1200, priceType: "nightly" },
      { email: "guide3@paila.com", name: "Bishnu Magar", business: "Everest Base Camp Expeditions", type: "agency", location: "Kathmandu", district: "Kathmandu", province: "Bagmati", desc: "Full-service trekking agency organizing Everest Base Camp and Annapurna expeditions.", langs: ["English","Nepali","Hindi"], services: ["Trekking Guide","City Tour","Equipment Rental"], price: 25000, priceType: "package" },
    ];

    const vendorIds: string[] = [];
    for (const v of vendorData) {
      const uid = await createUser(v.email, "Vendor@1234", v.name, "vendor");
      if (!uid) continue;

      const pricing: any = {};
      pricing[v.priceType] = v.price;

      const vendorRow = await insertRow("vendors", {
        user_id: uid,
        business_name: v.business,
        business_type: v.type,
        contact_person: v.name,
        phone: "+977 98" + Math.floor(10000000 + Math.random() * 89999999),
        email: v.email,
        location: v.location,
        district: v.district,
        province: v.province,
        description: v.desc,
        years_experience: 5 + Math.floor(Math.random() * 15),
        languages: v.langs,
        services_offered: v.services,
        pricing,
        rating: 4 + Math.random(),
        review_count: Math.floor(Math.random() * 20) + 3,
        cover_photo_url: NATURE_IMAGES[Math.floor(Math.random() * NATURE_IMAGES.length)],
        gallery_urls: [NATURE_IMAGES[Math.floor(Math.random() * NATURE_IMAGES.length)], NATURE_IMAGES[Math.floor(Math.random() * NATURE_IMAGES.length)]],
        status: "approved",
      });
      if (vendorRow && Array.isArray(vendorRow) && vendorRow[0]) {
        vendorIds.push(vendorRow[0].id);
      }
    }
    results.steps.push({ step: "vendors", count: vendorIds.length });

    // 4. Create 10 journal entries
    const journalData = [
      { title: "Sunrise at Annapurna Base Camp", text: "Woke up at 4 AM to hike the final stretch to ABC. The sunrise over the Annapurna massif was absolutely breathtaking — golden light spilling over snow-capped peaks.", mood: "🤩", cat: "Adventure", loc: "Annapurna Base Camp", exp: 3500, date: "2026-06-15" },
      { title: "Homestay in Ghorepani", text: "Spent two nights with a Gurung family. The food was simple but delicious — dal bhat with fresh greens from their garden. They shared stories about the changing trekking seasons.", mood: "😌", cat: "Homestay", loc: "Ghorepani, Myagdi", exp: 2400, date: "2026-06-10" },
      { title: "Rhino sighting in Chitwan", text: "Our jeep safari started at dawn. We were lucky to spot a one-horned rhino grazing by the river. The guide said we were fortunate — sightings aren't guaranteed.", mood: "🤠", cat: "Wildlife", loc: "Chitwan National Park", exp: 5000, date: "2026-05-28" },
      { title: "Prayer flags at Boudhanath", text: "Walked around the stupa spinning prayer wheels with the locals at sunset. The atmosphere was deeply peaceful. Monks were chanting in the nearby monastery.", mood: "🙏", cat: "Culture & Heritage", loc: "Boudhanath, Kathmandu", exp: 500, date: "2026-06-20" },
      { title: "Crossing the Thorong La pass", text: "Started at 3 AM from high camp. The pass at 5416m was the hardest physical challenge of my life. Wind biting, oxygen thin, but the view from the top was worth every step.", mood: "😤", cat: "Adventure", loc: "Thorong La, Annapurna Circuit", exp: 8000, date: "2026-05-15" },
      { title: "Rest day in Namche Bazaar", text: "Acclimatization day. Spent the afternoon drinking lemon ginger tea and watching clouds roll through the valley. The mountains kept appearing and disappearing.", mood: "😴", cat: "Nature", loc: "Namche Bazaar", exp: 1500, date: "2026-04-20" },
      { title: "Milke Danda hidden gem", text: "Took the less-traveled route through Milke Danda. Hardly saw any other trekkers for two days. Wild rhododendron forests in full bloom — red, pink, white as far as the eye could see.", mood: "🤯", cat: "Nature", loc: "Milke Danda", exp: 2000, date: "2026-04-10" },
      { title: "Everest from Kala Patihar", text: "Reached Kala Patihar at 5545m before dawn. Watched the first light hit Everest and Nuptse. Tears came to my eyes — this is why I came to Nepal.", mood: "🤩", cat: "Adventure", loc: "Kala Patihar, Everest Region", exp: 12000, date: "2026-03-28" },
      { title: "Lost in Kathmandu's old city", text: "Wandered the narrow alleys of old Kathmandu for hours. Found hidden courtyards, ancient temples, and a tiny tea shop where I spent the afternoon chatting with locals.", mood: "😌", cat: "Culture & Heritage", loc: "Old Kathmandu", exp: 800, date: "2026-06-22" },
      { title: "Rara Lake perfection", text: "After three days of trekking, Rara Lake appeared like a sapphire in the mountains. Crystal clear water reflecting pine forests and snow peaks. No crowds, just pure nature.", mood: "🙏", cat: "Nature", loc: "Rara Lake, Mugu", exp: 6000, date: "2026-05-05" },
    ];

    let journalCount = 0;
    for (const j of journalData) {
      if (!demoId) continue;
      const img1 = NATURE_IMAGES[Math.floor(Math.random() * NATURE_IMAGES.length)];
      const img2 = NATURE_IMAGES[Math.floor(Math.random() * NATURE_IMAGES.length)];
      await insertRow("journal_entries", {
        user_id: demoId,
        title: j.title,
        text: j.text,
        mood: j.mood,
        category: j.cat,
        location_text: j.loc,
        expense: j.exp,
        entry_date: j.date,
        media_urls: [img1, img2],
        media_url: img1,
        media_type: "image",
        is_public: true,
      });
      journalCount++;
    }
    results.steps.push({ step: "journal_entries", count: journalCount });

    // 5. Create 5 community posts
    const postData = [
      { title: "Annapurna trail condition update", content: "Just finished the Annapurna Circuit. The trail between Manang and Thorong Phedi is clear but there's snow above 5000m. Microspikes recommended. Tea houses are open.", cat: "trail_update", loc: "Annapurna Circuit", user: "Demo User" },
      { title: "Best time for Everest Base Camp?", content: "Planning my EBC trek for next year. Is October or March better? I want clear views but fewer crowds. Any advice from experienced trekkers?", cat: "question", loc: "Everest Region", user: "Demo User" },
      { title: "Packing tips for 14-day trek", content: "After 6 treks in Nepal, here are my essentials: good down jacket (it gets cold above 4000m even in spring), merino base layers, headlamp with extra batteries, water purification tablets, and blister kit. Pack light — you can buy most things in Kathmandu.", cat: "tip", loc: "Nepal", user: "Demo User" },
      { title: "My Everest Base Camp journey", content: "Day 1: Flew to Lukla. The most terrifying and exciting flight of my life. Day 2: Hiked to Namche. Day 3: Rest day, hiked to Everest View Hotel for my first glimpse of the mountain. I'll never forget that moment.", cat: "story", loc: "Everest Base Camp Trek", user: "Demo User" },
      { title: "Sunrise over the Himalayas", content: "Sharing some photos from my sunrise hike to Kala Patihar. The light changes every minute as the sun rises. No camera can truly capture it.", cat: "photo", loc: "Kala Patihar", user: "Demo User" },
    ];

    let postCount = 0;
    for (const p of postData) {
      if (!demoId) continue;
      const img = NATURE_IMAGES[Math.floor(Math.random() * NATURE_IMAGES.length)];
      await insertRow("user_posts", {
        user_id: demoId,
        user_name: p.user,
        title: p.title,
        content: p.content,
        category: p.cat,
        location_text: p.loc,
        media_urls: [img],
        likes: Math.floor(Math.random() * 15),
        author_avatar: null,
      });
      postCount++;
    }
    results.steps.push({ step: "community_posts", count: postCount });

    return new Response(JSON.stringify({ success: true, ...results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message, stack: err.stack }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
