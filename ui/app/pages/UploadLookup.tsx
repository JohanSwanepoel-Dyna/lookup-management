import React, { useEffect, useRef, useState } from "react";
import { Button } from "@dynatrace/strato-components/buttons";
import { Flex } from "@dynatrace/strato-components/layouts";
import { Surface } from "@dynatrace/strato-components/layouts";
import { TitleBar } from "@dynatrace/strato-components/layouts";
import {
  Heading,
  Paragraph,
  Text,
} from "@dynatrace/strato-components/typography";
import { MessageContainer } from "@dynatrace/strato-components/content";
import { TextInput } from "@dynatrace/strato-components-preview/forms";
import { Select } from "@dynatrace/strato-components-preview/forms";
import { useAppFunction } from "@dynatrace-sdk/react-hooks";
import Colors from "@dynatrace/strato-design-tokens/colors";

const FILE_FORMATS = [
  { value: "csv", label: "CSV", contentType: "text/csv" },
  { value: "jsonl", label: "JSONL", contentType: "application/x-ndjson" },
  { value: "xml", label: "XML", contentType: "application/xml" },
] as const;

type UploadResult = { success?: boolean; error?: string };

export const UploadLookup = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [pathSuffix, setPathSuffix] = useState("");
  const [fileFormat, setFileFormat] = useState<string>("csv");
  const [dplPattern, setDplPattern] = useState("");
  const [lookupField, setLookupField] = useState("");
  const [fileName, setFileName] = useState<string>("");
  const [fileContent, setFileContent] = useState<string>("");
  const [previewLines, setPreviewLines] = useState<string[]>([]);
  const [pathError, setPathError] = useState<string>("");

  // Submission trigger
  const [submitPayload, setSubmitPayload] = useState<{
    filePath: string;
    content: string;
    dplPattern: string;
    lookupField: string;
  } | null>(null);
  const [triggerCount, setTriggerCount] = useState(0);

  const { isLoading, isError, isSuccess, error, refetch } =
    useAppFunction<UploadResult>(
      { name: "upload-lookup", data: submitPayload ?? {} },
      { autoFetch: false, autoFetchOnUpdate: false }
    );

  // Fire refetch once payload and trigger are ready
  useEffect(() => {
    if (triggerCount > 0 && submitPayload) {
      void refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerCount]);

  const validatePath = (value: string): string => {
    if (!value) return "Path is required";
    if (!/^[a-zA-Z0-9]/.test(value))
      return "Path must start with an alphanumeric character";
    if (!/^[a-zA-Z0-9\-_.\/]+$/.test(value))
      return "Path may only contain letters, numbers, -, _, ., or /";
    if (!/[a-zA-Z0-9]$/.test(value))
      return "Path must end with an alphanumeric character";
    return "";
  };

  const handlePathChange = (value: string) => {
    setPathSuffix(value);
    setPathError(validatePath(value));
  };

  const handleFormatChange = (value: string) => {
    setFileFormat(value);
    // Set a sensible default DPL pattern for JSONL; clear for others
    if (value === "jsonl") {
      setDplPattern("JSON:json");
    } else {
      setDplPattern("");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = (ev.target?.result as string) ?? "";
      setFileContent(text);
      setPreviewLines(text.split("\n").slice(0, 5));
    };
    reader.readAsText(file);
  };

  const handleUpload = () => {
    const pathValidation = validatePath(pathSuffix);
    if (pathValidation) {
      setPathError(pathValidation);
      return;
    }
    if (!fileContent || !dplPattern || !lookupField) return;

    const payload = {
      filePath: `/lookups/${pathSuffix}`,
      content: fileContent,
      dplPattern,
      lookupField,
    };

    setSubmitPayload(payload);
    setTriggerCount((c) => c + 1);
  };

  const handleReset = () => {
    setPathSuffix("");
    setFileFormat("csv");
    setDplPattern("");
    setLookupField("");
    setFileName("");
    setFileContent("");
    setPreviewLines([]);
    setPathError("");
    setSubmitPayload(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const isFormValid =
    !pathError && !!pathSuffix && !!fileContent && !!dplPattern && !!lookupField;

  return (
    <Flex flexDirection="column" padding={32} gap={24}>
      <TitleBar>
        <TitleBar.Title>Upload Lookup File</TitleBar.Title>
        <TitleBar.Subtitle>
          Upload CSV, JSONL, or XML data to Grail as a lookup table
        </TitleBar.Subtitle>
      </TitleBar>

      {isSuccess && (
        <MessageContainer variant="success" onDismiss={handleReset}>
          <MessageContainer.Title>Upload successful</MessageContainer.Title>
          <MessageContainer.Description>
            File uploaded to{" "}
            <strong>/lookups/{submitPayload?.filePath.replace("/lookups/", "")}</strong>
          </MessageContainer.Description>
        </MessageContainer>
      )}

      {isError && (
        <MessageContainer variant="critical">
          <MessageContainer.Title>Upload failed</MessageContainer.Title>
          <MessageContainer.Description>
            {error?.message ?? "An unexpected error occurred"}
          </MessageContainer.Description>
        </MessageContainer>
      )}

      <Surface elevation="raised">
        <Flex flexDirection="column" padding={24} gap={20}>
          {/* Lookup path */}
          <Flex flexDirection="column" gap={4}>
            <Text>Lookup file path</Text>
            <Flex alignItems="center" gap={0}>
              <Flex
                alignItems="center"
                style={{
                  padding: "0 12px",
                  height: "32px",
                  background: Colors.Background.Field.Neutral.Default,
                  border: `1px solid ${Colors.Border.Neutral.Default}`,
                  borderRight: "none",
                  borderRadius: "3px 0 0 3px",
                  whiteSpace: "nowrap",
                  userSelect: "none",
                }}
              >
                <Text>/lookups/</Text>
              </Flex>
              <div style={{ flex: 1 }}>
                <TextInput
                  placeholder="team/my_lookup_table"
                  value={pathSuffix}
                  onChange={handlePathChange}
                  style={{ borderRadius: "0 3px 3px 0" }}
                />
              </div>
            </Flex>
            {pathError && (
              <Text style={{ color: Colors.Text.Critical.Default }}>
                {pathError}
              </Text>
            )}
            {pathSuffix && !pathError && (
              <Text style={{ color: Colors.Text.Neutral.Subdued }}>
                Full path: /lookups/{pathSuffix}
              </Text>
            )}
          </Flex>

          {/* File format */}
          <Flex flexDirection="column" gap={4}>
            <Text>File format</Text>
            <Select
              value={fileFormat}
              onChange={(v) => handleFormatChange(v as string)}
            >
              <Select.Content>
                {FILE_FORMATS.map((f) => (
                  <Select.Option key={f.value} value={f.value}>
                    {f.label}
                  </Select.Option>
                ))}
              </Select.Content>
            </Select>
          </Flex>

          {/* DPL Pattern */}
          <Flex flexDirection="column" gap={4}>
            <Text>DPL parse pattern <span style={{ color: Colors.Text.Critical.Default }}>*</span></Text>
            <TextInput
              value={dplPattern}
              onChange={setDplPattern}
              placeholder={
                fileFormat === "jsonl"
                  ? "JSON:json"
                  : fileFormat === "csv"
                  ? "e.g. LD:col1 ',' LD:col2 ',' LD:col3"
                  : "e.g. XML{field1:LD:value}"
              }
            />
            <Text style={{ color: Colors.Text.Neutral.Subdued }}>
              Dynatrace Pattern Language expression used to parse your file into tabular records
            </Text>
          </Flex>

          {/* Lookup field */}
          <Flex flexDirection="column" gap={4}>
            <Text>Lookup field <span style={{ color: Colors.Text.Critical.Default }}>*</span></Text>
            <TextInput
              value={lookupField}
              onChange={setLookupField}
              placeholder="e.g. code, id, hostname"
            />
            <Text style={{ color: Colors.Text.Neutral.Subdued }}>
              The field from your data used as the unique record identifier (used for deduplication)
            </Text>
          </Flex>

          {/* File picker */}
          <Flex flexDirection="column" gap={4}>
            <Text>File</Text>
            <Flex alignItems="center" gap={12}>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="default"
              >
                Choose file
              </Button>
              {fileName ? (
                <Text>{fileName}</Text>
              ) : (
                <Text style={{ color: Colors.Text.Neutral.Subdued }}>
                  No file chosen
                </Text>
              )}
            </Flex>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.jsonl,.json,.xml,.txt"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
          </Flex>

          {/* Preview */}
          {previewLines.length > 0 && (
            <Flex flexDirection="column" gap={4}>
              <Text>Preview (first 5 lines)</Text>
              <pre
                style={{
                  margin: 0,
                  padding: "12px",
                  background: Colors.Background.Surface.Default,
                  border: `1px solid ${Colors.Border.Neutral.Default}`,
                  borderRadius: "3px",
                  overflowX: "auto",
                  fontSize: "12px",
                  lineHeight: "1.6",
                  maxHeight: "160px",
                  overflowY: "auto",
                }}
              >
                {previewLines.join("\n")}
              </pre>
            </Flex>
          )}

          {/* Actions */}
          <Flex justifyContent="flex-end" gap={8}>
            <Button variant="default" onClick={handleReset} disabled={isLoading}>
              Reset
            </Button>
            <Button
              variant="emphasized"
              color="primary"
              onClick={handleUpload}
              disabled={!isFormValid || isLoading}
              loading={isLoading}
            >
              Upload
            </Button>
          </Flex>
        </Flex>
      </Surface>

      {/* Help text */}
      <Surface elevation="flat">
        <Flex flexDirection="column" padding={16} gap={8}>
          <Heading level={4}>Tips</Heading>
          <Paragraph>
            Use <strong>/lookups/team/table_name</strong> style paths to
            organise files by team or purpose.
          </Paragraph>
          <Paragraph>
            Once uploaded, reference the file in DQL using:{" "}
            <code>
              load &quot;/lookups/{pathSuffix || "your/file"}&quot;
            </code>
          </Paragraph>
          <Paragraph>
            Maximum file size is <strong>100 MB</strong> with up to{" "}
            <strong>128 fields</strong>. Uploading to an existing path will
            overwrite it.
          </Paragraph>
        </Flex>
      </Surface>
    </Flex>
  );
};
