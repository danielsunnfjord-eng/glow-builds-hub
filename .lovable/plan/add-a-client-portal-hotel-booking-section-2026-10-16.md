# Add a "Client Portal" hotel booking section

Fora's portal can't be shown inside your site, so this adds a section with your text and a button that opens the portal in a new tab.

## What visitors will see
- A small label, "Client Portal", then the heading "A new way to plan and book hotels with me".
- Your text, in two short paragraphs:
  - "My Client Portal lets you browse hotels, compare rates and perks, and book when you're ready. Explore options for a trip we're planning together and send me what catches your eye, or use it to book a straightforward stay on your own. I'll still be your advisor every step of the way, just like always."
  - "And if you don't see what you're looking for, just reach out. I'm always here to help."
- A gold button, "Browse & book hotels". It opens https://trips.foratravel.com/daniel-lira-figueiredo/book in a new tab.
- The section uses the same colours and fonts as the rest of the site.

## Where it goes
- On the homepage, just after "Meet Daniel".
- On the Plan My Trip page, under the video call button.

## Languages
The text will be translated into Portuguese (pt-BR) and Norwegian, keeping the same personal tone. Each language version of the site shows its own text.

## Technical details
- New `src/components/voyage/ClientPortal.tsx` (uses `useTranslation`, external `<a target="_blank" rel="noopener noreferrer">`).
- Lazy-load it in `src/pages/Index.tsx` after `MeetDaniel`, and render it in `src/pages/PlanMyTrip.tsx`.
- Add a `clientPortal` block (`badge`, `title`, `p1`, `p2`, `cta`) to `en.ts`, `pt.ts` and `no.ts`.
