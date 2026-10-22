# Homepage rebuild (EN / NO / PT)

## New homepage order
1. **Hero**: your headline and subheadline. Buttons: "Request a proposal" (opens the Groups Fora form https://secure.foratravel.com/intake/98VwtEFIcy in a new tab) and "Book a 20-minute call" (your existing Calendly link), plus a small WhatsApp link (your existing number). Background: a slow crossfade between your Rio surf/sunrise photos and the Sukkertoppen fjord sunset, with a dark overlay so the text stays readable.
2. **Four entry cards**: Folk High Schools, Sports Teams & Clubs, Surf & Outdoor, Corporate & Teams, using your texts and linking to their planned pages (Norwegian links go to /no/...). Card photos come from your uploads.
3. **Proof strip**: the four short facts, exactly as you wrote them.
4. **How it works**: six numbered steps (Talk to Evaluation).
5. **Safety strip**: one line plus a link to /safety (/no/trygghet).
6. **Local partner block**: added as a hidden note in the code until you send the step 4 text.
7. **Founder section**: the existing "Meet Daniel" stays where it is until the step 4 text arrives.
8. **Testimonials**: only the two Rio testimonials (Ingeborg Sol Fure and Åge Avedal).
9. **Final call to action**: "Tell us about your group. I reply within one business day." (NO: "Jeg svarer innen én virkedag."), with your buttons.
10. Small link: "Planning a trip for yourself? See private travel."
11. **Footer**: unchanged.

## Moved to /private-travel
- The hotel portal section, "What does your travel advisor do?", the Rome testimonial, the private travel cards and featured itineraries. Nothing is deleted. Buttons on this page use the private Fora link https://secure.foratravel.com/intake/uRYFCpSsUZ.

## Rules applied
- No square brackets or placeholder text anywhere on the visible page. Unfinished items stay as code comments only.
- The private Fora link appears only on private travel pages. Group and homepage buttons use the Groups link.
- **Portuguese**: translated from the English text and marked as a draft in the code for you to review before publishing.

## Group pages not yet live
- The folk high school, sports and surf, corporate and safety pages, in both English and Norwegian, stay off the published site until their steps are done. On the published site those links send visitors to the homepage and search engines are told not to list them. In the preview they still open, so you can review them.
- Until a page is live, its homepage card sends published visitors to the Groups Fora form, so no one lands on an empty page.

## Still missing (hidden notes in the code only)
- The step 4 texts (local partner block and new founder text). The RST logo and the Pablo photo are saved for that block.
- No video was uploaded. One can replace the hero photos later.

## Technical details
- New `src/components/voyage/home/*` sections, with copy kept in the locale files under `home.*` (pt marked `// DRAFT – pending review`). `GROUP_INTAKE_URL` is checked against the exact link, and a test confirms the private link is used only on private paths.
- A `LIVE_GROUP_PAGES` flag in `travelNavigation.ts`. When a page is not live and `import.meta.env.PROD` is set, the route sends visitors to "/" and adds noindex, and the card link falls back to `GROUP_INTAKE_URL`. The sitemap leaves those pages out.
- Testimonials are filtered by name/location, and the Rome testimonial is rendered on /private-travel.
- Photos are uploaded as Lovable Assets pointers, with a high-priority hero image and the rest lazy-loaded. Each locale's homepage `head()` copy is updated.
