import { useEffect } from "react";

declare global {
  interface Window {
    Calendly: {
      initBadgeWidget(options: Record<string, unknown>): void;
    };
  }
}

/**
 * Loads the Calendly badge widget dynamically.
 * Positioned at the bottom-left so it does not overlap
 * footer links or the admin button on the right.
 */
const CalendlyBadge = () => {
  useEffect(() => {
    // Inject override styles before Calendly loads
    const style = document.createElement("style");
    style.textContent = `
      .calendly-badge-widget {
        right: auto !important;
        left: 20px !important;
      }
    `;
    document.head.appendChild(style);

    // Load Calendly CSS
    const link = document.createElement("link");
    link.href = "https://assets.calendly.com/assets/external/widget.css";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    // Load Calendly JS and init badge widget
    const script = document.createElement("script");
    script.src = "https://assets.calendly.com/assets/external/widget.js";
    script.type = "text/javascript";
    script.async = true;
    script.onload = () => {
      if (window.Calendly) {
        window.Calendly.initBadgeWidget({
          url: "https://calendly.com/daniel-lirafigueiredo-fora/reiseplanlegging",
          text: "Schedule time with me",
          color: "#3f5d89",
          textColor: "#ffffff",
          branding: true,
        });
      }
    };
    document.body.appendChild(script);

    return () => {
      // Clean up: remove CSS link, script, and override style
      document.head.removeChild(link);
      document.body.removeChild(script);
      document.head.removeChild(style);

      // Remove any badge widget elements Calendly may have injected
      const badge = document.querySelector(".calendly-badge-widget");
      if (badge?.parentNode) {
        badge.parentNode.removeChild(badge);
      }
    };
  }, []);

  return null;
};

export default CalendlyBadge;
