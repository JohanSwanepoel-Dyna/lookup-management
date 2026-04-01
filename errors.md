# Known Issues

## ~~Issue 1 — Incorrect Resource Store API endpoint (404)~~ ✅ FIXED

**Fix:** Updated `api/upload-lookup.function.ts` to use the correct endpoint:
```
/platform/storage/resource-store/v1/files/tabular/lookup:upload?path=<filePath>&pattern=<dplPattern>
```
The optional `dplPattern` parameter is now passed as a `pattern` query parameter. The `dplPattern` field has been added to the function payload so the UI can supply it (see Issue 2).

---

## ~~Issue 2 — No DPL pattern or content-type selection in the upload form~~ ✅ FIXED

**Symptom:** The upload form has a "File format" dropdown (CSV / JSONL / XML) but:
- There is no way to provide a **Dynatrace Pattern Language (DPL)** expression to control how the file is parsed when stored in Grail.
- The Resource Store API uses DPL to parse uploaded data into tabular format — without the right pattern, the file may be rejected or parsed incorrectly.

**Fix:** Added an optional **DPL pattern** text field to the upload form, passed as the `pattern` query parameter in the API request.

---

## ~~Issue 3 — LookupList columns not resizable and missing row/column dividers~~ ✅ FIXED

**File:** `ui/app/pages/LookupList.tsx`

**Fix:** Added `resizable` prop to enable drag-to-resize columns, and `variant={{ rowSeparation: 'horizontalDividers', verticalDividers: true }}` to show clear lines between rows and columns.

---

## ~~Issue 4 — ViewLookup result table is empty and query runs automatically~~ ✅ FIXED

**File:** `ui/app/pages/ViewLookup.tsx`

**Fix:**
- **Empty results**: `data.types` is a `RangedFieldTypes[]` array, so `Object.keys(data.types)` was returning array indices (`"0"`, `"1"`, …) instead of field names. Fixed by deriving column keys from `data.types[0]?.mappings` which is the `{ [fieldName]: FieldType }` mapping object.
- **Auto-run**: `activeQuery` was initialized to the load query, causing `useDql` to fire immediately. Fixed by initializing `activeQuery` to `""` and passing `enabled: activeQuery !== ""` as a `useDql` option so the query only runs after the user explicitly triggers it.
