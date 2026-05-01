export const APP_SCOPES = {
  datasetLimitedAccess: 'dataset:limited-access',
  datasetCreate: 'dataset:create',
  datasetUpdate: 'dataset:update',
  stacCollectionUpdate: 'stac:collection:update',
} as const;

export type SessionLike = {
  scopes?: string[];
} | null;

export type UserCapabilities = {
  isAuthenticated: boolean;
  isLimited: boolean;
  canCreateIngest: boolean;
  canEditIngest: boolean;
  canEditExistingCollection: boolean;
};

export function deriveCapabilities(session: SessionLike): UserCapabilities {
  if (!session) {
    return {
      isAuthenticated: false,
      isLimited: false,
      canCreateIngest: false,
      canEditIngest: false,
      canEditExistingCollection: false,
    };
  }

  const scopes = session.scopes ?? [];
  const isLimited = scopes.includes(APP_SCOPES.datasetLimitedAccess);
  const canEditIngest = scopes.includes(APP_SCOPES.datasetUpdate);
  const canEditExistingCollection = scopes.includes(
    APP_SCOPES.stacCollectionUpdate
  );
  // Users who can edit ingest data or existing collections can also submit ingest creations.
  const canCreateIngest =
    scopes.includes(APP_SCOPES.datasetCreate) ||
    canEditIngest ||
    canEditExistingCollection;

  return {
    isAuthenticated: true,
    isLimited,
    canCreateIngest: isLimited ? false : canCreateIngest,
    canEditIngest: isLimited ? false : canEditIngest,
    canEditExistingCollection: isLimited ? false : canEditExistingCollection,
  };
}
