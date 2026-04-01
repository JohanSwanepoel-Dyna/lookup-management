
# Lookup Data API Skills file
## Test parsing your to-be-uploaded lookup data without storing the result in Grail
* POST /platform/storage/resource-store/v1/files/tabular/lookup:test-pattern

## Upload your lookup data and store it as a new tabular file in Grail or replace an existing one.
* POST /platform/storage/resource-store/v1/files/tabular/lookup:upload

## Delete the file from the Resource Store.
* POST/platform/storage/resource-store/v1/files:delete


## Parse lookup data
The API provides the /platform/storage/resource-store/v1/files/tabular/lookup:test-pattern endpoint, which previews the uploaded results without persisting them as a file in Grail. The endpoint helps you define the DPL pattern that fits the format of your data.

The endpoint accepts input as multipart/form-data with a content part for the uploaded data and a request part for additional parameters. The only required parameter in the request part is the parsePattern parameter, which provides the DPL pattern to parse the uploaded text-based data. For more details, see the Swagger API documentation.

You can define any DPL pattern that matches your data. Every pattern match produces a record. The following example shows uploaded CSV data in the following format:

Code,Category,Message
100,informational,Continue
101,informational,Switching Protocols
...

The DPL pattern INT:code ',' LD:category ',' LD:message matches the content and produces a record with fields code, category, and message for every line except for the header line. You can use the skippedRecords parameter to exclude header lines where the pattern matches also the header lines.

With the same data in JSONL format you can use the JSON:json DPL pattern:

{"code": 100, "category": "informational", "message": "Continue"}
{"code": 101, "category": "informational", "message": "Switching Protocols"}
...

Suppose the specified DPL pattern results in a single record-type field. In that case, nested fields are extracted to the root level by default. This behavior is configurable via the autoFlatten parameter.

Suppose you also provide a lookupField parameter in the API request. In that case, the specified field will be used to deduplicate the result if identical values appear in multiple records.

The following example shows a curl command for interacting with the Resource Store API using a platform token to test a DPL pattern:

curl -X 'POST' \
'https://<environment>.apps.dynatrace.com/platform/storage/resource-store/v1/files/tabular/lookup:test-pattern' \
-H 'accept: */*' \
-H 'Content-Type: multipart/form-data' \
-H 'Authorization: Bearer <platformtoken>' \
-F 'request={
 "parsePattern":"JSON:json",
 "lookupField":"code"
}' \
-F 'content=@http_status_codes.jsonl'

The response includes the number of records that matched the pattern and a preview of up to 100 records.


## Store lookup data
The API provides the /platform/storage/resource-store/v1/files/tabular/lookup:upload endpoint, which allows you to upload and store your lookup data as a tabular file in Grail.

The endpoint accepts input as multipart/form-data with a content part for the uploaded data and a request part for additional parameters. In the content part, you can submit your data in a text-based format. For details, see Parse lookup data. The required parameters in the request part are:

parsePattern for providing the DPL pattern to parse the uploaded data

lookupField for defining the extracted field with the identifier of the record

filePath as the fully qualified file path of the tabular file to store the lookup data in Grail

Use the displayName and description parameters to include additional meta information. For more details, see the Swagger API documentation.

If you want to update the contents of a file, you need to reupload it. If the filePath already exists, use the overwrite parameter.

The following example shows a curl command for interacting with the Resource Store API using a platform token to store your lookup data:

curl -X 'POST' \
 'https://<environment>.apps.dynatrace.com/platform/storage/resource-store/v1/files/tabular/lookup:upload' \
 -H 'accept: */*' \
 -H 'Content-Type: multipart/form-data' \
 -H 'Authorization: Bearer <platformtoken>' \
 -F 'request={
 "parsePattern":"JSON:json",
 "lookupField":"code",
 "filePath":"/lookups/http_status_codes",
 "displayName":"My lookup data",
 "description":"Description of my lookup data"
 }' \
 -F 'content=@http_status_codes.jsonl'


 ## Delete lookup data
You can use the /platform/storage/resource-store/v1/files:delete endpoint to delete files that are no longer needed. The only required parameter is the filePath parameter, referencing the file to be deleted. Note that deleting a file is irreversible.

The following example shows a curl command for interacting with the Resource Store API using a platform token to delete an existing lookup file:

curl -X 'POST' \
 'https://<environment>.apps.dynatrace.com/platform/storage/resource-store/v1/files:delete' \
 -H 'accept: */*' \
 -H 'Content-Type: application/json' \
 -H 'Authorization: Bearer <platformtoken>' \
 -d '{"filePath": "/lookups/http_status_codes"}'

## Manage lookup files with DQL
With DQL, you can fetch the dt.system.files table to get a list of all accessible files stored in Grail:

```
fetch dt.system.files
```

If you want to search for specific files, you can add the search or filter commands to the above example. The autocomplete suggestions within the DQL Code Editor will also help you find your files.

Use the load command if you want to inspect the contents of a file:

```
load "/lookups/http_status_codes"
```