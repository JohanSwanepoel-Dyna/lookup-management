# Known Issues

## ~~Issue 1 — Incorrect Resource Store API endpoint (404)~~ ✅ FIXED

**Fix:** Updated `api/upload-lookup.function.ts` to use the correct endpoint:
```
/platform/storage/resource-store/v1/files/tabular/lookup:upload?path=<filePath>&pattern=<dplPattern>
```
The optional `dplPattern` parameter is now passed as a `pattern` query parameter. The `dplPattern` field has been added to the function payload so the UI can supply it (see Issue 2).

---

## Issue 2 — No DPL pattern or content-type selection in the upload form

**Symptom:** The upload form has a "File format" dropdown (CSV / JSONL / XML) but:
- There is no way to provide a **Dynatrace Pattern Language (DPL)** expression to control how the file is parsed when stored in Grail.
- The Resource Store API uses DPL to parse uploaded data into tabular format — without the right pattern, the file may be rejected or parsed incorrectly.

**To do:**
- Add an optional **DPL pattern** text field to the upload form.
- The DPL pattern should be passed alongside the file content in the API request (likely as a request parameter or multipart field — confirm from API docs).
- Consider providing sensible default DPL patterns for each format (e.g. a basic CSV pattern) to make the field easier to use.
