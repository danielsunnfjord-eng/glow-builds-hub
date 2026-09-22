import { useEffect, useRef } from "react";

interface GetYourGuideWidgetProps {
  /** Raw widget markup copied from the GetYourGuide partner dashboard. */
  html: string;
  className?: string;
}

/**
 * Embeds a GetYourGuide partner widget.
 *
 * GetYourGuide's loader scans the DOM when it loads, so in a client-side routed
 * app it has to be injected again on every mount — otherwise the widget stays
 * blank when navigating between itinerary pages.
 */
const GetYourGuideWidget = ({ html, className }: GetYourGuideWidgetProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !html.trim()) return;

    // Strip any <script> tags pasted along with the widget div; we add the loader ourselves.
    container.innerHTML = html.replace(/<script[\s\S]*?<\/script>/gi, "");

    const script = document.createElement("script");
    script.async = true;
    script.defer = true;
    script.src = "https://widget.getyourguide.com/v2/core.js";
    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
  }, [html]);

  return <div ref={containerRef} className={className} />;
};

export default GetYourGuideWidget;
