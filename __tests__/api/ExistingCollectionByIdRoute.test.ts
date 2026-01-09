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
import { GET, PUT } from '@/app/api/existing-collection/[collectionId]/route';
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { validateTenantAccess } from '@/lib/serverTenantValidation';

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/serverTenantValidation', () => ({
  validateTenantAccess: vi.fn(),
}));

const authMock = auth as Mock;
const validateTenantAccessMock = validateTenantAccess as Mock;

// Helper function to create mock params with Promise wrapper
const createMockParams = (collectionId: string) => ({
  params: Promise.resolve({ collectionId }),
});

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
  accessToken: 'mock-access-token',
};

const mockCollectionResponse = {
  id: 'test-collection',
  title: 'Test Collection',
  description: 'A test collection',
  tenant: 'tenant1',
};

describe('GET /api/existing-collection/[collectionId]', () => {
  const mockParams = createMockParams('test-collection');

  it('returns 401 when user is not authenticated', async () => {
    authMock.mockResolvedValue(null);

    const request = new NextRequest(
      'http://localhost:3000/api/existing-collection/test-collection'
    );
    const response = await GET(request, mockParams);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Authentication required');
  });

  it('successfully fetches public collection', async () => {
    authMock.mockResolvedValue(mockSession);
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        ...mockCollectionResponse,
        tenant: 'Public',
      }),
    });

    const request = new NextRequest(
      'http://localhost:3000/api/existing-collection/test-collection'
    );
    const response = await GET(request, mockParams);

    expect(response.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://staging.openveda.cloud/api/stac/collections/test-collection',
      {
        headers: {
          Authorization: 'Bearer mock-access-token',
        },
      }
    );
    expect(validateTenantAccessMock).not.toHaveBeenCalled();

    const data = await response.json();
    expect(data.id).toBe('test-collection');
    expect(data.tenant).toBe('Public');
  });

  it('successfully fetches collection with no tenant', async () => {
    authMock.mockResolvedValue(mockSession);
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        ...mockCollectionResponse,
        tenant: '',
      }),
    });

    const request = new NextRequest(
      'http://localhost:3000/api/existing-collection/test-collection'
    );
    const response = await GET(request, mockParams);

    expect(response.status).toBe(200);
    expect(validateTenantAccessMock).not.toHaveBeenCalled();

    const data = await response.json();
    expect(data.tenant).toBe('');
  });

  it('successfully fetches collection when user has tenant access', async () => {
    authMock.mockResolvedValue(mockSession);
    validateTenantAccessMock.mockResolvedValue({
      isValid: true,
      userTenants: ['tenant1', 'tenant2'],
    });
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockCollectionResponse,
    });

    const request = new NextRequest(
      'http://localhost:3000/api/existing-collection/test-collection'
    );
    const response = await GET(request, mockParams);

    expect(response.status).toBe(200);
    expect(validateTenantAccessMock).toHaveBeenCalledWith(
      'tenant1',
      mockSession
    );

    const data = await response.json();
    expect(data.id).toBe('test-collection');
    expect(data.tenant).toBe('tenant1');
  });

  it('returns 403 when user does not have tenant access', async () => {
    authMock.mockResolvedValue(mockSession);
    validateTenantAccessMock.mockResolvedValue({
      isValid: false,
      userTenants: ['tenant2'],
      error: 'Access denied',
    });
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockCollectionResponse,
    });

    const request = new NextRequest(
      'http://localhost:3000/api/existing-collection/test-collection'
    );
    const response = await GET(request, mockParams);

    expect(response.status).toBe(403);
    expect(validateTenantAccessMock).toHaveBeenCalledWith(
      'tenant1',
      mockSession
    );

    const data = await response.json();
    expect(data.error).toBe(
      'Access denied for collection from tenant: tenant1'
    );
  });

  it('returns 404 when collection is not found in STAC API', async () => {
    authMock.mockResolvedValue(mockSession);
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => 'Collection not found',
    });

    const request = new NextRequest(
      'http://localhost:3000/api/existing-collection/nonexistent-collection'
    );
    const response = await GET(
      request,
      createMockParams('nonexistent-collection')
    );

    expect(response.status).toBe(404);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://staging.openveda.cloud/api/stac/collections/nonexistent-collection',
      {
        headers: {
          Authorization: 'Bearer mock-access-token',
        },
      }
    );

    const data = await response.json();
    expect(data.error).toBe('Collection not found: Collection not found');
  });

  it('handles STAC API server errors', async () => {
    authMock.mockResolvedValue(mockSession);
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'Internal server error',
    });

    const request = new NextRequest(
      'http://localhost:3000/api/existing-collection/test-collection'
    );
    const response = await GET(request, mockParams);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Collection not found: Internal server error');
  });

  it('handles network errors gracefully', async () => {
    authMock.mockResolvedValue(mockSession);
    mockFetch.mockRejectedValue(new Error('Network error'));

    const request = new NextRequest(
      'http://localhost:3000/api/existing-collection/test-collection'
    );
    const response = await GET(request, mockParams);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Failed to fetch collection');
  });

  it('properly encodes collection ID in STAC API URL', async () => {
    authMock.mockResolvedValue(mockSession);
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        ...mockCollectionResponse,
        id: 'collection with spaces',
        tenant: 'Public',
      }),
    });

    const encodedId = 'collection%20with%20spaces';
    const request = new NextRequest(
      `http://localhost:3000/api/existing-collection/${encodedId}`
    );
    const response = await GET(
      request,
      createMockParams('collection with spaces')
    );

    expect(response.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://staging.openveda.cloud/api/stac/collections/collection%20with%20spaces',
      {
        headers: {
          Authorization: 'Bearer mock-access-token',
        },
      }
    );
  });

  it('handles collection with undefined tenant property', async () => {
    authMock.mockResolvedValue(mockSession);
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        ...mockCollectionResponse,
        tenant: undefined,
      }),
    });

    const request = new NextRequest(
      'http://localhost:3000/api/existing-collection/test-collection'
    );
    const response = await GET(request, mockParams);

    expect(response.status).toBe(200);
    expect(validateTenantAccessMock).not.toHaveBeenCalled();

    const data = await response.json();
    expect(data.tenant).toBeUndefined();
  });
});

describe('PUT /api/existing-collection/[collectionId]', () => {
  const updateData = {
    id: 'test-collection',
    title: 'Updated Test Collection',
    description: 'Updated description',
    stac_version: '1.0.0',
    type: 'Collection',
    license: 'Apache-2.0',
    extent: {
      spatial: { bbox: [[-180, -90, 180, 90]] },
      temporal: { interval: [['2020-01-01T00:00:00Z', null]] },
    },
  };

  it('should successfully update a collection when authenticated with valid tenant access', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/existing-collection/test-collection',
      {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' },
      }
    );

    authMock.mockResolvedValue({
      user: { email: 'test@example.com' },
      tenants: ['tenant1'],
      accessToken: 'mock-access-token',
    });

    validateTenantAccessMock.mockResolvedValue({ isValid: true });

    // Mock existing collection fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 'test-collection',
        tenant: 'tenant1',
        title: 'Original Title',
      }),
    });

    // Mock update response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...updateData,
        tenant: 'tenant1',
      }),
    });

    const response = await PUT(request, createMockParams('test-collection'));

    expect(response.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(2);

    // Verify existing collection was fetched first
    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      'https://staging.openveda.cloud/api/stac/collections/test-collection',
      {
        headers: {
          Authorization: 'Bearer mock-access-token',
        },
      }
    );

    // Verify update request
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      'https://staging.openveda.cloud/api/stac/collections/test-collection',
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-access-token',
        },
        body: JSON.stringify(updateData),
      }
    );

    expect(validateTenantAccessMock).toHaveBeenCalledWith('tenant1', {
      user: { email: 'test@example.com' },
      tenants: ['tenant1'],
      accessToken: 'mock-access-token',
    });
  });

  it('should return 401 when not authenticated', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/existing-collection/test-collection',
      {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' },
      }
    );

    authMock.mockResolvedValue(null);

    const response = await PUT(request, createMockParams('test-collection'));

    expect(response.status).toBe(401);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should return 404 when collection not found', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/existing-collection/nonexistent-collection',
      {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' },
      }
    );

    authMock.mockResolvedValue({
      user: { email: 'test@example.com' },
      tenants: ['tenant1'],
      accessToken: 'mock-access-token',
    });

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    const response = await PUT(
      request,
      createMockParams('nonexistent-collection')
    );

    expect(response.status).toBe(404);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://staging.openveda.cloud/api/stac/collections/nonexistent-collection',
      {
        headers: {
          Authorization: 'Bearer mock-access-token',
        },
      }
    );
  });

  it('should return 403 when user lacks tenant access', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/existing-collection/test-collection',
      {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' },
      }
    );

    authMock.mockResolvedValue({
      user: { email: 'test@example.com' },
      tenants: ['other-tenant'],
      accessToken: 'mock-access-token',
    });

    validateTenantAccessMock.mockResolvedValue({ isValid: false });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 'test-collection',
        tenant: 'restricted-tenant',
      }),
    });

    const response = await PUT(request, createMockParams('test-collection'));

    expect(response.status).toBe(403);
    expect(validateTenantAccessMock).toHaveBeenCalledWith('restricted-tenant', {
      user: { email: 'test@example.com' },
      tenants: ['other-tenant'],
      accessToken: 'mock-access-token',
    });
  });

  it('should allow updates to public collections', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/existing-collection/public-collection',
      {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' },
      }
    );

    authMock.mockResolvedValue({
      user: { email: 'test@example.com' },
      tenants: ['tenant1'],
      accessToken: 'mock-access-token',
    });

    // Mock existing collection fetch (public collection)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 'public-collection',
        tenant: 'Public',
      }),
    });

    // Mock update response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...updateData,
        tenant: 'Public',
      }),
    });

    const response = await PUT(request, createMockParams('public-collection'));

    expect(response.status).toBe(200);
    expect(validateTenantAccessMock).not.toHaveBeenCalled();
  });

  it('should handle STAC API update errors', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/existing-collection/test-collection',
      {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' },
      }
    );

    authMock.mockResolvedValue({
      user: { email: 'test@example.com' },
      tenants: ['tenant1'],
      accessToken: 'mock-access-token',
    });

    validateTenantAccessMock.mockResolvedValue({ isValid: true });

    // Mock existing collection fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 'test-collection',
        tenant: 'tenant1',
      }),
    });

    // Mock failed update
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => 'Invalid collection data',
    });

    const response = await PUT(request, createMockParams('test-collection'));

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe(
      'Failed to update collection: Invalid collection data'
    );
  });

  it('should handle network errors gracefully', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/existing-collection/test-collection',
      {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' },
      }
    );

    authMock.mockResolvedValue({
      user: { email: 'test@example.com' },
      tenants: ['tenant1'],
      accessToken: 'mock-access-token',
    });

    mockFetch.mockRejectedValue(new Error('Network error'));

    const response = await PUT(request, createMockParams('test-collection'));

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Failed to update collection');
  });
});
