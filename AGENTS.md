# Architecture rules
- New audience pages use the existing optional-locale route layout and shared navigation/footer; keep their missing content in code comments until supplied.
- Map translated route slugs through `localizedRoutePath` so menus, language switches and canonical/hreflang links share the same URL mapping.
- Keep enquiry destinations and audience navigation in the shared travel navigation module to avoid inconsistent links across menus and footers.