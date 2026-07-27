## Problem
The WhatsApp buttons currently use `https://wa.me/+4799191574` with `target="_blank"`. In some browsers this triggers a redirect through `api.whatsapp.com`, which can be blocked by popup blockers or ad blockers, producing the "api.whatsapp.com er blokkert" message.

## Root cause
- `wa.me` with a `+` prefix is non-standard and can cause the redirect to fail.
- `target="_blank"` makes the browser treat the click as a popup, increasing the chance of it being blocked.

## Plan
1. **Normalize the WhatsApp URL format**  
   Replace all `https://wa.me/+4799191574` links with `https://wa.me/4799191574` (no plus sign, full international number). This is the format WhatsApp documents and is less likely to redirect through a blocked `api.whatsapp.com` path.

2. **Remove `target="_blank"` from WhatsApp links**  
   WhatsApp `wa.me` links already open the right client (web on desktop, app on mobile). Opening in the same tab avoids popup-blocker interference and the "blocked" message.

3. **Centralize the URL in a helper (optional but recommended)**  
   Create a small `WHATSAPP_URL` constant or `getWhatsAppUrl(phone, text)` helper so all Navbar and subpage buttons use the same, verified URL and we don't drift back into the `+` version.

4. **Affected files**  
   - `src/components/voyage/Navbar.tsx` (desktop nav + mobile menu)  
   - `src/pages/ItineraryShopDetail.tsx` (sidebar WhatsApp CTA)

5. **Verification**  
   - Type-check the project after edits.  
   - Smoke-test the link in the preview: desktop should open `web.whatsapp.com`, mobile should open the WhatsApp app or an app-prompt page.

No other changes are needed.