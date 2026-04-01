# Lookup Management App — Feature Plan

A Dynatrace App to manage lookup data stored in Grail, replacing the need to interact with the Resource Store API directly.

---

## Core Features

### 1. Browse & List Lookup Files
- List all lookup files in the environment (`fetch dt.system.files`)
- Display file path, size, field count, and last modified date
- Folder-style navigation that mirrors the `/lookups/...` path hierarchy
- Search and filter across file names and paths

### 2. View Lookup Data
- Inspect the contents of any lookup file in a data table (`load "/lookups/..."`)
- Column sorting, filtering, and pagination for large datasets
- Display file metadata (field count, row count, size)

### 3. Create New Lookup Table
- Build a lookup table from scratch directly in the UI
- Add/remove/rename columns with type selection
- Add rows via an inline editable table
- Specify the target file path (with `/lookups/` prefix enforced and naming convention validation)

### 4. Upload Lookup Data
- Upload CSV, JSONL, or XML files from the local machine
- Parse preview before committing (leveraging DPL test-parse endpoint)
- Validate against Grail limits (100 MB max size, 128 max fields)
- Choose target path or overwrite an existing file

### 5. Edit Existing Lookup Data
- Open a lookup file in an editable table view
- Add, edit, and delete individual rows
- Add or remove columns
- Save changes (re-upload the full file to Grail)

### 6. Delete Lookup Files
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

### B2 — Row actions: Delete and View lookup content

**Context:** The lookup list table needs per-row actions for the two most common operations.

#### Action 1 — Delete with confirmation
- Render a **Delete** button (red/critical, `DeleteIcon`) in each row via `DataTable.RowActions`
- On click, open a `Modal` (from `@dynatrace/strato-components/overlays`) asking: *"Are you sure you want to delete /lookups/…? This is irreversible."*
- On confirm, call the `delete-lookup` app function via `useAppFunction` with `{ name: "delete-lookup", data: { filePath: row.name } }`
- After success, call `refetch()` on the DQL query to reload the table and show a success `MessageContainer`
- On error, show a critical `MessageContainer` with the error message
- The modal must be dismissible (cancel button + ESC)

**Key components/hooks:**
- `Modal` from `@dynatrace/strato-components/overlays` — props: `show`, `title`, `onDismiss`, `footer`
- `useAppFunction` from `@dynatrace-sdk/react-hooks` with `{ autoFetch: false, autoFetchOnUpdate: false }`, triggered via `refetch()`
- `DeleteIcon` from `@dynatrace/strato-icons`
- `DataTable.RowActions` — children is a render function: `(row) => <ReactElement>`

#### Action 2 — View / query lookup content
- Render a **View** button (`ViewIcon`) in each row
- On click, navigate to `/view?path=<encodedFilePath>` (use `useNavigate` + `URLSearchParams`)
- Create a new page `ViewLookup.tsx` at `/view` route that:
  1. Reads the `path` query param via `useSearchParams`
  2. Pre-populates a `DQLEditor` with `load "<path>"` (the DQL `load` command fetches tabular file content)
  3. On page load (and on "Run" click), executes the query via `useDql`
  4. Renders results in a `DataTable` — since the schema is dynamic (varies per file), derive columns from `data.types` keys at runtime
  5. Shows record count in the title bar
- Add `"View lookup"` to the nav only when on that route (or just rely on TitleBar breadcrumb-style back button using `useNavigate(-1)`)

**DQL pattern to pre-populate:**
```
load "/lookups/your/file"
```

**Column derivation from dynamic schema:**
```ts
const columns = Object.keys(data.types ?? {}).map((key) => ({
  id: key,
  header: key,
  accessor: (row) => row[key],
}));
```

---

| Phase | Features |
|-------|----------|
| **Phase 1 — MVP** | Browse & List, View Data, Upload, Delete |
| **Phase 2 — Edit** | Create from Scratch, Edit Existing, Export |
| **Phase 3 — Polish** | DQL Snippets, Duplicate, Folder Navigation |
| **Phase 4 — Advanced** | Bulk Import, Validation Rules, Diff, Usage Insights |
