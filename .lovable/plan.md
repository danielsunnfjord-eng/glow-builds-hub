# Google Drive Hybrid Integration for Itinerary Editor

## Goal
Add Google Drive as a **backup, version-history and export target** for itineraries, while keeping the current TipTap editor + Paged.js PDF pipeline as the source of truth and the only renderer of the bespoke cover page, budget table, and styled output.

## Why this architecture
You answered:
- **Hybrid** — Drive is backup + export target, not master
- **Small team, sometimes editing in Docs** — needs round-trip but not real-time CRDT sync
- **Workspace Drive (connector)** — one account owns all docs, no per-user OAuth
- **Styling is critical** — Google Docs cannot reproduce the A4 cover, fluid intro, teal-accent budget table, or Paged.js page flow. Drive's "export to PDF" is therefore not usable for the final PDF; we keep the current renderer.

This means: the editor and database stay authoritative for what ships. Google Docs becomes a **mirror** the team can read/comment/edit in, and a **revision archive**. Edits made in Docs are pulled back on demand (manual "Pull from Google Doc"), not auto-merged, to avoid silently overwriting styled content.

## What gets built

### 1. Drive folder structure (auto-created)
```text
Fjord & Waves Itineraries/
├── Drafts/
│   └── {Itinerary Title} — {id-short}/
│       ├── {Title}.gdoc          ← live mirror of editor body
│       └── assets/               ← cover image, gallery (optional, phase 2)
└── Published/
    └── {Title} — {id-short}/
        ├── {Title}.gdoc          ← final mirror
        └── {Title}.pdf           ← Paged.js-rendered PDF
```

Folder IDs are stored in a `drive_settings` table so the team can change root locations without code changes.

### 2. Connectors to link
- **Google Drive** connector (for folder/file CRUD, PDF upload)
- **Google Docs** connector (for content read/write via batchUpdate)

Both use the workspace connector — no per-user OAuth.

### 3. Database additions
New columns on `catalog_itineraries` (and `shared_itineraries` if applicable):
- `gdrive_folder_id text`
- `gdoc_id text`
- `gdoc_last_synced_at timestamptz`
- `gdoc_last_pulled_at timestamptz`
- `pdf_drive_file_id text`

New table `drive_settings` (single-row config: root folder IDs for Drafts/Published).

### 4. Edge functions (Lovable Cloud)
| Function | Trigger | Job |
|---|---|---|
| `gdrive-create-itinerary-doc` | On new itinerary creation | Create draft folder, create empty Google Doc, save `gdoc_id` and `gdrive_folder_id` |
| `gdrive-push-itinerary` | "Save to Drive" button + autosave debounce (~30s) | Convert current TipTap JSON → Google Docs `batchUpdate` requests; replace doc content. Records `gdoc_last_synced_at`. |
| `gdrive-pull-itinerary` | "Pull from Google Doc" button | Fetch doc JSON, convert → TipTap JSON, return as a **diff preview** the user must accept before it replaces editor content. Records `gdoc_last_pulled_at`. |
| `gdrive-publish-itinerary` | "Publish to Catalogue" button | (a) push latest TipTap → gdoc, (b) move folder Drafts → Published, (c) upload generated PDF to the Published folder, (d) flip `is_published`, (e) save `pdf_drive_file_id` |

All functions go through the **connector gateway** (`https://connector-gateway.lovable.dev/google_drive/...` and `/google_docs/...`) using the linked workspace connection.

### 5. Editor UI changes (minimal)
Toolbar additions in `ItineraryEditor.tsx` / `Toolbar.tsx`:
- **"Drive" status pill** — shows `Synced 2 min ago` / `Draft — not synced` / `Pull available (edited in Docs)` with a link to open the Doc in a new tab
- **"Pull from Google Doc"** button — opens diff modal
- **"Publish to catalogue"** button — runs publish flow with progress toast

No change to the editor itself, the cover page, the budget estimator, or the PDF preview. The existing Paged.js pipeline continues to render the final PDF; we just upload that PDF to Drive after generation.

### 6. Sync model & conflict handling
- **Editor → Doc**: one-way push, debounced autosave. Always wins; replaces the doc body in one batchUpdate call.
- **Doc → Editor**: manual pull only, shown as a diff. Never auto-applied.
- **Last-write tracking**: `gdoc_last_synced_at` vs `gdoc_last_pulled_at` vs doc's `modifiedTime` from Drive metadata. If `modifiedTime > gdoc_last_synced_at`, surface the "Pull available" pill so the user knows Docs has newer changes before they push and overwrite.
- This avoids real-time CRDT complexity while making "edited in Docs" visible and recoverable.

### 7. Catalogue integration
`CatalogShopManager.tsx` already publishes itineraries. The Publish action gains one extra step (call `gdrive-publish-itinerary`) and stores `pdf_drive_file_id` so the catalogue can offer a "Open source doc" link to staff alongside the existing PDF download link for customers.

## Technical Notes

### TipTap ⇄ Google Docs conversion
Per the `google_docs` knowledge: convert **directly between TipTap JSON and Google Docs JSON**, not through HTML. Build two utilities in `src/lib/`:
- `tiptapToGoogleDocsRequests.ts` — TipTap doc → `batchUpdate` requests (insertText, updateTextStyle, updateParagraphStyle, deleteContentRange to clear first)
- `googleDocsToTiptap.ts` — Google Docs `body.content` → TipTap doc JSON

Mapping covers: paragraphs, heading levels, bold/italic/underline/strike, bullet/numbered lists, links, images. The **cover page block and budget table are not pushed to Docs** (they are tagged as non-portable nodes); a placeholder line like `[Cover page — edit in app]` and `[Budget table — edit in app]` is inserted in their place. This keeps Docs as a readable narrative mirror without letting collaborators break the styled blocks.

### PDF upload
The PDF is already produced in-browser by Paged.js (`PdfPreview.tsx`). On publish:
1. Trigger the existing PDF generation, capture the Blob
2. POST to `gdrive-publish-itinerary` as multipart with the blob + itinerary id
3. The function uploads to Drive via `POST /upload/drive/v3/files?uploadType=multipart`

### Connector scope warning
The Google Drive/Docs connector authenticates **one workspace account**. Every Doc and PDF lives in that account's Drive. Other team members access them via standard Drive sharing on the folder (set folder permissions once; new files inherit). This is fine for a small team and matches your answer.

### Out of scope (deliberately)
- Real-time bidirectional sync / operational transforms
- Per-user Google sign-in
- Replacing the Paged.js renderer with Drive's export-to-PDF
- Pushing/pulling cover-page styling or budget-table HTML to Docs

## Build order
1. Add Drive + Docs connectors, create `drive_settings` table + columns on itineraries
2. Build TipTap ⇄ Docs converters with unit-style smoke tests
3. `gdrive-create-itinerary-doc` + `gdrive-push-itinerary` + autosave + status pill
4. `gdrive-pull-itinerary` + diff modal
5. `gdrive-publish-itinerary` + PDF upload + catalogue wiring
6. Backfill: one-off action to create Drive docs for existing itineraries
