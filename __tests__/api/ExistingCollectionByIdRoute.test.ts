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
import { GET } from '@/app/api/existing-collection/[collectionId]/route';
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

const mockCollectionResponse = {
  id: 'test-collection',
  title: 'Test Collection',
  description: 'A test collection',
  tenant: 'tenant1',
};

describe('GET /api/existing-collection/[collectionId]', () => {
  const mockParams = { params: { collectionId: 'test-collection' } };

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
      'https://staging.openveda.cloud/api/stac/collections/test-collection'
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
    const response = await GET(request, {
      params: { collectionId: 'nonexistent-collection' },
    });

    expect(response.status).toBe(404);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://staging.openveda.cloud/api/stac/collections/nonexistent-collection'
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
    const response = await GET(request, {
      params: { collectionId: 'collection with spaces' },
    });

    expect(response.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://staging.openveda.cloud/api/stac/collections/collection%20with%20spaces'
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
