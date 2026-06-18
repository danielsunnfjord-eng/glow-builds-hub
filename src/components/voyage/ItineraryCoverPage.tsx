import { useEffect } from "react";

interface ItineraryCoverPageProps {
  title: string;
  subtitle: string;
  location: string;
  duration: string;
  season: string;
  description: string;
  heroImageUrl?: string;
  eyebrow?: string;
  shortDescription?: string;
  region?: string;
}

const FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;1,400&family=Cormorant+Garamond:ital,wght@0,400;1,300;1,400&family=Jost:wght@300;400;500&display=swap";

const useCoverFonts = () => {
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (document.querySelector(`link[data-fjw-cover-fonts]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = FONTS_HREF;
    link.setAttribute("data-fjw-cover-fonts", "true");
    document.head.appendChild(link);
  }, []);
};

const MountainWavesMark = () => (
  <svg
    width="52"
    height="52"
    viewBox="0 0 52 52"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M6 30 L18 12 L26 22 L34 8 L46 30 Z"
      fill="#3a6070"
    />
    <path
      d="M4 36 C 11 32, 17 40, 24 36 S 38 32, 48 36"
      stroke="#3a6070"
      strokeWidth="1.6"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M4 42 C 11 38, 17 46, 24 42 S 38 38, 48 42"
      stroke="#3a6070"
      strokeWidth="1.6"
      fill="none"
      strokeLinecap="round"
      opacity="0.7"
    />
  </svg>
);

const ItineraryCoverPage = ({
  title,
  subtitle,
  location,
  duration,
  season,
  description,
  heroImageUrl,
  eyebrow = "A pre-designed and inspirational itinerary",
  shortDescription,
  region,
}: ItineraryCoverPageProps) => {
  useCoverFonts();

  const titleParts = title.includes(":") ? title.split(/:(.+)/) : [title];
  const titleLine1 = titleParts[0] + (titleParts.length > 1 ? ":" : "");
  const titleLine2 = titleParts.length > 1 ? titleParts[1].trim() : "";

  return (
    <div style={{ width: "100%", background: "#f8f5f0", fontFamily: "'Jost', sans-serif" }}>
      {/* Hero */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: 340,
          background: heroImageUrl ? "transparent" : "#1c2e38",
          overflow: "hidden",
        }}
      >
        {heroImageUrl && (
          <img
            src={heroImageUrl}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        )}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 66%, rgba(0,0,0,0.55) 100%)",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Body */}
      <div style={{ padding: "52px 52px 52px", textAlign: "center", background: "#f8f5f0" }}>
        {/* Logo block */}
        <div style={{ margin: "28px 0 40px" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
            <MountainWavesMark />
          </div>
          <div
            style={{
              fontFamily: "'Jost', sans-serif",
              fontWeight: 400,
              fontSize: 13,
              letterSpacing: "0.32em",
              color: "#3a4a52",
              marginBottom: 8,
            }}
          >
            FJORD &amp; WAVES
          </div>
          <div
            style={{
              fontFamily: "'Jost', sans-serif",
              fontWeight: 300,
              fontSize: 9,
              letterSpacing: "0.28em",
              color: "#8fa0a8",
              textTransform: "uppercase",
            }}
          >
            Curated travel experiences
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            width: 40,
            height: 1,
            background: "#b5c5cc",
            margin: "0 auto 28px",
          }}
        />

        {/* Eyebrow */}
        <div
          style={{
            fontFamily: "'Jost', sans-serif",
            fontSize: 10,
            letterSpacing: "0.3em",
            color: "#7a9aa8",
            marginBottom: 18,
          }}
        >
          {eyebrow}
        </div>

        {/* Title */}
        <h1
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 42,
            fontWeight: 500,
            color: "#1c2e38",
            lineHeight: 1.18,
            margin: "0 0 18px",
          }}
        >
          {titleLine1}
          {titleLine2 && (
            <>
              <br />
              {titleLine2}
            </>
          )}
        </h1>

        {/* Subtitle */}
        <div
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: "italic",
            fontWeight: 300,
            fontSize: 16,
            color: "#7a9aa8",
            marginBottom: 40,
          }}
        >
          {subtitle}
        </div>

        {/* Diamond rule */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            margin: "0 auto 32px",
            maxWidth: "100%",
          }}
        >
          <div style={{ flex: 1, height: 0, borderTop: "0.5px solid #c4d4da" }} />
          <div
            style={{
              width: 6,
              height: 6,
              background: "#7a9aa8",
              transform: "rotate(45deg)",
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1, height: 0, borderTop: "0.5px solid #c4d4da" }} />
        </div>

        {/* Description — shortDescription only */}
        {shortDescription && (
          <p
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: "italic",
              fontSize: 19,
              lineHeight: 1.75,
              color: "#2e4450",
              maxWidth: 520,
              margin: "0 auto 44px",
            }}
          >
            {shortDescription}
          </p>
        )}

        {/* Metadata strip */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "stretch",
            maxWidth: 520,
            margin: "0 auto",
          }}
        >
          {[
            { label: "Duration", value: duration },
            { label: "Region", value: region ?? location },
            { label: "Season", value: season },
          ].map((item, idx) => (
            <div
              key={item.label}
              style={{
                flex: 1,
                padding: "0 16px",
                borderLeft: idx === 0 ? "none" : "1px solid #c4d4da",
              }}
            >
              <div
                style={{
                  fontFamily: "'Jost', sans-serif",
                  fontSize: 9,
                  letterSpacing: "0.24em",
                  color: "#8fa0a8",
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                {item.label}
              </div>
              <div
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 16,
                  color: "#1c2e38",
                }}
              >
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Accent bar */}
      <div
        style={{
          width: "100%",
          height: 3,
          background:
            "linear-gradient(to right, #3a6070 0%, #7a9aa8 50%, #3a6070 100%)",
        }}
      />
    </div>
  );
};

export default ItineraryCoverPage;
