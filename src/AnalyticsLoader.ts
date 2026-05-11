import { GATRACKINGID } from './AnalyticsConstants';

declare global {
  interface Window {
    dataLayer: unknown[];
  }
}

export function loadGoogleAnalytics() {
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GATRACKINGID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag(...args: unknown[]) { window.dataLayer.push(args); }
  gtag('js', new Date());
  gtag('config', GATRACKINGID);
}
