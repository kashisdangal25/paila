import React, { createContext, useContext, useState, useCallback } from 'react';

type Language = 'en' | 'ne' | 'hi' | 'zh' | 'ja' | 'ko' | 'fr' | 'de' | 'es';

interface Translations {
  [key: string]: string | Translations;
}

const translations: Record<Language, Translations> = {
  en: {
    nav: {
      home: 'Today',
      discover: 'Discover',
      map: 'Map',
      planner: 'Trip Planner',
      stories: 'Stories',
      saved: 'Saved',
      community: 'Community',
      notifications: 'Notifications',
      profile: 'Profile',
      settings: 'Settings',
      logout: 'Log out',
    },
    today: {
      greeting: 'Good {time}, {name}',
      time: { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening', night: 'Night' },
      location: "You're in {city}",
      search: 'Search destinations, guides, hidden gems...',
      hiddenNearby: 'Hidden Places Nearby',
      continueJourney: 'Continue Your Journey',
      weather: 'Weather',
      savedPlaces: 'Saved Places',
      festivals: 'Festivals & Events',
      safety: 'Safety Tips',
    },
    discover: {
      title: 'Discover Nepal',
      subtitle: 'Find your next adventure',
      filters: { all: 'All', treks: 'Treks', culture: 'Culture', nature: 'Nature', food: 'Food' },
      popular: 'Popular Destinations',
      hidden: 'Hidden Gems',
      guides: 'Find a Guide',
    },
    common: {
      viewAll: 'View all',
      learnMore: 'Learn more',
      getStarted: 'Get started',
      save: 'Save',
      saved: 'Saved',
      share: 'Share',
      book: 'Book now',
      contact: 'Contact',
      cancel: 'Cancel',
      confirm: 'Confirm',
      loading: 'Loading...',
    },
  },
  ne: {
    nav: {
      home: 'आज',
      discover: 'अन्वेषण',
      map: 'नक्सा',
      planner: 'यात्रा योजना',
      stories: 'कथाहरू',
      saved: 'सेभ गरिएको',
      community: 'समुदाय',
      notifications: 'सूचनाहरू',
      profile: 'प्रोफाइल',
      settings: 'सेटिङ',
      logout: 'लग आउट',
    },
    today: {
      greeting: 'शुभ {time}, {name}',
      time: { morning: 'प्रभात', afternoon: 'दिउँसो', evening: 'साँझ', night: 'रात' },
      location: 'तपाईं {city} मा हुनुहुन्छ',
      search: 'गन्तव्य, गाइड, लुकेका रत्न खोज्नुहोस्...',
      hiddenNearby: 'नजिकै लुकेका ठाउँहरू',
      continueJourney: 'तपाईंको यात्रा जारी राख्नुहोस्',
      weather: 'मौसम',
      savedPlaces: 'सेभ गरिएका ठाउँहरू',
      festivals: 'चाडपर्व र कार्यक्रम',
      safety: 'सुरक्षा सुझाव',
    },
    discover: {
      title: 'नेपाल अन्वेषण गर्नुहोस्',
      subtitle: 'तपाईंको अर्को साहसिक यात्रा खोज्नुहोस्',
      filters: { all: 'सबै', treks: 'ट्रेकिङ', culture: 'संस्कृति', nature: 'प्रकृति', food: 'खाना' },
      popular: 'लोकप्रिय गन्तव्यहरू',
      hidden: 'लुकेका रत्नहरू',
      guides: 'गाइड फेला पार्नुहोस्',
    },
    common: {
      viewAll: 'सबै हेर्नुहोस्',
      learnMore: 'थप जान्नुहोस्',
      getStarted: 'सुरु गर्नुहोस्',
      save: 'सेभ गर्नुहोस्',
      saved: 'सेभ गरियो',
      share: 'साझा गर्नुहोस्',
      book: 'अहिले बुक गर्नुहोस्',
      contact: 'सम्पर्क',
      cancel: 'रद्द गर्नुहोस्',
      confirm: 'पुष्टि गर्नुहोस्',
      loading: 'लोड हुँदैछ...',
    },
  },
  hi: {
    nav: {
      home: 'आज',
      discover: 'खोजें',
      map: 'मैप',
      planner: 'यात्रा योजना',
      stories: 'कहानियाँ',
      saved: 'सेव किए',
      community: 'समुदाय',
      notifications: 'सूचनाएं',
      profile: 'प्रोफ़ाइल',
      settings: 'सेटिंग्स',
      logout: 'लॉग आउट',
    },
    today: {
      greeting: 'शुभ {time}, {name}',
      time: { morning: 'सुबह', afternoon: 'दोपहर', evening: 'शाम', night: 'रात' },
      location: 'आप {city} में हैं',
      search: 'गंतव्य, गाइड, छिपे हुए स्थान खोजें...',
      hiddenNearby: 'पास के छिपे हुए स्थान',
      continueJourney: 'अपनी यात्रा जारी रखें',
      weather: 'मौसम',
      savedPlaces: 'सेव किए गए स्थान',
      festivals: 'त्योहार और कार्यक्रम',
      safety: 'सुरक्षा सुझाव',
    },
    discover: { title: 'नेपाल खोजें', subtitle: 'अपना अगला एडवेंचर खोजें', filters: { all: 'सभी', treks: 'ट्रेक', culture: 'संस्कृति', nature: 'प्रकृति', food: 'खाना' }, popular: 'लोकप्रिय गंतव्य', hidden: 'छिपे हुए स्थान', guides: 'गाइड खोजें' },
    common: { viewAll: 'सभी देखें', learnMore: 'और जानें', getStarted: 'शुरू करें', save: 'सेव करें', saved: 'सेव किया', share: 'शेयर करें', book: 'बुक करें', contact: 'संपर्क', cancel: 'रद्द करें', confirm: 'पुष्टि करें', loading: 'लोड हो रहा...' },
  },
  zh: {
    nav: { home: '今天', discover: '发现', map: '地图', planner: '旅程规划', stories: '故事', saved: '已保存', community: '社区', notifications: '通知', profile: '个人资料', settings: '设置', logout: '登出' },
    today: { greeting: '{time}好, {name}', time: { morning: '早上', afternoon: '下午', evening: '晚上', night: '夜晚' }, location: '你在{city}', search: '搜索目的地、导游、秘境...', hiddenNearby: '附近的秘境', continueJourney: '继续您的旅程', weather: '天气', savedPlaces: '已保存地点', festivals: '节日', safety: '安全提示' },
    discover: { title: '探索尼泊尔', subtitle: '寻找您的下一段旅程', filters: { all: '全部', treks: '徒步', culture: '文化', nature: '自然', food: '美食' }, popular: '热门目的地', hidden: '秘境', guides: '寻找导游' },
    common: { viewAll: '查看全部', learnMore: '了解更多', getStarted: '开始', save: '保存', saved: '已保存', share: '分享', book: '预订', contact: '联系', cancel: '取消', confirm: '确认', loading: '加载中...' },
  },
  ja: {
    nav: { home: '今日', discover: '発見', map: '地図', planner: '旅プラン', stories: 'ストーリー', saved: '保存済み', community: 'コミュニティ', notifications: '通知', profile: 'プロフィール', settings: '設定', logout: 'ログアウト' },
    today: { greeting: '{name}さん、{time}', time: { morning: 'おはよう', afternoon: 'こんにちは', evening: 'こんばんは', night: 'こんばんは' }, location: '{city}にいます', search: '目的地、ガイド、穴場を検索...', hiddenNearby: '近くの穴場', continueJourney: '旅を続ける', weather: '天気', savedPlaces: '保存した場所', festivals: '祭りとイベント', safety: '安全ヒント' },
    discover: { title: 'ネパールを発見', subtitle: '次の冒険を見つけよう', filters: { all: 'すべて', treks: 'トレッキング', culture: '文化', nature: '自然', food: 'グルメ' }, popular: '人気の目的地', hidden: '穴場スポット', guides: 'ガイドを探す' },
    common: { viewAll: 'すべて見る', learnMore: '詳しく見る', getStarted: '始める', save: '保存', saved: '保存済み', share: '共有', book: '予約', contact: '連絡', cancel: 'キャンセル', confirm: '確認', loading: '読み込み中...' },
  },
  ko: {
    nav: { home: '오늘', discover: '발견', map: '지도', planner: '여행 계획', stories: '스토리', saved: '저장됨', community: '커뮤니티', notifications: '알림', profile: '프로필', settings: '설정', logout: '로그아웃' },
    today: { greeting: '{time}, {name}님', time: { morning: '좋은 아침', afternoon: '좋은 오후', evening: '좋은 저녁', night: '좋은 밤' }, location: '{city}에 있습니다', search: '목적지, 가이드, 숨겨진 명소 검색...', hiddenNearby: '주변 숨겨진 명소', continueJourney: '여행 계속하기', weather: '날씨', savedPlaces: '저장한 장소', festivals: '축제', safety: '안전 팁' },
    discover: { title: '네팔 발견', subtitle: '다음 모험을 찾으세요', filters: { all: '전체', treks: '트레킹', culture: '문화', nature: '자연', food: '음식' }, popular: '인기 목적지', hidden: '숨겨진 명소', guides: '가이드 찾기' },
    common: { viewAll: '모두 보기', learnMore: '더보기', getStarted: '시작', save: '저장', saved: '저장됨', share: '공유', book: '예약', contact: '연락', cancel: '취소', confirm: '확인', loading: '로딩 중...' },
  },
  fr: {
    nav: { home: "Aujourd'hui", discover: 'Découvrir', map: 'Carte', planner: 'Planificateur', stories: 'Histoires', saved: 'Enregistrés', community: 'Communauté', notifications: 'Notifications', profile: 'Profil', settings: 'Paramètres', logout: 'Déconnexion' },
    today: { greeting: 'Bonjour {name}', time: { morning: 'Matin', afternoon: 'Après-midi', evening: 'Soir', night: 'Nuit' }, location: 'Vous êtes à {city}', search: 'Rechercher destinations, guides, joyaux cachés...', hiddenNearby: 'Lieux cachés à proximité', continueJourney: 'Continuer votre voyage', weather: 'Météo', savedPlaces: 'Lieux enregistrés', festivals: 'Festivals', safety: 'Conseils de sécurité' },
    discover: { title: 'Découvrir le Népal', subtitle: 'Trouvez votre prochaine aventure', filters: { all: 'Tous', treks: 'Randonnées', culture: 'Culture', nature: 'Nature', food: 'Cuisine' }, popular: 'Destinations populaires', hidden: 'Joyaux cachés', guides: 'Trouver un guide' },
    common: { viewAll: 'Voir tout', learnMore: 'En savoir plus', getStarted: 'Commencer', save: 'Enregistrer', saved: 'Enregistré', share: 'Partager', book: 'Réserver', contact: 'Contacter', cancel: 'Annuler', confirm: 'Confirmer', loading: 'Chargement...' },
  },
  de: {
    nav: { home: 'Heute', discover: 'Entdecken', map: 'Karte', planner: 'Reiseplaner', stories: 'Geschichten', saved: 'Gespeichert', community: 'Community', notifications: 'Benachrichtigungen', profile: 'Profil', settings: 'Einstellungen', logout: 'Abmelden' },
    today: { greeting: 'Guten {time}, {name}', time: { morning: 'Morgen', afternoon: 'Tag', evening: 'Abend', night: 'Nacht' }, location: 'Sie sind in {city}', search: 'Ziele, Guides, versteckte Orte suchen...', hiddenNearby: 'Versteckte Orte in der Nähe', continueJourney: 'Reise fortsetzen', weather: 'Wetter', savedPlaces: 'Gespeicherte Orte', festivals: 'Feste', safety: 'Sicherheitstipps' },
    discover: { title: 'Nepal entdecken', subtitle: 'Finden Sie Ihr nächstes Abenteuer', filters: { all: 'Alle', treks: 'Trekking', culture: 'Kultur', nature: 'Natur', food: 'Essen' }, popular: 'Beliebte Ziele', hidden: 'Versteckte Orte', guides: 'Guide finden' },
    common: { viewAll: 'Alle anzeigen', learnMore: 'Mehr erfahren', getStarted: 'Starten', save: 'Speichern', saved: 'Gespeichert', share: 'Teilen', book: 'Buchen', contact: 'Kontakt', cancel: 'Abbrechen', confirm: 'Bestätigen', loading: 'Laden...' },
  },
  es: {
    nav: { home: 'Hoy', discover: 'Descubrir', map: 'Mapa', planner: 'Planificador', stories: 'Historias', saved: 'Guardados', community: 'Comunidad', notifications: 'Notificaciones', profile: 'Perfil', settings: 'Ajustes', logout: 'Cerrar sesión' },
    today: { greeting: 'Buenas {time}, {name}', time: { morning: 'días', afternoon: 'tardes', evening: 'noches', night: 'noches' }, location: 'Estás en {city}', search: 'Buscar destinos, guías, joyas ocultas...', hiddenNearby: 'Lugares ocultos cercanos', continueJourney: 'Continúa tu viaje', weather: 'Clima', savedPlaces: 'Lugares guardados', festivals: 'Festivales', safety: 'Consejos de seguridad' },
    discover: { title: 'Descubrir Nepal', subtitle: 'Encuentra tu próxima aventura', filters: { all: 'Todos', treks: 'Senderismo', culture: 'Cultura', nature: 'Naturaleza', food: 'Comida' }, popular: 'Destinos populares', hidden: 'Joyas ocultas', guides: 'Encontrar guía' },
    common: { viewAll: 'Ver todo', learnMore: 'Más información', getStarted: 'Empezar', save: 'Guardar', saved: 'Guardado', share: 'Compartir', book: 'Reservar', contact: 'Contactar', cancel: 'Cancelar', confirm: 'Confirmar', loading: 'Cargando...' },
  },
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const stored = localStorage.getItem('paila-lang');
    if (stored && translations[stored as Language]) {
      return stored as Language;
    }
    const browserLang = navigator.language.split('-')[0];
    return translations[browserLang as Language] ? (browserLang as Language) : 'en';
  });

  const t = useCallback((key: string, params?: Record<string, string>): string => {
    const keys = key.split('.');
    let value: string | Translations = translations[language];

    for (const k of keys) {
      if (typeof value === 'string') break;
      value = (value as Translations)[k] || key;
    }

    if (typeof value !== 'string') return key;

    return value.replace(/{(\w+)}/g, (_, k) => params?.[k] || k);
  }, [language]);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('paila-lang', lang);
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

export const languageNames: Record<Language, string> = {
  en: 'English',
  ne: 'नेपाली',
  hi: 'हिंदी',
  zh: '中文',
  ja: '日本語',
  ko: '한국어',
  fr: 'Français',
  de: 'Deutsch',
  es: 'Español',
};

export const languageFlags: Record<Language, string> = {
  en: '🇬🇧',
  ne: '🇳🇵',
  hi: '🇮🇳',
  zh: '🇨🇳',
  ja: '🇯🇵',
  ko: '🇰🇷',
  fr: '🇫🇷',
  de: '🇩🇪',
  es: '🇪🇸',
};
