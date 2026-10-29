# Architecture rules
- New audience pages use the existing optional-locale route layout and shared navigation/footer; keep their missing content in code comments until supplied.
- Map translated route slugs through `localizedRoutePath` so menus, language switches and canonical/hreflang links share the same URL mapping.
- Keep enquiry destinations and audience navigation in the shared travel navigation module to avoid inconsistent links across menus and footers.
- Concierge hub pages share a locale-aware presentation and choice definitions; keep their destinations explicit and test them so private and group enquiries cannot be mixed.
- Keep destination partner blocks reusable; unconfirmed partner blocks render nothing so missing supplier details cannot appear publicly.
- Always lazy-load components with `lazyWithRetry` from `@/lib/lazyWithRetry`, never React's plain `lazy`: root-level imports (Calendly badge, Admin) sit outside the router's error boundary, so a failed chunk load mid-reload would otherwise unmount the whole app and blank the screen.