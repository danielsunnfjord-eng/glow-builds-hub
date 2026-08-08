import React from "react";

/**
 * ItineraryCoverPage
 *
 * Layout order (top → bottom):
 *   1. Logo block (large, centered, on parchment bg)
 *   2. Hero image (full-width, uploaded by user)
 *   3. Optional photo credit label below hero
 *   4. Eyebrow text
 *   5. Title
 *   6. Short description (2–3 sentences MAX — never the full body)
 *   7. Duration / Region / Season metadata strip
 *   8. Thin teal footer accent bar
 *
 * Props:
 *   heroImageUrl      string   — user-uploaded cover photo; shows dark slate if missing
 *   eyebrow           string   — defaults to "A pre-designed and inspirational itinerary"
 *   title             string   — itinerary title
 *   location          string   — e.g. "Norway · Seven Days" shown under title
 *   shortDescription  string   — 2–3 sentence intro only
 *   duration          string   — e.g. "7 days"
 *   region            string   — e.g. "Western Norway"
 *   season            string   — e.g. "Summer 2026"
 *   photoCredit       string   — optional, shown below hero image
 */
interface ItineraryCoverPageProps {
  heroImageUrl?: string;
  eyebrow?: string;
  title?: string;
  location?: string;
  shortDescription?: string;
  duration?: string;
  region?: string;
  season?: string;
  photoCredit?: string;
}

export default function ItineraryCoverPage({
  heroImageUrl,
  eyebrow = "A pre-designed and inspirational itinerary",
  title = "Itinerary Title",
  location = "",
  shortDescription = "",
  duration = "",
  region = "",
  season = "",
  photoCredit = "",
}: ItineraryCoverPageProps) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Jost:wght@300;400;500&display=swap');

        .fjw-cover * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        .fjw-cover {
          width: 100%;
          max-width: 720px;
          margin: 0 auto;
          background: #f8f5f0;
          font-family: 'Jost', sans-serif;
          overflow: hidden;
        }

        /* ── 1. Logo block ── */
        .fjw-logo-block {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 44px 40px 40px;
          gap: 10px;
          background: #f8f5f0;
        }

        .fjw-logo-name {
          font-family: 'Jost', sans-serif;
          font-weight: 400;
          font-size: 14px;
          letter-spacing: 0.34em;
          color: #3a4a52;
          text-transform: uppercase;
          margin-top: 2px;
        }

        .fjw-logo-tagline {
          font-family: 'Jost', sans-serif;
          font-weight: 300;
          font-size: 9px;
          letter-spacing: 0.3em;
          color: #8fa0a8;
          text-transform: uppercase;
        }

        /* ── 2. Hero image ── */
        .fjw-hero {
          width: 100%;
          height: 320px;
          background: #1c2e38;
          overflow: hidden;
          position: relative;
        }

        .fjw-hero img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center 55%;
          display: block;
        }

        /* ── 3. Photo credit ── */
        .fjw-photo-credit {
          width: 100%;
          text-align: right;
          font-family: 'Jost', sans-serif;
          font-size: 10px;
          font-weight: 300;
          letter-spacing: 0.05em;
          color: #8fa0a8;
          padding: 8px 16px 0;
        }

        /* ── Body: everything below the hero ── */
        .fjw-body {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 40px 56px 52px;
          background: #f8f5f0;
        }

        /* ── 4. Eyebrow ── */
        .fjw-eyebrow {
          font-family: 'Jost', sans-serif;
          font-size: 10px;
          font-weight: 400;
          letter-spacing: 0.3em;
          color: #7a9aa8;
          text-transform: uppercase;
          text-align: center;
          margin-bottom: 20px;
        }

        /* ── 5. Title ── */
        .fjw-title {
          font-family: 'Playfair Display', serif;
          font-size: 38px;
          font-weight: 500;
          line-height: 1.2;
          color: #1c2e38;
          text-align: center;
          letter-spacing: -0.01em;
          margin-bottom: 14px;
          max-width: 540px;
        }

        /* ── Location line ── */
        .fjw-location {
          font-family: 'Cormorant Garamond', serif;
          font-size: 16px;
          font-weight: 300;
          font-style: italic;
          color: #7a9aa8;
          letter-spacing: 0.06em;
          text-align: center;
          margin-bottom: 36px;
        }

        /* ── Diamond rule ── */
        .fjw-rule {
          display: flex;
          align-items: center;
          gap: 16px;
          width: 100%;
          max-width: 500px;
          margin-bottom: 32px;
        }

        .fjw-rule-line {
          flex: 1;
          height: 0.5px;
          background: #c4d4da;
        }

        .fjw-rule-diamond {
          width: 6px;
          height: 6px;
          background: #7a9aa8;
          transform: rotate(45deg);
          flex-shrink: 0;
        }

        /* ── 6. Short description ── */
        .fjw-description {
          font-family: 'Cormorant Garamond', serif;
          font-size: 19px;
          font-weight: 400;
          font-style: italic;
          line-height: 1.78;
          color: #2e4450;
          text-align: center;
          max-width: 500px;
          margin-bottom: 56px;
          height: auto;
          min-height: 0;
          overflow: visible;
        }

        /* ── 7. Metadata strip ── */
        .fjw-meta {
          display: grid;
          grid-template-columns: 1fr 1px 1fr 1px 1fr;
          width: 100%;
          max-width: 480px;
        }

        .fjw-meta-sep {
          background: #c4d4da;
          align-self: stretch;
          min-height: 48px;
        }

        .fjw-meta-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 0 12px;
        }

        .fjw-meta-label {
          font-family: 'Jost', sans-serif;
          font-size: 9px;
          font-weight: 400;
          letter-spacing: 0.3em;
          color: #8fa0a8;
          text-transform: uppercase;
        }

        .fjw-meta-value {
          font-family: 'Playfair Display', serif;
          font-size: 18px;
          font-weight: 400;
          color: #1c2e38;
          text-align: center;
        }

        /* ── 8. Footer accent bar ── */
        .fjw-footer-bar {
          width: 100%;
          height: 3px;
          background: linear-gradient(to right, #3a6070, #7a9aa8, #3a6070);
          margin-top: 48px;
        }
      `}</style>

      <div className="fjw-cover">

        {/* 1. Logo — top of page, above hero */}
        <div className="fjw-logo-block">
          <svg width="56" height="56" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M26 6 L32 18 L26 14 L20 18 Z" fill="#3a6070" opacity="0.9"/>
            <path d="M20 18 L26 14 L32 18 L38 26 L26 22 L14 26 Z" fill="#3a6070" opacity="0.65"/>
            <path d="M6 34 Q13 28 20 32 Q26 36 32 30 Q38 24 46 30 L46 44 Q38 38 32 42 Q26 46 20 42 Q13 38 6 44 Z" fill="#3a6070" opacity="0.45"/>
            <path d="M6 38 Q13 33 20 36 Q26 39 32 34 Q38 29 46 34" stroke="#3a6070" strokeWidth="1" fill="none" opacity="0.6"/>
            <path d="M6 42 Q13 37 20 40 Q26 43 32 38 Q38 33 46 38" stroke="#7a9aa8" strokeWidth="0.8" fill="none" opacity="0.5"/>
          </svg>
          <span className="fjw-logo-name">Fjord &amp; Waves</span>
          <span className="fjw-logo-tagline">Curated travel experiences</span>
        </div>

        {/* 2. Hero image */}
        <div className="fjw-hero">
          {heroImageUrl && <img src={heroImageUrl} alt={title} />}
        </div>

        {/* 3. Photo credit */}
        {photoCredit && (
          <p className="fjw-photo-credit">{photoCredit}</p>
        )}

        {/* 4–7. All text content */}
        <div className="fjw-body">

          {/* 4. Eyebrow */}
          <p className="fjw-eyebrow">{eyebrow}</p>

          {/* 5. Title */}
          <h1 className="fjw-title">{title}</h1>

          {/* Location line — optional */}
          {location && (
            <p className="fjw-location">{location}</p>
          )}

          {/* Diamond rule */}
          <div className="fjw-rule">
            <div className="fjw-rule-line" />
            <div className="fjw-rule-diamond" />
            <div className="fjw-rule-line" />
          </div>

          {/* 6. Short description — 2–3 sentences only, never full body text */}
          {shortDescription && (
            <p className="fjw-description">{shortDescription}</p>
          )}

          {/* 7. Metadata strip */}
          {(duration || region || season) && (
            <div className="fjw-meta">
              <div className="fjw-meta-item">
                <span className="fjw-meta-label">Duration</span>
                <span className="fjw-meta-value">{duration || "—"}</span>
              </div>
              <div className="fjw-meta-sep" />
              <div className="fjw-meta-item">
                <span className="fjw-meta-label">Region</span>
                <span className="fjw-meta-value">{region || "—"}</span>
              </div>
              <div className="fjw-meta-sep" />
              <div className="fjw-meta-item">
                <span className="fjw-meta-label">Season</span>
                <span className="fjw-meta-value">{season || "—"}</span>
              </div>
            </div>
          )}

        </div>

        {/* 8. Footer accent bar */}
        <div className="fjw-footer-bar" />

      </div>
    </>
  );
}
