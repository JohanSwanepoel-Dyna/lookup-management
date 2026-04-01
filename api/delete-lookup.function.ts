export default async function (payload: { filePath: string }) {
  const { filePath } = payload;

  if (!filePath) {
    return { error: "filePath is required" };
  }

  if (!filePath.startsWith("/lookups/")) {
    return { error: "filePath must start with /lookups/" };
  }

  const url = "/platform/storage/resource-store/v1/files:delete";

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ filePath }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        error: `Delete failed (${response.status}): ${errorText}`,
      };
    }

    return { success: true, filePath };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return { error: `Delete error: ${message}` };
  }
}
