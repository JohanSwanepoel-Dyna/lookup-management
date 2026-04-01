import React, { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@dynatrace/strato-components/buttons";
import { Flex } from "@dynatrace/strato-components/layouts";
import { TitleBar } from "@dynatrace/strato-components/layouts";
import { Text } from "@dynatrace/strato-components/typography";
import { MessageContainer } from "@dynatrace/strato-components/content";
import { ProgressCircle } from "@dynatrace/strato-components/content";
import { DataTable } from "@dynatrace/strato-components-preview/tables";
import {
  RunQueryButton,
  type QueryStateType,
} from "@dynatrace/strato-components-preview/buttons";
import { DQLEditor } from "@dynatrace/strato-components-preview/editors";
import { useDql } from "@dynatrace-sdk/react-hooks";
import Colors from "@dynatrace/strato-design-tokens/colors";
import { ArrowLeftIcon } from "@dynatrace/strato-icons";

export const ViewLookup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const filePath = searchParams.get("path") ?? "";

  const initialQuery = filePath ? `load "${filePath}"` : "";
  const [editorQuery, setEditorQuery] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState("");

  const { data, error, isLoading, cancel, refetch } = useDql(
    { query: activeQuery },
    { enabled: activeQuery !== "" }
  );

  const handleRunQuery = () => {
    if (isLoading) {
      void cancel();
    } else if (editorQuery !== activeQuery) {
      setActiveQuery(editorQuery);
    } else {
      void refetch();
    }
  };

  let queryState: QueryStateType;
  if (error) queryState = "error";
  else if (isLoading) queryState = "loading";
  else if (data) queryState = "success";
  else queryState = "idle";

  // Derive columns dynamically from the result schema
  const columns = useMemo(() => {
    if (!data?.types?.[0]?.mappings) return [];
    return Object.keys(data.types[0].mappings).map((key) => ({
      id: key,
      header: key,
      accessor: (row: Record<string, unknown>) => row[key],
      cell: ({ value }: { value: unknown }) =>
        value == null ? (
          <span style={{ color: Colors.Text.Neutral.Subdued }}>—</span>
        ) : (
          <span>{String(value)}</span>
        ),
    }));
  }, [data?.types]);

  const rows = useMemo<Record<string, unknown>[]>(() => {
    if (!data?.records) return [];
    return data.records as Record<string, unknown>[];
  }, [data?.records]);

  const recordCount = data?.records?.length ?? 0;

  return (
    <Flex flexDirection="column" padding={32} gap={24}>
      <TitleBar>
        <TitleBar.Navigation>
          <Button variant="default" onClick={() => navigate(-1)}>
            <Button.Prefix>
              <ArrowLeftIcon />
            </Button.Prefix>
            Back
          </Button>
        </TitleBar.Navigation>
        <TitleBar.Title>View Lookup</TitleBar.Title>
        <TitleBar.Subtitle>
          {filePath || "Query lookup file content"}
        </TitleBar.Subtitle>
      </TitleBar>

      <Flex flexDirection="column" gap={8}>
        <DQLEditor
          value={editorQuery}
          onChange={setEditorQuery}
        />
        <Flex justifyContent="flex-end">
          <RunQueryButton onClick={handleRunQuery} queryState={queryState} />
        </Flex>
      </Flex>

      {error && (
        <MessageContainer variant="critical">
          <MessageContainer.Title>Query failed</MessageContainer.Title>
          <MessageContainer.Description>{error.message}</MessageContainer.Description>
        </MessageContainer>
      )}

      {isLoading && (
        <Flex justifyContent="center" padding={48}>
          <ProgressCircle aria-label="Running query" />
        </Flex>
      )}

      {!isLoading && data && columns.length > 0 && (
        <>
          <Text style={{ color: Colors.Text.Neutral.Subdued }}>
            {recordCount.toLocaleString()} record{recordCount !== 1 ? "s" : ""}
          </Text>
          <DataTable data={rows} columns={columns} fullWidth resizable variant={{ rowSeparation: 'horizontalDividers', verticalDividers: true }}>
            <DataTable.Pagination defaultPageSize={25} />
          </DataTable>
        </>
      )}
    </Flex>
  );
};
