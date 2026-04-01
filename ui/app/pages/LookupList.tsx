import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@dynatrace/strato-components/buttons";
import { Flex } from "@dynatrace/strato-components/layouts";
import { TitleBar } from "@dynatrace/strato-components/layouts";
import { Text } from "@dynatrace/strato-components/typography";
import { MessageContainer } from "@dynatrace/strato-components/content";
import { DataTable } from "@dynatrace/strato-components-preview/tables";
import { ProgressCircle } from "@dynatrace/strato-components/content";
import { useDql } from "@dynatrace-sdk/react-hooks";
import Colors from "@dynatrace/strato-design-tokens/colors";
import { UploadIcon, RefreshIcon } from "@dynatrace/strato-icons";

type LookupFile = {
  name: string;
  display_name: string;
  description: string;
  records: number;
  size: number;
  lookup_field: string;
  modified_timestamp: string;
  user_email: string;
};

const DQL_QUERY = `fetch dt.system.files
| filter startsWith(name, "/lookups/")
| fields name, display_name, description, records, size, lookup_field, modified.timestamp, user.email
| sort name asc`;

const columns = [
  {
    id: "name",
    header: "File path",
    accessor: "name" as keyof LookupFile,
  },
  {
    id: "display_name",
    header: "Display name",
    accessor: "display_name" as keyof LookupFile,
    cell: ({ value }: { value: unknown }) =>
      value ? <span>{String(value)}</span> : <span style={{ color: Colors.Text.Neutral.Subdued }}>—</span>,
  },
  {
    id: "records",
    header: "Records",
    accessor: "records" as keyof LookupFile,
    cell: ({ value }: { value: unknown }) =>
      value != null ? <span>{Number(value).toLocaleString()}</span> : <span>—</span>,
  },
  {
    id: "size",
    header: "Size",
    accessor: "size" as keyof LookupFile,
    cell: ({ value }: { value: unknown }) => {
      const bytes = Number(value);
      if (!bytes) return <span>—</span>;
      if (bytes < 1024) return <span>{bytes} B</span>;
      if (bytes < 1024 * 1024) return <span>{(bytes / 1024).toFixed(1)} KB</span>;
      return <span>{(bytes / (1024 * 1024)).toFixed(1)} MB</span>;
    },
  },
  {
    id: "lookup_field",
    header: "Lookup field",
    accessor: "lookup_field" as keyof LookupFile,
    cell: ({ value }: { value: unknown }) =>
      value ? <code>{String(value)}</code> : <span style={{ color: Colors.Text.Neutral.Subdued }}>—</span>,
  },
  {
    id: "modified_timestamp",
    header: "Last modified",
    accessor: "modified_timestamp" as keyof LookupFile,
    cell: ({ value }: { value: unknown }) => {
      if (!value) return <span>—</span>;
      try {
        return <span>{new Date(String(value)).toLocaleString()}</span>;
      } catch {
        return <span>{String(value)}</span>;
      }
    },
  },
  {
    id: "user_email",
    header: "Uploaded by",
    accessor: "user_email" as keyof LookupFile,
    cell: ({ value }: { value: unknown }) =>
      value ? <span>{String(value)}</span> : <span style={{ color: Colors.Text.Neutral.Subdued }}>—</span>,
  },
];

export const LookupList = () => {
  const navigate = useNavigate();

  const { data, error, isLoading, refetch } = useDql({ query: DQL_QUERY });

  const rows = useMemo<LookupFile[]>(() => {
    if (!data?.records) return [];
    return data.records.map((r) => ({
      name: String(r["name"] ?? ""),
      display_name: String(r["display_name"] ?? ""),
      description: String(r["description"] ?? ""),
      records: Number(r["records"] ?? 0),
      size: Number(r["size"] ?? 0),
      lookup_field: String(r["lookup_field"] ?? ""),
      modified_timestamp: String(r["modified.timestamp"] ?? ""),
      user_email: String(r["user.email"] ?? ""),
    }));
  }, [data]);

  return (
    <Flex flexDirection="column" padding={32} gap={24}>
      <TitleBar>
        <TitleBar.Title>Lookup Tables</TitleBar.Title>
        <TitleBar.Subtitle>
          All lookup files stored in Grail under /lookups/
        </TitleBar.Subtitle>
        <TitleBar.Action>
          <Flex gap={8}>
            <Button
              variant="default"
              onClick={() => void refetch()}
              disabled={isLoading}
            >
              <Button.Prefix>
                <RefreshIcon />
              </Button.Prefix>
              Refresh
            </Button>
            <Button
              variant="emphasized"
              color="primary"
              onClick={() => navigate("/upload")}
            >
              <Button.Prefix>
                <UploadIcon />
              </Button.Prefix>
              Upload lookup
            </Button>
          </Flex>
        </TitleBar.Action>
      </TitleBar>

      {error && (
        <MessageContainer variant="critical">
          <MessageContainer.Title>Failed to load lookup files</MessageContainer.Title>
          <MessageContainer.Description>{error.message}</MessageContainer.Description>
        </MessageContainer>
      )}

      {isLoading && (
        <Flex justifyContent="center" padding={48}>
          <ProgressCircle aria-label="Loading lookup tables" />
        </Flex>
      )}

      {!isLoading && !error && (
        <DataTable data={rows} columns={columns} fullWidth>
          <DataTable.EmptyState>
            <Flex flexDirection="column" alignItems="center" padding={48} gap={8}>
              <Text>No lookup files found</Text>
              <Text style={{ color: Colors.Text.Neutral.Subdued }}>
                Upload your first lookup table to get started
              </Text>
            </Flex>
          </DataTable.EmptyState>
          <DataTable.Pagination defaultPageSize={25} />
        </DataTable>
      )}
    </Flex>
  );
};
