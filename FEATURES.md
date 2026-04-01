# Lookup Management App — Feature Plan

A Dynatrace App to manage lookup data stored in Grail, replacing the need to interact with the Resource Store API directly.

---

## Core Features

### 1. Browse & List Lookup Files ✅(DONE)
- List all lookup files in the environment (`fetch dt.system.files`)
- Display file path, size, field count, and last modified date
- Folder-style navigation that mirrors the `/lookups/...` path hierarchy
- Search and filter across file names and paths

### 2. View Lookup Data ✅(DONE)
- Inspect the contents of any lookup file in a data table (`load "/lookups/..."`)
- Column sorting, filtering, and pagination for large datasets
- Display file metadata (field count, row count, size)

### 3. Create New Lookup Table 
- Build a lookup table from scratch directly in the UI
- Add/remove/rename columns with type selection
- Add rows via an inline editable table
- Specify the target file path (with `/lookups/` prefix enforced and naming convention validation)

### 4. Upload Lookup Data ✅(DONE)
- Upload CSV, JSONL, or XML files from the local machine
- Parse preview before committing (leveraging DPL test-parse endpoint)
- Validate against Grail limits (100 MB max size, 128 max fields)
- Choose target path or overwrite an existing file

### 6. Delete Lookup Files ✅(DONE)
- Delete individual files with confirmation prompt
- Bulk-select and delete multiple files at once

---

## Quality-of-Life Features

### 7. Export / Download
- Export any lookup table as CSV for local use or backup
- Copy table data to clipboard

### 8. DQL Snippet Generator
- Auto-generate example DQL queries for the selected lookup file:
  - `load "/lookups/..."` to inspect it
  - `lookup` command to enrich logs/spans/events
  - `join` command example
- Copy-to-clipboard for quick use in Notebooks or the DQL console

### 9. Duplicate Lookup File
- Clone an existing lookup file to a new path
- Useful for creating variants or backups before editing

### 10. Folder / Path Management
- Visual tree or breadcrumb navigation of the `/lookups/` namespace
- Create new "folders" (path prefixes) when uploading or creating lookups
- See file counts per folder

---

## Advanced Features (Future Consideration)

### 11. Bulk Import
- Upload multiple files at once via drag-and-drop
- Map each file to a target path before committing

### 12. Data Validation Rules
- Define expected column names/types for a lookup
- Warn on upload if schema doesn't match expectations
- Show field-level validation errors inline

### 13. Usage Insights
- Show where a lookup file is referenced in Dashboards or Notebooks (if discoverable)
- Display query patterns that use the lookup (`lookup` / `join` commands)

### 14. Compare / Diff
- Side-by-side comparison of two lookup files
- Highlight added, removed, and changed rows when re-uploading

### 15. Permissions Overview
- Display current user's effective permissions (`storage:files:read/write/delete`)
- Surface helpful errors when an action is blocked by insufficient permissions

---

## Technical Notes

- **API**: Resource Store API for upload, delete, and parse-test operations
- **DQL**: `fetch dt.system.files` to list files; `load` command to read contents
- **Required scopes**: `storage:files:read`, `storage:files:write`, `storage:files:delete`
- **Limits**: 10,000 files/env, 100 MB/file, 128 fields/file
- **File formats**: CSV, JSONL, XML (parsed via Dynatrace Pattern Language)

---

## Backlog

### B1 — Auto-suggest DPL pattern for CSV uploads

**Context:** When uploading a CSV file, the user must manually enter a DPL parse pattern (e.g. `LD:col1 ',' LD:col2`). This is error-prone and unfriendly for users unfamiliar with DPL.

**Goal:** Automatically derive a sensible DPL pattern by inspecting the CSV content when the file is selected, and pre-populate the DPL pattern field. The user can still edit it freely before uploading.

**Proposed logic (client-side, runs after file is read):**

1. **Detect the delimiter** — scan the first few lines for the most common delimiter character (`,`, `;`, `\t`, `|`). Default to `,`.
2. **Read the header row** — treat the first line as column names, split on the detected delimiter, and trim whitespace.
3. **Sanitise column names** — strip characters that are invalid in DPL field names (keep `a-zA-Z0-9_`); replace spaces with `_`.
4. **Infer field types per column** — sample up to 10 data rows and apply these rules per column:
   - All values parse as integer → use `INT:<name>`
   - All values parse as float/double → use `DOUBLE:<name>`
   - Otherwise → use `LD:<name>` (line data / string)
5. **Build the pattern string** — join the typed tokens with the detected delimiter literal in DPL (e.g. `','` for comma), wrapped in single quotes: `INT:code ',' LD:category ',' LD:message`
6. **Handle quoting** — if values are wrapped in double quotes, prepend `CSV` matcher or wrap token in `'"' ... '"'` pairs as appropriate.
7. **Set `lookupField` suggestion** — pre-populate the lookup field input with the first column name as a reasonable default (user can change it).
8. **Skip the header** — set `skippedRecords: 1` in the upload request so the header line is not stored as a data record. Add this as a hidden/optional field in the form.

**UI changes needed:**
- After file selection, run the above logic in a `useEffect` or inline in `handleFileChange`.
- Show a dismissible info banner: *"DPL pattern was auto-generated from your CSV headers. Review before uploading."*
- Keep the DPL and lookup field inputs editable so users can override.

**Stretch:** Wire up the `:test-pattern` endpoint (`/platform/storage/resource-store/v1/files/tabular/lookup:test-pattern`) to let the user preview the parsed records before committing to upload, using the current pattern value.

---

### B2 — Route to View Lookup page after successful upload

**Context:** After a successful upload, the user sees a success banner on the Upload page but has to manually navigate to the Lookup List and then open the file to verify the result. This adds unnecessary friction.

**Goal:** Automatically navigate the user to the View Lookup page for the file they just uploaded, so they can immediately inspect the records.

**Proposed implementation (`ui/app/pages/UploadLookup.tsx`):**

1. **Capture the uploaded file path** — the upload payload already contains `filePath`. The success state from `useAppFunction` fires after a confirmed successful upload.
2. **Add a short delay before redirecting** — show the success banner for ~2 seconds so the user sees confirmation, then navigate. Use `setTimeout` inside a `useEffect` that watches `isSuccess`.
3. **Navigate to the View Lookup page** — call `navigate(`/view?path=${encodeURIComponent(filePath)}`)` where `filePath` is taken from `submitPayload?.filePath`.
4. **Provide a manual link as fallback** — instead of (or in addition to) the auto-redirect, add a **"View uploaded file"** `Button` inside the success `MessageContainer` that navigates immediately on click. This gives users control if they want to stay on the upload page to upload another file.

**Files to change:**
- `ui/app/pages/UploadLookup.tsx` — add `useNavigate`, add `useEffect` on `isSuccess`, add "View uploaded file" button to the success message.

**Example `useEffect`:**
```tsx
useEffect(() => {
  if (isSuccess && submitPayload?.filePath) {
    const timer = setTimeout(() => {
      navigate(`/view?path=${encodeURIComponent(submitPayload.filePath)}`);
    }, 2000);
    return () => clearTimeout(timer);
  }
}, [isSuccess, submitPayload, navigate]);
```



---

### B3 — Improved upload error handling with pre-upload pattern validation

**Context:** The current upload flow sends the file directly to the Resource Store API. If the DPL pattern is wrong, the API returns a cryptic error after the full file has already been transmitted. Users get no early warning that the pattern is invalid, and large files make this painful.

**Goal:** Validate the DPL parse pattern against the actual file content *before* committing to upload, surface clear field-level errors to the user, and only proceed to the real upload if validation passes.

**Proposed implementation:**

#### Step 1 — Pre-upload pattern test via `:test-pattern` endpoint

Use the Resource Store test endpoint to dry-run the parse pattern against the first N lines of the file:

```
POST /platform/storage/resource-store/v1/files/tabular/lookup:test-pattern
```

This should be called in a **new backend function** (`api/test-lookup-pattern.function.ts`) that accepts `{ content, dplPattern, lookupField }` and returns either the parsed preview records or a structured error.

```ts
// api/test-lookup-pattern.function.ts
export default async function(payload: {
  content: string;
  dplPattern: string;
  lookupField: string;
}) { ... }
```

#### Step 2 — Add a "Validate & Preview" step in the UI

Replace the single **Upload** button flow with a two-step flow:

1. **Validate** (new button) — calls `test-lookup-pattern` function, shows a preview table of the parsed records inside the form. Highlights errors inline (e.g. "Pattern failed to parse row 3").
2. **Upload** (existing button, only enabled after successful validation) — proceeds with the actual upload.

Alternatively, run validation automatically after file selection and pattern entry (debounced, ~800 ms after the user stops typing in the DPL field).

#### Step 3 — Improve API error messages

The current error handling just forwards the raw API response text. Improve this in `api/upload-lookup.function.ts`:

- Parse the error response body as JSON and extract the `detail` or `message` field if present.
- Map known HTTP status codes to user-friendly messages:
  - `400` → "Invalid parse pattern or file format — check your DPL pattern."
  - `409` → "A file already exists at this path. Enable overwrite or choose a different path."
  - `413` → "File exceeds the 100 MB size limit."
  - `422` → "File could not be parsed — verify the DPL pattern matches your data."
- Return a structured `{ error: string, detail?: string }` so the UI can show both a summary and a detail message.

#### Step 4 — Field-level validation in the UI

Before even calling the backend, add client-side guards in `handleUpload` (`ui/app/pages/UploadLookup.tsx`):

- Warn if `dplPattern` contains the placeholder column names (e.g. `field_0`, `field_1`) that suggest the auto-suggest fallback fired without real headers.
- Warn if `lookupField` doesn't match any token name in the DPL pattern.
- Warn if the file is larger than 100 MB before uploading.

**Files to change:**
- `api/test-lookup-pattern.function.ts` — new backend function for pattern dry-run.
- `api/upload-lookup.function.ts` — improved error parsing and mapping.
- `ui/app/pages/UploadLookup.tsx` — two-step validate/upload flow, field-level warnings, preview table.


| Phase | Features |
|-------|----------|
| **Phase 1 — MVP** | Browse & List, View Data, Upload, Delete |
| **Phase 2 — Edit** | Create from Scratch, Edit Existing, Export |
| **Phase 3 — Polish** | DQL Snippets, Duplicate, Folder Navigation |
| **Phase 4 — Advanced** | Bulk Import, Validation Rules, Diff, Usage Insights |
