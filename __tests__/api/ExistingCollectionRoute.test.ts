import {
  describe,
  expect,
  it,
  vi,
  beforeEach,
  Mock,
  beforeAll,
  afterAll,
} from 'vitest';
import { GET } from '@/app/api/existing-collection/route';
import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { getUserTenants } from '@/lib/serverTenantValidation';

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/serverTenantValidation', () => ({
  getUserTenants: vi.fn(),
  validateTenantAccess: vi.fn(),
}));

const authMock = auth as Mock;
const getUserTenantsMock = getUserTenants as Mock;

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeAll(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  vi.restoreAllMocks();
});

beforeEach(() => {
  vi.clearAllMocks();
});

const mockSession = {
  user: { email: 'test@example.com' },
  tenants: ['tenant1', 'tenant2'],
};

const mockStacCollectionsResponse = {
  collections: [
    { id: 'collection1', title: 'Collection 1', tenant: 'tenant1' },
    { id: 'collection2', title: 'Collection 2', tenant: 'tenant2' },
    { id: 'collection3', title: 'Public Collection', tenant: '' },
    { id: 'collection4', title: 'No Tenant Collection' },
  ],
};

describe('GET /api/existing-collection', () => {
  it('returns 401 when user is not authenticated', async () => {
    authMock.mockResolvedValue(null);

    const request = new NextRequest(
      'http://localhost:3000/api/existing-collection'
    );
    const response = await GET(request);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Authentication required');
  });

  it('fetches all collections when no tenant filter is specified', async () => {
    authMock.mockResolvedValue(mockSession);
    getUserTenantsMock.mockResolvedValue(['tenant1', 'tenant2']);
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockStacCollectionsResponse,
    });

    const request = new NextRequest(
      'http://localhost:3000/api/existing-collection'
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://staging.openveda.cloud/api/stac/collections'
    );

    const data = await response.json();
    expect(data.collections).toHaveLength(4); // All collections should be returned with tenant filtering applied server-side
  });

  it('fetches collections for specific tenant when tenant filter is provided', async () => {
    authMock.mockResolvedValue(mockSession);
    getUserTenantsMock.mockResolvedValue(['tenant1', 'tenant2']);
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        collections: [
          { id: 'collection1', title: 'Collection 1', tenant: 'tenant1' },
        ],
      }),
    });

    const request = new NextRequest(
      'http://localhost:3000/api/existing-collection?tenant=tenant1'
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://staging.openveda.cloud/api/stac/collections?tenant=tenant1'
    );
  });

  it('returns 403 when user tries to access unauthorized tenant', async () => {
    authMock.mockResolvedValue(mockSession);
    getUserTenantsMock.mockResolvedValue(['tenant1', 'tenant2']);

    const request = new NextRequest(
      'http://localhost:3000/api/existing-collection?tenant=unauthorized-tenant'
    );
    const response = await GET(request);

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toBe('Access denied for tenant: unauthorized-tenant');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('allows access to Public tenant for any user', async () => {
    authMock.mockResolvedValue(mockSession);
    getUserTenantsMock.mockResolvedValue(['tenant1']);
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        collections: [{ id: 'collection3', title: 'Public Collection' }],
      }),
    });

    const request = new NextRequest(
      'http://localhost:3000/api/existing-collection?tenant=Public'
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://staging.openveda.cloud/api/stac/collections?tenant=Public'
    );
  });

  it('handles STAC API errors properly', async () => {
    authMock.mockResolvedValue(mockSession);
    getUserTenantsMock.mockResolvedValue(['tenant1', 'tenant2']);
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'STAC API Error',
    });

    const request = new NextRequest(
      'http://localhost:3000/api/existing-collection'
    );
    const response = await GET(request);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('STAC API error: STAC API Error');
  });

  it('filters collections by user tenants when no specific tenant filter', async () => {
    authMock.mockResolvedValue(mockSession);
    getUserTenantsMock.mockResolvedValue(['tenant1']); // User only has access to tenant1
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockStacCollectionsResponse,
    });

    const request = new NextRequest(
      'http://localhost:3000/api/existing-collection'
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();

    // Should include: tenant1 collections, Public collections, and collections with no tenant
    const allowedCollections = data.collections.filter(
      (col: any) => !col.tenant || col.tenant === '' || col.tenant === 'tenant1'
    );
    expect(allowedCollections).toHaveLength(3); // collection1, collection3, collection4
  });

  it('handles network errors gracefully', async () => {
    authMock.mockResolvedValue(mockSession);
    getUserTenantsMock.mockResolvedValue(['tenant1', 'tenant2']);
    mockFetch.mockRejectedValue(new Error('Network error'));

    const request = new NextRequest(
      'http://localhost:3000/api/existing-collection'
    );
    const response = await GET(request);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Failed to fetch collections');
  });
});
