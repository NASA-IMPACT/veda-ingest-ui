# STAC Extension Loading

In collection forms (create/edit collection flows), users can load STAC extension schemas to add extension-specific fields and partial validation. This feature is not available in dataset forms. This document explains how the app loads extension schemas at runtime, merges extension fields into collection form state, and validates them before submit. This partial validation means the app checks extension-declared required fields for presence/non-empty values, but does not enforce full extension-schema validation for every constraint.

## Where It Is Implemented

Primary files involved in extension loading:

- `components/ui/ExtensionManager.tsx`
- `hooks/useStacExtensions.ts`
- `components/ingestion/CollectionIngestionForm.tsx`

## User Flow

1. A user enters an extension schema URL in the STAC Extensions card and clicks **Add Extension**.
2. `ExtensionManager` calls `onAddExtension(url)` from `useStacExtensions`.
3. `useStacExtensions` queues the URL and processes one URL at a time.
4. The schema is fetched from the provided URL.
5. Extension fields are extracted from the schema and rendered as editable JSON inputs in the collection form.
6. The extension URL is added to `formData.stac_extensions` (deduplicated).

## Hook Processing Details

`useStacExtensions` manages three pieces of state:

- `extensionFields`: mapping from extension URL to `{ title, fields }`.
- `urlsToProcess`: queue of extension URLs waiting to load.
- `isLoading`: loading status for the current URL fetch/parse cycle.

Processing behavior:

- URLs are processed sequentially (first URL in queue first).
- Duplicate URLs are ignored with a warning.
- Successful loads emit a success toast and update both UI and `formData`.
- Failed loads emit an error toast and remove the URL from queue.

## Expected Extension Schema Shape

Current extraction logic expects:

- `definitions.fields.properties`: object keys become extension field names.
- `definitions.require_field.required`: array of required field names.

If no fields are found, the app warns the user and does not add extension-specific editors for that URL.

## How Fields Are Rendered

In `CollectionIngestionForm`:

- A card is rendered per loaded extension.
- Each extension field is shown in `CodeEditorWidget` and stores JSON-compatible values.
- Input parsing attempts `JSON.parse`; if parsing fails, raw text is stored.
- Optional fields can be removed by setting value to empty JSON string (`""`) or equivalent empty parsed value.

## Validation On Submit

Before submit, `CollectionIngestionForm` validates required extension fields:

- For every loaded extension, required fields must be present and non-empty.
- Missing required fields show a validation alert and block submit.

## Interaction With Additional Properties

The collection form separates schema-backed keys from additional keys:

- Base schema keys and `stac_extensions` stay in the RJSF data path.
- Extension field keys are tracked explicitly to avoid being mislabeled as generic additional properties.

This keeps extension-driven fields first-class during editing and submit.

## Reset/Clear Behavior

If collection form data is cleared, previously loaded extension definitions are removed from local extension state to avoid stale extension field editors.

## Known Limitations

- The loader relies on one schema shape (`definitions.fields.properties` and `definitions.require_field.required`).
- There is no cached extension schema registry; each added URL is fetched live in-session.
- Failed extension fetches are surfaced to the user, but no retry policy beyond manual re-add is implemented.
