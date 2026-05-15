# `renders.dashboard` Lifecycle

This document explains why `renders.dashboard` is handled as both a JSON string and a JSON object at different points in the app, and where those conversions happen.

## Why This Is Complex

The dataset form has three separate editing and validation surfaces that must all work together:

1. RJSF field widgets (`Form` tab) and schema validation.
2. The custom COG render generator (`RendersDashboardWidget`).
3. The manual JSON editor (`Manual JSON Edit` tab).

`renders.dashboard` is authored in text editors and widget callbacks as a string, but must end up as an object in the JSON payload written to GitHub.

## Canonical Rule

- In UI editing paths, `renders.dashboard` is usually kept as a JSON string.
- In persisted payloads, `renders.dashboard` should be a JSON object.

## End-to-End Data Flow

### 1. Load Existing Dataset JSON Into Edit Form

When editing an existing dataset ingest, retrieved payload content may contain:

```json
{
  "renders": {
    "dashboard": {
      "bidx": [1],
      "rescale": [[0, 100]],
      "assets": ["cog_default"]
    }
  }
}
```

Before passing data to RJSF, edit-mode normalization converts object -> pretty JSON string:

- `components/ingestion/EditIngestView.tsx`
- If `content.renders.dashboard` is an object, it is replaced with `JSON.stringify(..., null, 2)`.

Reason: this aligns with the widget/editor experience used by dataset form fields.

### 2. Form Tab (`DatasetIngestionForm` + RJSF)

`DatasetIngestionForm` wires a custom widget to the exact path:

- `'renders.dashboard': RendersDashboardWidget`

File:

- `components/ingestion/DatasetIngestionForm.tsx`

`RendersDashboardWidget` behavior:

- Uses `CodeEditorWidget` and treats the value as text.
- Converts non-string values to editor text via `toEditorString`.
- Calls `onChange(newValue)` with a string.
- Can launch `COGDrawerViewer` and accept generated render JSON text.

### Editor Component Constraint (`@uiw/react-textarea-code-editor`)

The form widget editor is built on `@uiw/react-textarea-code-editor` through `CodeEditorWidget`:

- `CodeEditorWidgetProps` defines `value: string`.
- The debounced `onChange` callback emits `string`.
- `RendersDashboardWidget` therefore normalizes any non-string value to editor text first.

Files:

- `components/ui/CodeEditorWidget.tsx`
- `components/rjsf-components/RendersDashboardWidget.tsx`

This string-first editor contract is another reason `renders.dashboard` is treated as string during authoring and later converted to object for persisted JSON.

File:

- `components/rjsf-components/RendersDashboardWidget.tsx`

### 3. COG Drawer Integration

The COG drawer accepts and returns render options as string JSON:

- Widget passes `renders={typeof value === 'string' ? value : undefined}`.
- Accepting options calls `onAcceptRenderOptions(renderOptions)` where `renderOptions` is a string.
- Widget forwards this string into RJSF field state via `onChange(renderOptions)`.

Files:

- `components/rjsf-components/RendersDashboardWidget.tsx`
- `components/COGViewer/COGDrawerViewer.tsx`
- `docs/cog-viewer.md`

### 4. Manual JSON Tab (`JSONEditor`)

`JSONEditor` intentionally supports both representations for `renders.dashboard`:

1. For editing convenience, it parses `renders.dashboard` string -> object when displaying editor content.
2. Before schema validation and apply, it converts object -> string.
3. It modifies the schema copy so `renders.dashboard` can validate as either:
   - string, or
   - object.

`JSONEditor` also uses `@uiw/react-textarea-code-editor` and stores editable content in a string buffer (`editorValue`) before parsing/validation.

File:

- `components/ui/JSONEditor.tsx`

This is the key bridge that prevents tab-switch regressions:

- Form tab expects string-oriented widget behavior.
- JSON tab lets users edit richer object JSON directly.

### Validation Engine Note (RJSF vs JSON Tab)

The form tab and JSON tab are closely related in validation behavior, but they are not using the exact same package import:

- Form tab: uses `@rjsf/validator-ajv8` via `validator` in `DatasetIngestionForm`.
- JSON tab: uses `ajv` directly (plus `ajv-formats`) in `JSONEditor`.

Why this still matters for format expectations:

- `@rjsf/validator-ajv8` is an RJSF wrapper around AJV.
- `JSONEditor` compiles a schema copy with AJV directly.
- Because both are AJV-based schema validators, they share JSON Schema type constraints.
- That shared AJV behavior is part of why the JSON tab applies the `renders.dashboard` string/object bridge before validation, so edits stay compatible with form/widget expectations.

### 5. Field-Level Validation (`customValidate`)

Custom validation for renders values assumes entries are JSON strings and validates that each one parses to an object:

- Checks each key under `formData.renders`.
- If a value is non-empty string, validates it parses and is an object.
- Reports field-specific errors like `errors.renders.dashboard.addError(...)`.

File:

- `utils/CustomValidation.ts`

### 6. Submit From Form Layer

`DatasetIngestionForm` merges form data and additional JSON-tab properties, then strips empty renders:

- `stripEmptyRenders` removes whole `renders` block if `renders.dashboard` is empty.

File:

- `components/ingestion/DatasetIngestionForm.tsx`

At this point, `renders.dashboard` may still be a string.

### 7. Final Serialization Before GitHub Write

All create/update GitHub writes pass through `CleanAndPrettifyJSON`:

- Iterates `renders` entries.
- For non-empty string values, tries `JSON.parse` and replaces with parsed object.
- Leaves invalid JSON strings as-is (with warning).
- Returns pretty-printed JSON string for commit content.

Files:

- `utils/CleanAndPrettifyJson.ts`
- `utils/githubUtils/CreatePR.ts`
- `utils/githubUtils/UpdatePR.ts`

This is where the final payload is normalized from string-based authoring to object-based stored JSON.

## Known Tradeoffs

- There are intentional repeated conversions (object <-> string) across load, edit, validate, and submit phases.
- This reduces friction in RJSF widget usage while keeping final repository JSON structurally correct.
- Invalid render JSON can survive until final serialization if strict validation paths are bypassed; warnings are logged during prettify.

## Debug Checklist

If `renders.dashboard` behavior looks broken, check these in order:

1. Edit-load normalization in `EditIngestView` (object -> string).
2. Widget change events in `RendersDashboardWidget` (should emit string).
3. JSON tab conversion in `JSONEditor` (display parse + pre-apply stringify).
4. `customValidate` field errors for malformed JSON strings.
5. `stripEmptyRenders` submit cleanup in dataset form.
6. `CleanAndPrettifyJSON` conversion before GitHub write.
