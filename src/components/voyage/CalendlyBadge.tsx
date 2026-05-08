import { useEffect } from "react";

/**
 * Loads the Calendly badge widget dynamically.
 * The badge appears as a floating button in the bottom-right corner
 * that opens Calendly scheduling on click.
 */
const CalendlyBadge = () => {
  useEffect(() => {
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
      // Clean up: remove CSS link and script
      document.head.removeChild(link);
      document.body.removeChild(script);

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
