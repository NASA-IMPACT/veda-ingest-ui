# RJSF v6 Migration Plan

## Current State Analysis

**Current RJSF Version:** v6.2.5 ✅
**Target RJSF Version:** v6.x ✅
**Ant Design Version:** v5.29.1 (compatible with RJSF v6)
**Status:** Phase 2 Complete ✅ - Migration Successful
**Branch:** feature/rjsf-v6-migration
**Phase 1 Complete:** ✅ RJSF packages upgraded to v6.2.5 (keeping Ant Design v5.29.1)
**Phase 2 Complete:** ✅ Custom components migrated, idSchema → fieldPathId, onChange signatures updated
**ButtonTemplates Issue:** ✅ RESOLVED - Custom button implementations in components/ingestion/rjsfTheme.tsx
**Testing Status:** ✅ All 391 tests passing, manual testing confirms forms work correctly

### Resolution: Icon Import Compatibility Issue

**Problem:** @rjsf/antd v6.2.5 imports Ant Design icons with `.js` extensions (e.g., `@ant-design/icons/DeleteOutlined.js`) which Next.js webpack cannot properly resolve, causing "Element type is invalid: got object" errors.

**Solution:** Created `components/ingestion/rjsfTheme.tsx` with custom ButtonTemplates (AddButton, RemoveButton, CopyButton, MoveUpButton, MoveDownButton, ClearButton) that import icons directly from `@ant-design/icons` without file extensions. Both ingestion forms now use this custom theme.

### Custom RJSF Components Inventory

1. **ObjectFieldTemplate.tsx** - Main object field template with COG viewer integration
2. **DiscoveryItemObjectFieldTemplate.tsx** - Specialized template for discovery items
3. **TestableUrlWidget.tsx** - Custom URL input widget with validation
4. **AssetsField.tsx** - Custom field for asset management
5. **IconButton.tsx** - Custom icon button component
6. **DatasetIngestionForm.tsx** - Main form implementation using withTheme pattern

## RJSF v6 Breaking Changes Analysis

### 1. IdSchema → FieldPathId (HIGH IMPACT)

**Current Code Pattern:**

```tsx
const { idSchema, onAddClick } = props;
const { $id } = idSchema;
```

**Required v6 Pattern:**

```tsx
const { fieldPathId, onAddProperty } = props;
const { $id } = fieldPathId;
```

**Affected Components:**

- ObjectFieldTemplate.tsx
- DiscoveryItemObjectFieldTemplate.tsx
- All custom field implementations

### 2. FormContext Removal (MEDIUM IMPACT)

**Current Code Pattern:**

```tsx
const { formContext } = props;
const formData = formContext.formData;
```

**Required v6 Pattern:**

```tsx
const formContext = registry.formContext;
const formData = formContext.formData;
```

**Affected Components:**

- ObjectFieldTemplate.tsx (heavily uses formContext)
- DatasetIngestionForm.tsx

### 3. Callback Function Signature Changes (HIGH IMPACT)

**Current v5 Signatures:**

```tsx
onAddClick: (schema: S) => () => void
onDropPropertyClick: (property: string) => () => void
onKeyChange: (property: string) => () => void
```

**Required v6 Signatures:**

```tsx
onAddProperty: () => void
onRemoveProperty: () => void
onKeyRename: (newKey: string) => void
onKeyRenameBlur: (event: FocusEvent<HTMLInputElement>) => void
```

### 4. Field onChange Handler Changes (HIGH IMPACT)

**Current v5 Pattern:**

```tsx
onChange(newFormData: T | undefined, es?: ErrorSchema<T>, id?: string)
```

**Required v6 Pattern:**

```tsx
onChange(newValue: T | undefined, path: FieldPathList, es?: ErrorSchema<T>, id?: string)
```

### 5. Array Template Restructuring (MEDIUM IMPACT)

Array field templates have significant prop changes with new button template system.

## Migration Plan

### Phase 1: Pre-Migration Setup

#### 1.1 Backup and Branching

- [x] Create feature branch: `feature/rjsf-v6-migration`
- [x] Ensure all current tests pass

#### 1.2 Package Updates

- [x] Remove any RJSF v5 patches if present (not ant design v5 patches)
- [x] Run `yarn install`
- [x] Update package.json dependencies:
      `yarn upgrade @rjsf/core@6.2.5 @rjsf/antd@6.2.5 @rjsf/utils@6.2.5 @rjsf/validator-ajv8@6.2.5`
- [x] run type check `yarn type-check`
- [x] Fix initial TypeScript compilation errors

### Phase 2: Core Template Migration

#### 2.1 ObjectFieldTemplate.tsx (Priority 1)

**Changes Required:**

- [x] Replace `idSchema` with `fieldPathId`
- [x] Update `formContext` access via `registry.formContext`
- [x] Change `onAddClick` to `onAddProperty`
- [x] Update COG drawer integration to work with new prop structure
- [x] Test thumbnail upload functionality

#### 2.2 DiscoveryItemObjectFieldTemplate.tsx (Priority 2)

**Changes Required:**

- [x] Similar prop changes to ObjectFieldTemplate
- [x] Update template-specific logic
- [x] Ensure discovery item rendering still works

#### 2.3 DatasetIngestionForm.tsx (Priority 3)

**Changes Required:**

- [x] Update withTheme integration patterns (uses rjsfTheme.tsx)
- [x] Verify custom template registration still works
- [x] Test form submission and validation

#### 2.4 ButtonTemplates Compatibility (Priority 1 - Critical)

**Changes Required:**

- [x] Created `components/ingestion/rjsfTheme.tsx` with custom ButtonTemplates
- [x] Override all icon buttons (Add, Remove, Copy, MoveUp, MoveDown, Clear)
- [x] Import icons from `@ant-design/icons` without `.js` extensions
- [x] Updated both DatasetIngestionForm and CollectionIngestionForm to use custom theme

### Phase 3: Widget and Field Migration

#### 3.1 AssetsField.tsx

**Changes Required:**

- [x] Update `FieldProps` interface usage
- [x] Modify field change handling (added path parameter)
- [x] Test asset upload/management

#### 3.2 BboxField.tsx and IntervalField.tsx

**Changes Required:**

- [x] Update onChange signatures with path parameter
- [x] Update fieldPathId prop handling

### Phase 4: Integration and Testing

#### 4.1 Unit Testing

- [x] Update test files with fieldPathId props
- [x] Run unit tests with `yarn test` - All 391 tests passing ✅

#### 4.2 Manual Form Testing

- [x] Test complete dataset creation flow
- [x] Test array field add/remove buttons
- [x] Verify COG viewer functionality
- [x] Test thumbnail upload/preview
- [x] Validate form rendering without errors

#### 4.2 UI/UX Validation

- [ ] Ensure all styling remains consistent
- [ ] Test responsive behavior
- [ ] Verify accessibility features still work

#### 4.3 Error Handling

- [ ] Test validation error display
- [ ] Ensure custom error messages still show
- [ ] Test form reset functionality

## Risk Assessment

### HIGH RISK

- **COG Viewer Integration**: Heavy customization that directly uses formContext
- **Thumbnail Upload**: Complex state management with form integration
- **Custom onChange Handlers**: Multiple components with custom change logic

### MEDIUM RISK

- **Form Validation**: Existing validation patterns may need updates
- **Template Registration**: withTheme pattern changes
- **Styling Consistency**: Ant Design integration points

### LOW RISK

- **Basic Field Rendering**: Standard field types should migrate easily
- **Schema Validation**: Core validation logic should remain unchanged

## Rollback Strategy

### Immediate Rollback

- Revert to previous commit on feature branch
- Package.json restored to v5 versions
- Re-run yarn install

### Partial Migration Rollback

- Keep package updates but revert component changes
- Use feature flags to toggle between old/new components
- Gradual rollout by component type

## Testing Strategy

### Automated Testing

- [ ] Update existing unit tests for prop changes
- [ ] Add integration tests for critical paths
- [ ] Update Playwright E2E tests for form interactions

### Manual Testing Checklist

- [ ] Collection creation end-to-end
- [ ] Dataset creation and editing
- [ ] COG file upload and preview
- [ ] Thumbnail upload and management
- [ ] Form validation and error display

## Success Criteria

### Functional Requirements

- [ ] All existing form functionality preserved
- [ ] COG viewer integration working
- [ ] Thumbnail uploads functional
- [ ] Form validation and submission working
- [ ] No performance regressions

### Technical Requirements

- [ ] TypeScript compilation with no errors
- [ ] All tests passing
- [ ] Bundle size within acceptable range
- [ ] Code follows existing patterns and conventions

## Timeline Estimate

## Resources and Documentation

### RJSF v6 Resources

- [Official Migration Guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v6.x%20upgrade%20guide/)
- [API Reference](https://rjsf-team.github.io/react-jsonschema-form/docs/api-reference/)
- [GitHub Examples](https://github.com/rjsf-team/react-jsonschema-form/tree/main/packages/playground/src/samples)

### Ant Design Integration

- [RJSF Ant Design Theme Documentation](https://rjsf-team.github.io/react-jsonschema-form/docs/usage/themes)
