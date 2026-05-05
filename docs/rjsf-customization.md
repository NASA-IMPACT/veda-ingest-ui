# RJSF Customization Guide

This project uses RJSF (react-jsonschema-form) with custom templates, fields, widgets, and a theme override.

Use this document to understand where behavior lives and which customization hook to use when adding new form UX.

## Architecture

RJSF rendering is assembled in the ingestion form components:

- `components/ingestion/DatasetIngestionForm.tsx`
- `components/ingestion/CollectionIngestionForm.tsx`
- `components/ingestion/rjsfTheme.tsx`

Schemas and layout metadata live in:

- `FormSchemas/**/datasetSchema.json`
- `FormSchemas/**/uischema.json`

## Customization Matrix

Use this as the map from uiSchema markers to implementation.

| uiSchema marker                                        | RJSF hook                        | Implementation                                                    | Purpose                                                            |
| ------------------------------------------------------ | -------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------ |
| `ui:grid`                                              | `ObjectFieldTemplate`            | `components/rjsf-components/ObjectFieldTemplate.tsx`              | 24-column row/column layout for object fields                      |
| discovery item object (`root_discovery_items_<index>`) | `ObjectFieldTemplate` delegation | `components/rjsf-components/DiscoveryItemObjectFieldTemplate.tsx` | Collapse advanced discovery item rows into "More Options"          |
| `ui:field: asset`                                      | custom field                     | `components/rjsf-components/AssetsField.tsx`                      | Editable object keys + nested asset schema rendering               |
| `ui:field: BboxField`                                  | custom field                     | `utils/BboxField.tsx`                                             | Specialized bbox UX                                                |
| `ui:field: interval`                                   | custom field                     | `utils/IntervalField.tsx`                                         | Specialized interval UX                                            |
| `ui:widget: testableUrl`                               | custom widget                    | `components/rjsf-components/TestableUrlWidget.tsx`                | URL input with validation call                                     |
| `ui:widget: regexString`                               | custom widget                    | `components/rjsf-components/RegexStringWidget.tsx`                | Regex input preserving slash escaping                              |
| `ui:widget: renders.dashboard`                         | custom widget                    | `components/rjsf-components/RendersDashboardWidget.tsx`           | JSON editor for renders + COG-assisted dashboard render generation |

## Theme Override

The RJSF Ant Design theme is wrapped in `components/ingestion/rjsfTheme.tsx`.

Reason:

- `@rjsf/antd` icon import incompatibility with Next.js in current version.

What is overridden:

- `ButtonTemplates`
- `ErrorListTemplate`

If this compatibility issue is fixed in a future RJSF/AntD version, this file can likely be simplified or removed.

## Choosing The Right Hook

When adding customization, use the smallest hook that solves the problem:

- Use `ui:widget` when behavior is specific to one value/editor.
- Use `ui:field` when you need to control a compound schema node (object/array) with custom rendering logic.
- Use template overrides only for cross-cutting layout/presentation concerns.

Rule of thumb: avoid putting domain-specific behavior in `ObjectFieldTemplate` unless it affects all object rendering.

## Adding A New Custom Widget

1. Add a widget component under `components/rjsf-components/`.
2. Register it in the relevant form component (`DatasetIngestionForm` and/or `CollectionIngestionForm`) via the `widgets` prop.
3. Reference it in the appropriate uiSchema using `ui:widget`.
4. Add/update tests for widget behavior and form integration.

## Current Form Context Contract

Dataset form currently passes this `formContext` into RJSF:

- `formData`
- `updateFormData`

Collection form currently does not pass `formContext`.

If future widgets require cross-field reads/writes in collection flows, align both forms to a shared typed `formContext` contract.
