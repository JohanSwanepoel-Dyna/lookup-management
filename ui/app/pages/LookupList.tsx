import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@dynatrace/strato-components/buttons";
import { Flex } from "@dynatrace/strato-components/layouts";
import { TitleBar } from "@dynatrace/strato-components/layouts";
import { Text } from "@dynatrace/strato-components/typography";
import { MessageContainer } from "@dynatrace/strato-components/content";
import { Modal } from "@dynatrace/strato-components/overlays";
import { DataTable } from "@dynatrace/strato-components-preview/tables";
import { ProgressCircle } from "@dynatrace/strato-components/content";
import { useDql, useAppFunction } from "@dynatrace-sdk/react-hooks";
import Colors from "@dynatrace/strato-design-tokens/colors";
import { UploadIcon, RefreshIcon, DeleteIcon, ViewIcon } from "@dynatrace/strato-icons";

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

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<LookupFile | null>(null);
  const [deletePayload, setDeletePayload] = useState<{ filePath: string } | null>(null);
  const [deleteTrigger, setDeleteTrigger] = useState(0);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);

  const {
    isLoading: isDeleting,
    isError: isDeleteError,
    isSuccess: isDeleteSuccess,
    error: deleteError,
    refetch: runDelete,
  } = useAppFunction(
    { name: "delete-lookup", data: deletePayload ?? {} },
    { autoFetch: false, autoFetchOnUpdate: false }
  );

  useEffect(() => {
    if (deleteTrigger > 0 && deletePayload) {
      void runDelete();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deleteTrigger]);

  useEffect(() => {
    if (isDeleteSuccess) {
      setDeleteSuccess(deleteTarget?.name ?? "");
      setDeleteTarget(null);
      setDeletePayload(null);
      void refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDeleteSuccess]);

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    setDeletePayload({ filePath: deleteTarget.name });
    setDeleteTrigger((c) => c + 1);
  };

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

      {deleteSuccess && (
        <MessageContainer variant="success" onDismiss={() => setDeleteSuccess(null)}>
          <MessageContainer.Title>Lookup deleted</MessageContainer.Title>
          <MessageContainer.Description>
            <strong>{deleteSuccess}</strong> was deleted successfully.
          </MessageContainer.Description>
        </MessageContainer>
      )}

      {isDeleteError && (
        <MessageContainer variant="critical">
          <MessageContainer.Title>Delete failed</MessageContainer.Title>
          <MessageContainer.Description>
            {deleteError?.message ?? "An unexpected error occurred"}
          </MessageContainer.Description>
        </MessageContainer>
      )}

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
        <DataTable
          data={rows}
          columns={columns}
          fullWidth
          resizable
          variant={{ rowSeparation: 'horizontalDividers', verticalDividers: true }}
        >
          <DataTable.EmptyState>
            <Flex flexDirection="column" alignItems="center" padding={48} gap={8}>
              <Text>No lookup files found</Text>
              <Text style={{ color: Colors.Text.Neutral.Subdued }}>
                Upload your first lookup table to get started
              </Text>
            </Flex>
          </DataTable.EmptyState>
          <DataTable.RowActions>
            {(row: LookupFile) => (
              <Flex gap={4}>
                <Button
                  variant="default"
                  onClick={() =>
                    navigate(`/view?path=${encodeURIComponent(row.name)}`)
                  }
                >
                  <Button.Prefix>
                    <ViewIcon />
                  </Button.Prefix>
                  View
                </Button>
                <Button
                  variant="default"
                  color="critical"
                  onClick={() => setDeleteTarget(row)}
                >
                  <Button.Prefix>
                    <DeleteIcon />
                  </Button.Prefix>
                  Delete
                </Button>
              </Flex>
            )}
          </DataTable.RowActions>
          <DataTable.Pagination defaultPageSize={25} />
        </DataTable>
      )}

      {/* Delete confirmation modal */}
      <Modal
        title="Delete lookup file"
        show={!!deleteTarget}
        onDismiss={() => setDeleteTarget(null)}
        footer={
          <Flex justifyContent="flex-end" gap={8}>
            <Button variant="default" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              variant="emphasized"
              color="critical"
              onClick={handleDeleteConfirm}
              loading={isDeleting}
              disabled={isDeleting}
            >
              Delete
            </Button>
          </Flex>
        }
      >
        <Text>
          Are you sure you want to delete{" "}
          <strong>{deleteTarget?.name}</strong>? This action is irreversible.
        </Text>
      </Modal>
    </Flex>
  );
};
