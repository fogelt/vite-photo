import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/services';

export function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    const trackVisit = async () => {
      if (window.location.hostname === "localhost") return;

      try {
        const fingerprint = btoa(navigator.userAgent + navigator.language).slice(0, 32);

        await supabase.from('site_visits').insert({
          page_path: location.pathname,
          visitor_hash: fingerprint
        });
      } catch (err) {
      }
    };

    trackVisit();
  }, [location.pathname]); // Runs every time the route changes

  return null;
}