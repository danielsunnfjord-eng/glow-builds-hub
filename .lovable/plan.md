# Homepage rebuild (EN / NO / PT)

## New homepage order
1. **Hero**: your headline and subheadline. Buttons: "Request a proposal" (opens the Groups Fora form in a new tab) and "Book a 20-minute call" (your existing Calendly link), plus a small WhatsApp link (your existing number). Background: a slow crossfade between your Rio surf/sunrise photos and the Sukkertoppen fjord sunset, with a dark overlay so the text stays readable.
2. **Four entry cards**: Folk High Schools, Sports Teams & Clubs, Surf & Outdoor, Corporate & Teams, using your texts and links (Norwegian links go to /no/...). Card photos come from your uploads (SUP Copacabana, Pedra do Arpoador, Praia do Flamengo, Museu do Amanhã and so on).
3. **Proof strip**: the four short facts, exactly as you wrote them.
4. **How it works**: six numbered steps (Talk to Evaluation).
5. **Safety strip**: one line plus a link to /safety (/no/trygghet).
6. **Local partner block**: added as a hidden note in the code until you send the step 4 text.
7. **Founder section**: the existing "Meet Daniel" stays where it is until the step 4 text arrives.
8. **Testimonials**: kept as they are now.
9. **Final call to action**: your text and buttons. "[24 hours]" stays as written until you confirm it.
10. Small link: "Planning a trip for yourself? See private travel."
11. **Footer**: unchanged.

## Moved to /private-travel
- The hotel portal section and "What does your travel advisor do?" move to the /private-travel page, together with the private travel cards and featured itineraries. Nothing is deleted.

## Things that are missing (shown only as hidden notes in the code, never on the page)
- **The step 4 texts** (local partner block and new founder text).
- **Portuguese copy**: no Portuguese text was given. Until you send it, the Portuguese homepage keeps the English layout with hidden notes, or I can translate it for you to check.
- **The RST logo and the Pablo_RST photo**: I'll save them for the local partner block and use them once the text is in.
- **Videos**: no video was uploaded. If you add one later, it can replace the hero photos.

## Technical details
- New `src/components/voyage/home/*` sections, with copy kept in the locale files under `home.*`. The Fora link comes from `GROUP_INTAKE_URL`, and the Calendly and WhatsApp links come from the existing helpers.
- Photos are uploaded as Lovable Assets pointers. The hero uses an image with `fetchpriority="high"`, and the other images lazy-load.
- `PrivateTravel` page: the placeholder is replaced with ClientPortal, WhyAdvisor, DualPathCards and FeaturedItineraries.
- Each locale's homepage `head()` copy is updated to match the new headline.
