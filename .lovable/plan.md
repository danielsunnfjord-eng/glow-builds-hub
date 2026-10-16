# Fora booking link: embedding isn't possible, so add a "Book with Fora" button

Fora's booking page (trips.foratravel.com/daniel-lira-figueiredo/book) blocks being shown inside other websites (it sends `X-Frame-Options: DENY`). Your intake form was blocked the same way, so it can't appear inside your page.

## What I'd do instead
- Add a "Book with Fora" button that opens the booking page in a new tab. It would look like the Plan My Trip / Start Your Journey buttons.
- Put it on the Plan My Trip page, under the video call button, in all 3 languages:
  - EN: "Book directly with Fora"
  - PT: "Reserve diretamente pela Fora"
  - NO: "Bestill direkte via Fora"

## Technical details
- Edit `src/pages/PlanMyTrip.tsx` to add an `<a target="_blank" rel="noopener noreferrer">` next to the Calendly link.
- Add the `planTrip.bookFora` text to `en.ts`, `pt.ts` and `no.ts`.
