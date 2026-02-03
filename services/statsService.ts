
import { DailyStats, CountryStats } from '../types';

const STORAGE_KEY = 'ai_rw_visit_stats';

export const recordVisit = async () => {
  if (typeof window === 'undefined') return;
  
  try {
    if (sessionStorage.getItem('visited_session')) return;
  } catch (e) {}
  
  let countryCode = 'RW';
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);
    const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
        const data = await res.json();
        countryCode = data.country_code || 'RW';
    }
  } catch (e) {}

  try {
    const today = new Date().toISOString().split('T')[0];
    const stored = localStorage.getItem(STORAGE_KEY);
    const stats: Record<string, DailyStats> = stored ? JSON.parse(stored) : {};

    if (!stats[today]) {
      stats[today] = { date: today, count: 0, countries: {} };
    }
    
    if (!stats[today].countries) {
        stats[today].countries = {};
    }

    stats[today].count += 1;
    stats[today].countries[countryCode] = (stats[today].countries[countryCode] || 0) + 1;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    sessionStorage.setItem('visited_session', 'true');
  } catch (e) {}
};

export const getVisitStats = (): DailyStats[] => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      const stats: Record<string, DailyStats> = JSON.parse(stored);
      return Object.values(stats).sort((a, b) => b.date.localeCompare(a.date));
    } catch (e) {
      return [];
    }
};

export const getAggregatedStats = () => {
  const stats = getVisitStats();
  const now = new Date();
  
  const isWithinDays = (dateStr: string, days: number) => {
    const date = new Date(dateStr);
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= days;
  };

  const todayStr = now.toISOString().split('T')[0];

  return {
    today: stats.find(s => s.date === todayStr)?.count || 0,
    week: stats.filter(s => isWithinDays(s.date, 7)).reduce((acc, curr) => acc + curr.count, 0),
    month: stats.filter(s => isWithinDays(s.date, 30)).reduce((acc, curr) => acc + curr.count, 0),
    year: stats.filter(s => isWithinDays(s.date, 365)).reduce((acc, curr) => acc + curr.count, 0),
    total: stats.reduce((acc, curr) => acc + curr.count, 0)
  };
};

export const getCountryAggregate = (): CountryStats[] => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      const stats: Record<string, DailyStats> = JSON.parse(stored);
      const agg: Record<string, number> = {};
      Object.values(stats).forEach(day => {
          if (day.countries) {
              Object.entries(day.countries).forEach(([code, count]) => {
                  // Fix: Ensure count is treated as a number
                  const numericCount = typeof count === 'number' ? count : 0;
                  agg[code] = (agg[code] || 0) + numericCount;
              });
          }
      });
      const getFlagEmoji = (countryCode: string) => {
          if (!countryCode || countryCode === 'Unknown') return '🌍';
          try {
              return countryCode.toUpperCase().replace(/./g, char => String.fromCodePoint(char.charCodeAt(0) + 127397));
          } catch (e) { return '🇷🇼'; }
      };
      return Object.entries(agg).map(([code, count]) => ({
              code, count, name: code === 'RW' ? 'Rwanda' : code, flag: getFlagEmoji(code)
          })).sort((a, b) => b.count - a.count);
    } catch (e) { return []; }
};