import { useEffect, useRef } from "react";

interface ViatorWidgetProps {
  partnerId: string;
  widgetRef: string;
  className?: string;
}

/**
 * Embeds a Viator affiliate widget.
 *
 * Viator's script scans the DOM once when it loads, so in a client-side routed
 * app it has to be injected again on every mount — otherwise the widget stays
 * blank when navigating between itinerary pages.
 */
const ViatorWidget = ({ partnerId, widgetRef, className }: ViatorWidgetProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !partnerId || !widgetRef) return;

    container.innerHTML = "";

    const target = document.createElement("div");
    target.setAttribute("data-vi-partner-id", partnerId);
    target.setAttribute("data-vi-widget-ref", widgetRef);
    container.appendChild(target);

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://www.viator.com/orion/partner/widget.js";
    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
  }, [partnerId, widgetRef]);

  return <div ref={containerRef} className={className} />;
};

export default ViatorWidget;
