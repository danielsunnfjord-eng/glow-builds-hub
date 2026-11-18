# Bring back the Admin link in the footer

- Add a small, low-key "Admin" link back to the site footer in English, Norwegian and Portuguese.
- It points to the sign-in page (/login); after signing in you go straight to the Admin panel as before.
- Nothing else changes: the Admin panel, sign-in and access rules stay the same, and only admins can see the data.

## Technical details
- Re-add the footer entry in the shared footer/navigation module (locale-aware login path).
- Update the footer test that currently asserts no Admin link.
- Update the theme-interest memory note that says the Admin link is hidden.
