
import { DailyStats, CountryStats } from '../types';

const STORAGE_KEY = 'ai_rw_visit_stats';

export const recordVisit = async () => {
  if (typeof window === 'undefined') return;
  
  if (sessionStorage.getItem('visited_session')) return;
  
  let countryCode = 'RW'; // Default to Rwanda for speed
  try {
    // Fast timeout for geolocation to avoid blocking load
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (res.ok) {
        const data = await res.json();
        countryCode = data.country_code || 'RW';
    }
  } catch (e) {
    // Fail silently to keep app fast
  }

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
};

export const getVisitStats = (): DailyStats[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    try {
      const stats: Record<string, DailyStats> = JSON.parse(stored);
      return Object.values(stats)
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 30);
    } catch (e) {
      return [];
    }
};

export const getCountryAggregate = (): CountryStats[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    try {
      const stats: Record<string, DailyStats> = JSON.parse(stored);
      const agg: Record<string, number> = {};
      
      Object.values(stats).forEach(day => {
          if (day.countries) {
              Object.entries(day.countries).forEach(([code, count]) => {
                  agg[code] = (agg[code] || 0) + count;
              });
          }
      });

      const getFlagEmoji = (countryCode: string) => {
          if (!countryCode || countryCode === 'Unknown') return '🌍';
          try {
              return countryCode
                .toUpperCase()
                .replace(/./g, char => String.fromCodePoint(char.charCodeAt(0) + 127397));
          } catch (e) {
              return '🇷🇼';
          }
      };

      return Object.entries(agg)
          .map(([code, count]) => ({
              code,
              count,
              name: code === 'RW' ? 'Rwanda' : code,
              flag: getFlagEmoji(code)
          }))
          .sort((a, b) => b.count - a.count);
    } catch (e) {
      return [];
    }
};
