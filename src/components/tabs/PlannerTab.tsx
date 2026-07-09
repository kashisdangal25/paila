import { useState, useEffect } from 'react';
import {
  Calendar, MapPin, Users, Wallet, TrendingUp, ChevronRight, Sparkles, List, Clock, Cloud, Utensils, Bed, Compass, Save, RefreshCw, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { useI18n } from '../../lib/i18n';
import { useThemeColors } from '../../lib/ThemeContext';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';

interface TripParams {
  destination: number;
  duration: number;
  budget: number;
  travelers: number;
  fitness: number;
}

interface DayActivity {
  day: number;
  date: string;
  title: string;
  activities: string[];
  meals: { breakfast: string; lunch: string; dinner: string };
  accommodation: string;
  tips: string[];
  cost: number;
}

interface GeneratedItinerary {
  destination: any;
  days: DayActivity[];
  totalCost: number;
  perPersonCost: number;
  highlights: string[];
  packingList: string[];
  warnings: string[];
}

const tripOptions = {
  destinations: [
    { id: 'annapurna-base-camp', name: 'Annapurna Base Camp' },
    { id: 'mardi-himal', name: 'Mardi Himal' },
    { id: 'poon-hill', name: 'Ghorepani Poon Hill' },
    { id: 'langtang-valley', name: 'Langtang Valley' },
    { id: 'everest-base-camp', name: 'Everest Base Camp' },
    { id: 'upper-mustang', name: 'Upper Mustang' },
  ],
  durations: ['3 Days', '5 Days', '7 Days', '10 Days', '14 Days'],
  budgets: [
    { id: 'budget', name: 'Budget', perDay: 1500 },
    { id: 'mid', name: 'Mid-range', perDay: 3000 },
    { id: 'premium', name: 'Premium', perDay: 5000 },
    { id: 'luxury', name: 'Luxury', perDay: 10000 },
  ],
  travelers: ['Solo', 'Couple', 'Family (3-4)', 'Group (5+)'],
  fitness: ['Easy', 'Moderate', 'Challenging', 'Strenuous'],
};

const itineraryTemplates: Record<string, Record<string, any[]>> = {
  'annapurna-base-camp': {
    '5 Days': [
      { day: 1, title: 'Arrival & Preparation', activities: ['Arrive in Pokhara', 'Trek briefing and gear check', 'Permit processing', 'Lakeside exploration'], accommodation: 'Hotel in Pokhara', cost: 2500 },
      { day: 2, title: 'Drive to Kimche & Trek to Sinuwa', activities: ['Jeep to Kimche (1.5 hrs)', 'Trek to Chomrong (2 hrs)', 'Descend to Chomrong Khola', 'Climb to Sinuwa'], accommodation: 'Teahouse in Sinuwa', cost: 3500 },
      { day: 3, title: 'Trek to Deurali', activities: ['Trek through bamboo forest', 'Pass Himalaya Hotel', 'Reach Deurali (3200m)', 'Acclimatization walk'], accommodation: 'Teahouse in Deurali', cost: 3500 },
      { day: 4, title: 'Annapurna Sanctuary Day', activities: ['Early morning trek to ABC', 'Reach Base Camp (4130m)', 'Photography session', 'Descend to Bamboo'], accommodation: 'Teahouse in Bamboo', cost: 3500 },
      { day: 5, title: 'Return & Celebration', activities: ['Trek to Jhinu Danda', 'Hot springs relaxation', 'Descend to Siwi', 'Drive to Pokhara'], accommodation: 'Hotel in Pokhara', cost: 3000 },
    ],
    '7 Days': [
      { day: 1, title: 'Pokhara Arrival', activities: ['Arrive in Pokhara', 'Trek briefing and gear rental', 'Rent sleeping bag if needed', 'Sunrise Point visit'], accommodation: 'Lakeside Hotel', cost: 2800 },
      { day: 2, title: 'Drive & Trek Start', activities: ['Jeep to Nayapul (1 hr)', 'Trek to Tikhedhunga', 'Cross suspension bridges', 'First teahouse experience'], accommodation: 'Teahouse', cost: 3200 },
      { day: 3, title: 'Climb to Ghorepani', activities: ['Steep climb Ulleri steps', 'Rhododendron forests', 'Reach Ghorepani (2800m)', 'Poon Hill sunset attempt'], accommodation: 'Ghorepani teahouse', cost: 3200 },
      { day: 4, title: 'Poon Hill & Tadapani', activities: ['Poon Hill sunrise', 'Return for breakfast', 'Trek to Tadapani', 'Mountain views'], accommodation: 'Tadapani teahouse', cost: 3200 },
      { day: 5, title: 'Chomrong & Sinuwa', activities: ['Descend to Chomrong', 'Lunch with views', 'Cross river', 'Climb to Sinuwa'], accommodation: 'Sinuwa teahouse', cost: 3500 },
      { day: 6, title: 'ABC Attempt', activities: ['Trek to Deurali', 'Continue to Machhapuchhre Base Camp', 'Final push to ABC', 'Sunset photography'], accommodation: 'ABC teahouse', cost: 4000 },
      { day: 7, title: 'Descent & Departure', activities: ['Early morning sunrise', 'Long descent', 'Hot springs at Jhinu', 'Return to Pokhara'], accommodation: 'Lakeside Hotel', cost: 3500 },
    ],
  },
  'mardi-himal': {
    '5 Days': [
      { day: 1, title: 'Drive to Kande & Trek', activities: ['Drive from Pokhara to Kande', 'Trek to Forest Camp', 'Walk through lush jungle', 'Teahouse dinner'], accommodation: 'Forest Camp teahouse', cost: 2800 },
      { day: 2, title: 'Low Camp', activities: ['Gentle climb through forest', 'Rhododendron bloom (spring)', 'Reach Low Camp (3000m)', 'First mountain views'], accommodation: 'Low Camp teahouse', cost: 3200 },
      { day: 3, title: 'High Camp', activities: ['Morning trek to High Camp', 'Dramatic scenery opens up', 'Reach High Camp (3580m)', 'Acclimatization'], accommodation: 'High Camp teahouse', cost: 3500 },
      { day: 4, title: 'Summit Day', activities: ['3AM start for sunrise', 'Reach Mardi Himal Viewpoint (4500m)', ' panoramic Annapurna views', 'Descend to Low Camp'], accommodation: 'Low Camp teahouse', cost: 3200 },
      { day: 5, title: 'Return Trek', activities: ['Descend to Siding village', 'Hot lunch at local restaurant', 'Drive back to Pokhara', 'Evening lakeside'], accommodation: 'Pokhara hotel', cost: 2800 },
    ],
  },
  'poon-hill': {
    '3 Days': [
      { day: 1, title: 'Drive & First Trek', activities: ['Drive to Nayapul', 'Trek to Tikhedhunga', 'Cross bridges', 'Teahouse overnight'], accommodation: 'Tikhedhunga teahouse', cost: 2500 },
      { day: 2, title: 'Ghorepani & Sunset', activities: ['Climb Ulleri steps', 'Reach Ghorepani', 'Optional sunset at Poon Hill', 'Dinner with views'], accommodation: 'Ghorepani teahouse', cost: 3000 },
      { day: 3, title: 'Sunrise & Return', activities: ['4AM Poon Hill sunrise', 'Breakfast with views', 'Descend different route', 'Return to Pokhara'], accommodation: 'Pokhara', cost: 2500 },
    ],
    '4 Days': [
      { day: 1, title: 'Pokhara to Nayapul', activities: ['Breakfast in Pokhara', 'Drive to Nayapul', 'Trek to Hille', 'Tea break with views'], accommodation: 'Hille teahouse', cost: 2200 },
      { day: 2, title: 'Trek to Ghorepani', activities: ['Morning trek through Ulleri', 'Rhododendron forests', 'Reach Ghorepani by afternoon', 'Evening rest'], accommodation: 'Ghorepani teahouse', cost: 2800 },
      { day: 3, title: 'Poon Hill & Tadapani', activities: ['Early sunrise hike', 'Return for breakfast', 'Trek to Tadapani', 'Annapurna views'], accommodation: 'Tadapani teahouse', cost: 2800 },
      { day: 4, title: 'Ghandruk & Return', activities: ['Descend to Ghandruk', 'Gurung village tour', 'Descend to Nayapul', 'Drive to Pokhara'], accommodation: 'Pokhara hotel', cost: 2200 },
    ],
  },
  'langtang-valley': {
    '7 Days': [
      { day: 1, title: 'Drive to Syabrubesi', activities: ['Early morning bus (7-8 hrs)', ' scenic mountain road', 'Arrive Syabrubesi'], accommodation: 'Syabrubesi lodge', cost: 2000 },
      { day: 2, title: 'Trek to Lama Hotel', activities: ['Follow Langtang Khola', 'Forest walk', 'Pass Bamboo village', 'Rest at Lama Hotel'], accommodation: 'Lama Hotel teahouse', cost: 3000 },
      { day: 3, title: 'Trek to Langtang Village', activities: ['Gentle valley walk', 'Views of Langtang Lirung', 'Pass Ghora Tabela', 'Reach Langtang village'], accommodation: 'Langtang teahouse', cost: 3200 },
      { day: 4, title: 'Kyanjin Gompa', activities: ['Short trek to Kyanjin', 'Visit cheese factory', 'Monastery visit', 'Afternoon rest'], accommodation: 'Kyanjin lodge', cost: 3500 },
      { day: 5, title: 'Tserko Ri Summit', activities: ['Early morning climb', 'Summit Tserko Ri (4984m)', 'Panoramic views', 'Return to Kyanjin'], accommodation: 'Kyanjin lodge', cost: 3500 },
      { day: 6, title: 'Descend to Lama Hotel', activities: ['Morning departure', 'Retrace steps', 'Lunch at Langtang village', 'Continue descent'], accommodation: 'Lama Hotel teahouse', cost: 3000 },
      { day: 7, title: 'Return to Kathmandu', activities: ['Trek to Syabrubesi', 'Bus ride back', 'Arrive evening'], accommodation: 'Kathmandu hotel', cost: 2200 },
    ],
  },
  'everest-base-camp': {
    '12 Days': [
      { day: 1, title: 'Flight to Lukla', activities: ['Morning flight (weather permitting)', 'Trek to Phakding', 'First mountain views', 'Teahouse dinner'], accommodation: 'Phakding teahouse', cost: 4500 },
      { day: 2, title: 'Namche Bazaar', activities: ['Cross suspension bridges', 'Climb to Namche', 'First views of Everest', 'Rest day prep'], accommodation: 'Namche lodge', cost: 4000 },
      { day: 3, title: 'Acclimatization Day', activities: ['Morning hike to Everest View Hotel', 'Visit Sherpa museum', 'Shop for supplies', 'Rest'], accommodation: 'Namche lodge', cost: 3800 },
      { day: 4, title: 'Tengboche', activities: ['Trek to Tengboche', 'Visit monastery', 'Panoramic views', 'Evening prayer ceremony'], accommodation: 'Tengboche lodge', cost: 4000 },
      { day: 5, title: 'Dingboche', activities: ['Descend to river', 'Climb to Dingboche', ' valley of wheat', 'Altitude rest'], accommodation: 'Dingboche lodge', cost: 4200 },
      { day: 6, title: 'Acclimatization', activities: ['Morning hill walk', 'Views of Lhotse', 'Rest afternoon', 'Prepare for higher'], accommodation: 'Dingboche lodge', cost: 4000 },
      { day: 7, title: 'Dughla', activities: ['Trek to Dughla', 'Pass memorial chortens', 'First high altitude night', 'Hot soups needed'], accommodation: 'Dughla lodge', cost: 4500 },
      { day: 8, title: 'Lobuche', activities: ['Climb moraine', 'Khumbu Glacier views', 'Reach Lobuche', 'Cold night prep'], accommodation: 'Lobuche lodge', cost: 4800 },
      { day: 9, title: 'Gorakshep & EBC', activities: ['Trek to Gorakshep', 'Drop bags', 'Continue to EBC', 'Return for night'], accommodation: 'Gorakshep lodge', cost: 5000 },
      { day: 10, title: 'Kala Patthar & Descend', activities: ['4AM climb to Kala Patthar', 'Sunrise over Everest', 'Descend to Pheriche', 'Rest'], accommodation: 'Pheriche lodge', cost: 4500 },
      { day: 11, title: 'Return Trek', activities: ['Trek back to Namche', 'Hot shower!', 'Celebration dinner'], accommodation: 'Namche lodge', cost: 4000 },
      { day: 12, title: 'Final Day', activities: ['Trek to Lukla', 'Flight permits', 'Fly to Kathmandu', 'Final celebration'], accommodation: 'Kathmandu hotel', cost: 4500 },
    ],
  },
  'upper-mustang': {
    '10 Days': [
      { day: 1, title: 'Flight to Jomsom', activities: ['Early mountain flight', 'Acclimatize to altitude', 'Explore Jomsom', 'Permit check'], accommodation: 'Jomsom lodge', cost: 5000 },
      { day: 2, title: 'Trek to Kagbeni', activities: ['Follow Kali Gandaki', 'Wind corridor walk', 'Enter Upper Mustang', 'Visit monastery'], accommodation: 'Kagbeni lodge', cost: 4500 },
      { day: 3, title: 'Chele', activities: ['Climb to Chele', 'Desert landscape begins', 'First red cliffs', 'Traditional village'], accommodation: 'Chele lodge', cost: 4500 },
      { day: 4, title: 'Ghiling', activities: ['Cross passes', 'Chortens and mani walls', 'Tibetan culture', 'Local families'], accommodation: 'Ghiling lodge', cost: 5000 },
      { day: 5, title: 'Dhakmar', activities: ['Red cliffs walk', 'Cave monasteries', 'Paintings visit', 'Camping option'], accommodation: 'Dhakmar lodge', cost: 5000 },
      { day: 6, title: 'Lo Manthang', activities: ['Cross Marang La pass', 'Walled city approach', 'Enter Forbidden Kingdom', 'Palace views'], accommodation: 'Lo Manthang lodge', cost: 6000 },
      { day: 7, title: 'Explore Lo Manthang', activities: ['Palace tour', 'Monasteries visit', 'Royal family audience', 'Artisan workshops'], accommodation: 'Lo Manthang lodge', cost: 5500 },
      { day: 8, title: 'Return Trek', activities: ['Depart Lo Manthang', 'Different route option', 'Tsarang village', 'Ancient palace'], accommodation: 'Tsarang lodge', cost: 5000 },
      { day: 9, title: 'Syangboche', activities: ['Cross Nyi La pass', 'Mountain views', 'Green valleys', 'Return journey'], accommodation: 'Syangboche lodge', cost: 4800 },
      { day: 10, title: 'Jomsom', activities: ['Final trek day', 'Return to Jomsom', 'Celebration dinner', 'Flight prep'], accommodation: 'Jomsom lodge', cost: 5000 },
    ],
  },
};

export function PlannerTab() {
  const { t } = useI18n();
  const colors = useThemeColors();
  const { user } = useAuth();
  const [loadingDests, setLoadingDests] = useState(true);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [generating, setGenerating] = useState(false);
  const [step, setStep] = useState(0);
  const [itinerary, setItinerary] = useState<GeneratedItinerary | null>(null);
  const [trip, setTrip] = useState<TripParams>({
    destination: 0,
    duration: 1,
    budget: 1,
    travelers: 1,
    fitness: 1,
  });

  useEffect(() => {
    async function fetchDestinations() {
      const { data } = await supabase
        .from('destinations')
        .select('*')
        .eq('category', 'Trekking')
        .order('rating', { ascending: false })
        .limit(6);
      if (data) setDestinations(data);
      setLoadingDests(false);
    }
    fetchDestinations();
  }, []);

  const steps = [
    { key: 'destination', label: 'Where do you want to go?', icon: MapPin },
    { key: 'duration', label: 'How many days?', icon: Clock },
    { key: 'travelers', label: 'Who is traveling?', icon: Users },
    { key: 'budget', label: 'What is your budget?', icon: Wallet },
    { key: 'fitness', label: 'Fitness level?', icon: TrendingUp },
  ];

  const currentKey = steps[step].key as keyof TripParams;
  const currentOptions = tripOptions[
    currentKey === 'destination' ? 'destinations' :
    currentKey === 'duration' ? 'durations' :
    currentKey === 'budget' ? 'budgets' :
    currentKey === 'travelers' ? 'travelers' : 'fitness'
  ];

  const generateItinerary = async () => {
    setGenerating(true);

    // Simulate AI generation delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const dest = destinations[trip.destination] || tripOptions.destinations[trip.destination];
    const duration = parseInt(tripOptions.durations[trip.duration].split(' ')[0]) || 5;
    const budgetPerDay = tripOptions.budgets[trip.budget].perDay;
    const travelers = trip.travelers + 1;
    const fitness = tripOptions.fitness[trip.fitness];

    // Find matching template or generate a generic one
    const destId = dest?.slug || 'annapurna-base-camp';
    const durationKey = tripOptions.durations[trip.duration];
    let templateDays = itineraryTemplates[destId]?.[durationKey] ||
                       itineraryTemplates[destId]?.['7 Days'];

    // If no template matches, generate a generic trekking itinerary
    if (!templateDays) {
      templateDays = Array.from({ length: Math.max(duration, 5) }, (_, i) => ({
        day: i + 1,
        title: i === 0 ? 'Arrival & Preparation' :
               i === duration - 1 ? 'Return & Departure' :
               i === 1 ? 'Trek Start' :
               i === Math.floor(duration / 2) ? 'Acclimatization & Exploration' :
               `Trek Day ${i}`,
        activities: i === 0 ? [`Arrive at ${dest?.name || 'trailhead'}`, 'Trek briefing and gear check', 'Permit processing', 'Local area exploration'] :
                    i === duration - 1 ? ['Morning descent', 'Final views', 'Drive to nearest city', 'Celebration dinner'] :
                    i === Math.floor(duration / 2) ? ['Rest and acclimatize', 'Local village visit', 'Photography session', 'Cultural interaction'] :
                    ['Continue trek', 'Scenic mountain views', 'Cross mountain passes', 'Teahouse overnight'],
        accommodation: i === 0 || i === duration - 1 ? 'Hotel' : 'Teahouse',
        cost: Math.round(budgetPerDay * 1.2),
      }));
    }

    // Adjust cost based on budget
    const costMultiplier = budgetPerDay / 3000;
    const adjustedDays = templateDays.slice(0, duration).map((day: any) => ({
      ...day,
      cost: Math.round(day.cost * costMultiplier),
      date: `Day ${day.day}`,
    }));

    // Fill remaining days if needed
    while (adjustedDays.length < duration) {
      const lastDay = adjustedDays[adjustedDays.length - 1];
      adjustedDays.push({
        day: lastDay.day + 1,
        date: `Day ${lastDay.day + 1}`,
        title: 'Rest Day / Exploration',
        activities: ['Morning rest', 'Local exploration', 'Cultural visit', 'Photography'],
        accommodation: 'Same lodge',
        tips: ['Drink plenty of water', 'Rest when tired'],
        cost: Math.round(3000 * costMultiplier),
      });
    }

    const totalCost = adjustedDays.reduce((sum: number, day: any) => sum + day.cost, 0);

    const generated: GeneratedItinerary = {
      destination: dest,
      days: adjustedDays,
      totalCost,
      perPersonCost: Math.round(totalCost / travelers),
      highlights: [
        `Experience the ${dest?.name || 'Annapurna'} region`,
        fitness === 'Easy' || fitness === 'Moderate' ? 'Perfect for beginners' : 'A true adventure challenge',
        'Local teahouse accommodation',
        'Stunning mountain views',
        'Cultural immersion with local communities',
      ],
      packingList: fitness === 'Easy' ?
        ['Day pack', 'Comfortable hiking shoes', 'Rain jacket', 'Water bottle', 'Sun protection'] :
        ['Down jacket', 'Sleeping bag', 'Trekking poles', 'Headlamp', 'First aid kit', 'Water purification', 'Solar charger', 'Layers for all weather'],
      warnings: [
        'Acclimatize properly to avoid altitude sickness',
        'Check weather conditions before departure',
        'Carry enough cash - limited ATMs on trail',
        'Respect local culture and customs',
      ],
    };

    setItinerary(generated);
    setGenerating(false);
    setStep(5);
  };

  const handleSaveItinerary = async () => {
    if (!user || !itinerary) return;

    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + parseInt(tripOptions.durations[trip.duration].split(' ')[0]));

      const { error: tripError } = await supabase.from('trips').insert({
        user_id: user.id,
        destination_id: itinerary.destination?.id,
        name: `${itinerary.destination?.name || 'Trek'} Adventure`,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        budget_npr: itinerary.totalCost,
        notes: itinerary.days.map((d: any) => `Day ${d.day}: ${d.title}`).join('\n'),
        status: 'planned',
      });

      if (tripError) throw tripError;

      // Increment user stats (don't overwrite existing data)
      const { data: existingStats } = await supabase
        .from('user_stats')
        .select('trips_planned')
        .eq('user_id', user.id)
        .maybeSingle();

      await supabase
        .from('user_stats')
        .upsert({
          user_id: user.id,
          trips_planned: (existingStats?.trips_planned || 0) + 1,
        }, { onConflict: 'user_id' });
    } catch (err) {
      console.error('Error saving itinerary:', err);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className={cn('text-2xl md:text-3xl font-display font-bold', colors.text)}>
          {t('nav.planner')}
        </h1>
        <p className={cn('text-sm', colors.textSecondary)}>
          AI-powered trip planning personalized for you
        </p>
      </div>

      {/* Progress Bar */}
      {step < 5 && (
        <div className="flex gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={cn(
                'flex-1 h-1.5 rounded-full transition-colors',
                i <= step ? 'bg-forest-500' : 'bg-stone-200 dark:bg-forest-700'
              )}
            />
          ))}
        </div>
      )}

      {/* Planning Steps */}
      {step < 5 && (
        <div className={cn(
          'rounded-2xl p-6 border',
          colors.card === 'bg-white' ? 'bg-white border-stone-200' : 'bg-forest-800/50 border-forest-700'
        )}>
          <div className="flex items-center gap-2 mb-4">
            {(() => {
              const Icon = steps[step].icon;
              return <Icon className="w-5 h-5 text-forest-500" />;
            })()}
            <h2 className={cn('text-lg font-semibold', colors.text)}>{steps[step].label}</h2>
          </div>

          <div className={cn(
            'grid gap-3',
            currentKey === 'destination' || currentKey === 'duration' ? 'grid-cols-2' : 'grid-cols-2'
          )}>
            {currentKey === 'destination' ? (
              <>
                {loadingDests ? (
                  [...Array(4)].map((_, i) => (
                    <div key={i} className="h-24 rounded-xl bg-stone-200 animate-pulse" />
                  ))
                ) : destinations.length > 0 ? (
                  destinations.map((dest, i) => (
                    <button
                      key={dest.id}
                      onClick={() => {
                        setTrip({ ...trip, destination: i });
                        if (step < 4) setStep(step + 1);
                      }}
                      className={cn(
                        'relative h-24 rounded-xl overflow-hidden transition-all',
                        trip.destination === i
                          ? 'ring-2 ring-forest-500'
                          : 'hover:ring-1 hover:ring-forest-300'
                      )}
                    >
                      <img
                        src={dest.image_url}
                        alt={dest.name}
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.src = 'https://images.pexels.com/photos/4194617/pexels-photo-4194617.jpeg?auto=compress&cs=tinysrgb&w=800'; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <h3 className="text-white font-semibold text-sm">{dest.name}</h3>
                        <div className="flex items-center gap-2 text-white/70 text-xs">
                          <MapPin className="w-3 h-3" /> {dest.region}
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  tripOptions.destinations.map((dest, i) => (
                    <button
                      key={dest.id}
                      onClick={() => {
                        setTrip({ ...trip, destination: i });
                        if (step < 4) setStep(step + 1);
                      }}
                      className={cn(
                        'py-4 px-4 rounded-xl text-sm font-bold text-center transition-all border',
                        trip.destination === i
                          ? 'bg-forest-600 text-white border-forest-600'
                          : colors.card === 'bg-white'
                            ? 'bg-stone-100 text-stone-700 hover:bg-forest-50 hover:text-forest-700'
                            : 'bg-forest-700/50 text-forest-200 hover:bg-forest-600'
                      )}
                    >
                      {dest.name}
                    </button>
                  ))
                )}
              </>
            ) : (
              (currentOptions as any[]).map((opt: any, i: number) => (
                <button
                  key={typeof opt === 'string' ? opt : opt.name}
                  onClick={() => {
                    setTrip({ ...trip, [currentKey]: i });
                    if (step < 4) setStep(step + 1);
                  }}
                  className={cn(
                    'py-3 px-4 rounded-xl text-sm font-medium transition-all',
                    (currentKey === 'budget' ? trip.budget : trip[currentKey as keyof TripParams]) === i
                      ? 'bg-forest-600 text-white shadow-md'
                      : colors.card === 'bg-white'
                        ? 'bg-stone-100 text-stone-700 hover:bg-forest-50 hover:text-forest-700'
                        : 'bg-forest-700/50 text-forest-200 hover:bg-forest-600'
                  )}
                >
                  {typeof opt === 'string' ? opt : opt.name}
                </button>
              ))
            )}
          </div>

          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="mt-4 text-sm text-forest-600 hover:text-forest-700"
            >
              Back
            </button>
          )}

          {step === 4 && (
            <button
              onClick={generateItinerary}
              className="mt-4 w-full btn-primary flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" /> Generate Itinerary
            </button>
          )}
        </div>
      )}

      {/* Generating State */}
      {generating && (
        <div className={cn(
          'rounded-2xl p-12 text-center border',
          colors.card === 'bg-white' ? 'bg-white border-stone-200' : 'bg-forest-800/50 border-forest-700'
        )}>
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-forest-200 border-t-forest-600 rounded-full animate-spin" />
          <h3 className={cn('font-semibold mb-2', colors.text)}>Generating your itinerary...</h3>
          <p className={cn('text-sm', colors.textSecondary)}>
            Analyzing routes, accommodations, and optimal daily activities
          </p>
        </div>
      )}

      {/* Results */}
      {step === 5 && itinerary && !generating && (
        <div className="space-y-6">
          {/* Trip Overview */}
          <div className={cn(
            'rounded-2xl p-6 border',
            colors.card === 'bg-white' ? 'bg-gradient-to-br from-forest-50 to-blue-50 border-forest-100' : 'bg-forest-900/30 border-forest-700'
          )}>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-forest-600" />
              <h2 className={cn('text-lg font-semibold', colors.text)}>
                {itinerary.destination?.name || 'Trek'} Adventure
              </h2>
              <span className={cn(
                'ml-auto px-3 py-1 rounded-full text-sm font-medium',
                colors.card === 'bg-white' ? 'bg-forest-100 text-forest-700' : 'bg-forest-700 text-forest-200'
              )}>
                {tripOptions.durations[trip.duration]}
              </span>
            </div>

            {/* Highlights */}
            <div className="mb-4">
              <h3 className={cn('text-sm font-medium mb-2', colors.textSecondary)}>Trip Highlights</h3>
              <div className="flex flex-wrap gap-2">
                {itinerary.highlights.map((h, i) => (
                  <span key={i} className={cn(
                    'inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs',
                    colors.card === 'bg-white' ? 'bg-white text-stone-600' : 'bg-forest-800 text-forest-200'
                  )}>
                    <Compass className="w-3 h-3" /> {h}
                  </span>
                ))}
              </div>
            </div>

            {/* Daily Itinerary */}
            <div className="space-y-3">
              {itinerary.days.map((day: any, i: number) => (
                <div
                  key={i}
                  className={cn(
                    'flex gap-4 p-4 rounded-xl',
                    colors.card === 'bg-white' ? 'bg-white/80' : 'bg-forest-800/50'
                  )}
                >
                  <div className={cn(
                    'w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold flex-shrink-0',
                    'bg-forest-100 text-forest-700 dark:bg-forest-700 dark:text-forest-200'
                  )}>
                    {day.day}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn('text-xs font-medium', colors.textMuted)}>Day {day.day}</span>
                      <span className={cn('text-xs', colors.textMuted)}>-</span>
                      <span className={cn('text-xs', colors.textMuted)}>NPR {day.cost.toLocaleString()}/person</span>
                    </div>
                    <h4 className={cn('font-semibold mb-1', colors.text)}>{day.title}</h4>
                    <ul className="text-sm space-y-0.5">
                      {day.activities?.slice(0, 4).map((act: string, actIdx: number) => (
                        <li key={actIdx} className={cn('flex items-center gap-2', colors.textSecondary)}>
                          <ChevronRight className="w-3 h-3 text-forest-500" />
                          {act}
                        </li>
                      ))}
                    </ul>
                    {day.accommodation && (
                      <div className={cn('flex items-center gap-1 mt-2 text-xs', colors.textMuted)}>
                        <Bed className="w-3 h-3" /> {day.accommodation}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className={cn(
            'rounded-2xl p-6 border',
            colors.card === 'bg-white' ? 'bg-white border-stone-200' : 'bg-forest-800/50 border-forest-700'
          )}>
            <h3 className={cn('font-semibold mb-4 flex items-center gap-2', colors.text)}>
              <Wallet className="w-5 h-5" /> Budget Estimate
            </h3>
            <div className="space-y-2">
              {[
                { item: 'Accommodation', cost: Math.round(itinerary.totalCost * 0.35) },
                { item: 'Food & Drinks', cost: Math.round(itinerary.totalCost * 0.25) },
                { item: 'Transportation', cost: Math.round(itinerary.totalCost * 0.15) },
                { item: 'Permits & Fees', cost: Math.round(itinerary.totalCost * 0.10) },
                { item: 'Guide & Tips', cost: Math.round(itinerary.totalCost * 0.15) },
              ].map((line, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className={colors.textSecondary}>{line.item}</span>
                  <span className={cn('font-medium', colors.text)}>NPR {line.cost.toLocaleString()}</span>
                </div>
              ))}
              <div className={cn('flex justify-between pt-3 border-t font-semibold', colors.border)}>
                <span className={colors.text}>Total per person</span>
                <span className="text-forest-600 text-lg">NPR {itinerary.totalCost.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Packing List */}
          <div className={cn(
            'rounded-2xl p-6 border',
            colors.card === 'bg-white' ? 'bg-white border-stone-200' : 'bg-forest-800/50 border-forest-700'
          )}>
            <h3 className={cn('font-semibold mb-4', colors.text)}>Packing List</h3>
            <div className="flex flex-wrap gap-2">
              {itinerary.packingList.map((item, i) => (
                <span key={i} className={cn(
                  'px-3 py-1.5 rounded-lg text-sm',
                  colors.card === 'bg-white' ? 'bg-stone-100 text-stone-700' : 'bg-forest-700 text-forest-200'
                )}>
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Warnings */}
          <div className={cn(
            'rounded-2xl p-4 border',
            colors.card === 'bg-white' ? 'bg-amber-50 border-amber-200' : 'bg-amber-900/20 border-amber-700/30'
          )}>
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 mt-0.5" />
              <div>
                <h3 className={cn('font-semibold text-sm mb-2', colors.text)}>Important Notes</h3>
                <ul className="space-y-1">
                  {itinerary.warnings.map((w, i) => (
                    <li key={i} className={cn('text-xs', colors.textSecondary)}>• {w}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                setStep(0);
                setItinerary(null);
              }}
              className={cn(
                'flex-1 py-3 rounded-xl font-medium transition-colors',
                colors.card === 'bg-white'
                  ? 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  : 'bg-forest-700 text-forest-200 hover:bg-forest-600'
              )}
            >
              <RefreshCw className="w-4 h-4 inline mr-2" /> Start Over
            </button>
            <button
              onClick={handleSaveItinerary}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" /> Save Trip
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
