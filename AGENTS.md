# Architecture rules
- New audience pages use the existing optional-locale route layout and shared navigation/footer; keep their missing content in code comments until supplied.
- Map translated route slugs through `localizedRoutePath` so menus, language switches and canonical/hreflang links share the same URL mapping.
- Keep enquiry destinations and audience navigation in the shared travel navigation module to avoid inconsistent links across menus and footers.
- Corporate sample itineraries live in a locale-keyed data module used by tables and duration tests so the confirmed day counts cannot drift.
- Concierge hub pages share a locale-aware presentation and choice definitions; keep their destinations explicit and test them so private and group enquiries cannot be mixed.
- Keep destination partner blocks reusable; unconfirmed partner blocks render nothing so missing supplier details cannot appear publicly.
- Always lazy-load components with `lazyWithRetry` from `@/lib/lazyWithRetry`, never React's plain `lazy`: root-level imports (Calendly badge, Admin) sit outside the router's error boundary, so a failed chunk load mid-reload would otherwise unmount the whole app and blank the screen.
- Module recovery retries transient imports and uses per-module time-bounded reload guards; optional widgets have a local error boundary so persistent chunk failures cannot blank the main pages.- Theme Travels pages (/trips, /no/reiser and trip details) share the locale-keyed data module src/lib/themeTrips.ts; keep periods, slugs and the no-price rule explicit and tested so interest signups never mix trips or languages.
