# Edit Existing Collection Feature Flag Cleanup Guide

This document outlines all the changes needed to remove the `ENABLE_EXISTING_COLLECTION_EDIT` feature flag and make the Edit Existing Collection functionality permanently available.

## Overview

The feature flag was implemented to control visibility and access to the "Edit Existing Collection" feature across:

- UI components (MenuBar, CollectionsClient)
- API endpoints (/api/existing-collection/\*)
- Test configurations

## Files to Update

### 1. Environment Configuration

#### `.env.example`

**Remove these lines:**

```env
# Enable or disable the Edit Existing Collection feature
# Set to 'true' to show Edit Existing Collection options and allow API access
ENABLE_EXISTING_COLLECTION_EDIT=true
NEXT_PUBLIC_ENABLE_EXISTING_COLLECTION_EDIT=true
```

### 2. Test Configuration Files

#### `playwright.config.ts`

**Remove** `ENABLE_EXISTING_COLLECTION_EDIT=true` from the command:

```typescript
// FROM:
command: 'NEXT_PUBLIC_DISABLE_AUTH=true NEXT_PUBLIC_MOCK_SCOPES="dataset:update stac:collection:update dataset:create" ENABLE_EXISTING_COLLECTION_EDIT=true yarn dev',

// TO:
command: 'NEXT_PUBLIC_DISABLE_AUTH=true NEXT_PUBLIC_MOCK_SCOPES="dataset:update stac:collection:update dataset:create" yarn dev',
```

#### `vitest.config.mts`

**Remove the env configuration:**

```typescript
// REMOVE this entire env block:
env: {
  ENABLE_EXISTING_COLLECTION_EDIT: 'true',
  NEXT_PUBLIC_ENABLE_EXISTING_COLLECTION_EDIT: 'true',
},
```

### 3. UI Components

#### `components/layout/MenuBar.tsx`

**Remove the environment variable check:**

```typescript
// REMOVE this line:
const isEditExistingCollectionEnabled =
  process.env.NEXT_PUBLIC_ENABLE_EXISTING_COLLECTION_EDIT === 'true';
```

**Simplify the menu items array:**

```typescript
// FROM conditional spread syntax:
...(isEditExistingCollectionEnabled ? [{
  key: '/edit-existing-collection',
  // ... menu item definition
}] : []),

// TO permanent menu item:
{
  key: '/edit-existing-collection',
  label:
    hasLimitedAccess || !hasEditStacCollectionPermission ? (
      <Tooltip
        title="Contact the VEDA Data Services team for access"
        placement="right"
      >
        <span style={{ cursor: 'not-allowed' }}>
          <Link href="/edit-existing-collection">
            Edit Existing Collection
          </Link>
        </span>
      </Tooltip>
    ) : (
      <Link href="/edit-existing-collection">
        Edit Existing Collection
      </Link>
    ),
  icon: <DatabaseOutlined />,
  disabled: hasLimitedAccess || !hasEditStacCollectionPermission,
},
```

#### `app/collections/_components/CollectionsClient.tsx`

**Remove the environment variable check:**

```typescript
// REMOVE this line:
const isEditExistingCollectionEnabled =
  process.env.NEXT_PUBLIC_ENABLE_EXISTING_COLLECTION_EDIT === 'true';
```

**Remove conditional rendering - make sections permanent:**

For **Limited Access View**:

```typescript
// FROM:
{isEditExistingCollectionEnabled && (
  <>
    <Title level={3} style={{ marginTop: 40 }}>
      Existing STAC Collections
    </Title>
    <Row gutter={16} style={{ marginTop: 16 }}>
      {/* ... card content */}
    </Row>
  </>
)}

// TO:
<>
  <Title level={3} style={{ marginTop: 40 }}>
    Existing STAC Collections
  </Title>
  <Row gutter={16} style={{ marginTop: 16 }}>
    {/* ... card content */}
  </Row>
</>
```

For **Main View**:

```typescript
// FROM:
{isEditExistingCollectionEnabled && (
  <>
    <Title level={3} style={{ marginTop: 40 }}>
      Existing STAC Collections
    </Title>
    <Row gutter={16} style={{ marginTop: 16 }}>
      {/* ... card content */}
    </Row>
  </>
)}

// TO:
<>
  <Title level={3} style={{ marginTop: 40 }}>
    Existing STAC Collections
  </Title>
  <Row gutter={16} style={{ marginTop: 16 }}>
    {/* ... card content */}
  </Row>
</>
```

### 4. API Endpoints

#### `app/api/existing-collection/route.ts`

**Remove the feature flag check:**

```typescript
// REMOVE this entire block:
// Check if the Edit Existing Collection feature is enabled
if (process.env.ENABLE_EXISTING_COLLECTION_EDIT !== 'true') {
  return NextResponse.json(
    { error: 'Edit Existing Collection feature is disabled' },
    { status: 403 }
  );
}
```

#### `app/api/existing-collection/[collectionId]/route.ts`

**Remove the feature flag check from both GET and PUT methods:**

```typescript
// REMOVE this entire block from both functions:
// Check if the Edit Existing Collection feature is enabled
if (process.env.ENABLE_EXISTING_COLLECTION_EDIT !== 'true') {
  return NextResponse.json(
    { error: 'Edit Existing Collection feature is disabled' },
    { status: 403 }
  );
}
```

## Cleanup Steps

1. **Update environment files** - Remove feature flag variables
2. **Update test configurations** - Remove env vars from test configs
3. **Update UI components** - Remove conditional rendering logic
4. **Update API endpoints** - Remove feature flag checks
5. **Test thoroughly** - Ensure Edit Existing Collection works in all scenarios
6. **Update documentation** - Remove references to the feature flag
7. **Clean up any remaining environment variables** in production/staging configs

## Verification Checklist

After cleanup, verify:

- [ ] Edit Existing Collection appears in MenuBar for users with `stac:collection:update` scope
- [ ] Edit Existing Collection section shows in Collections page when feature flag env vars are absent
- [ ] API endpoints `/api/existing-collection/*` work without feature flag
- [ ] Unit tests pass without feature flag environment variables
- [ ] Playwright tests work without feature flag in command
- [ ] No console errors about missing environment variables

## Notes

- The feature flag was a **client-side and server-side** implementation
- **Client-side**: `NEXT_PUBLIC_ENABLE_EXISTING_COLLECTION_EDIT` (visible in browser)
- **Server-side**: `ENABLE_EXISTING_COLLECTION_EDIT` (API routes only)
- Both must be removed for complete cleanup
- Consider doing this cleanup in a dedicated PR for easier review and rollback if needed
