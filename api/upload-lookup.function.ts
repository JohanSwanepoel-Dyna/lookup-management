export default async function (payload: {
  filePath: string;
  content: string;
  dplPattern: string;
  lookupField: string;
  displayName?: string;
  description?: string;
}) {
  const { filePath, content, dplPattern, lookupField, displayName, description } = payload;

  if (!filePath || !content) {
    return { error: "filePath and content are required" };
  }
  if (!dplPattern) {
    return { error: "dplPattern (parsePattern) is required" };
  }
  if (!lookupField) {
    return { error: "lookupField is required" };
  }

  if (!filePath.startsWith("/lookups/")) {
    return { error: "filePath must start with /lookups/" };
  }

  // Validate file path: only alphanumeric, -, _, ., / and must end with alphanumeric
  const pathRegex = /^\/[a-zA-Z0-9\-_./]+[a-zA-Z0-9]$/;
  if (!pathRegex.test(filePath)) {
    return {
      error:
        "Invalid file path. Must contain only alphanumeric characters, -, _, ., or / and end with an alphanumeric character.",
    };
  }

  const requestBody: Record<string, unknown> = {
    parsePattern: dplPattern,
    lookupField,
    filePath,
    overwrite: true,
  };
  if (displayName) requestBody.displayName = displayName;
  if (description) requestBody.description = description;

  const form = new FormData();
  form.append("request", JSON.stringify(requestBody));
  form.append("content", new Blob([content]), "data");

  const url =
    "/platform/storage/resource-store/v1/files/tabular/lookup:upload";

  try {
    const response = await fetch(url, {
      method: "POST",
      body: form,
      // Do NOT set Content-Type — fetch sets it automatically with the multipart boundary
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        error: `Upload failed (${response.status}): ${errorText}`,
      };
    }

    return { success: true, filePath };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return { error: `Upload error: ${message}` };
  }
}

