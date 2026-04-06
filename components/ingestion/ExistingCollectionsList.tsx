'use client';

import { useEffect, useState } from 'react';
import { Select, Card, Typography, Empty, Input, Button } from 'antd';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useUserTenants } from '@/app/contexts/TenantContext';
import { truncateWords } from '@/utils/truncateWords';
import ErrorModal from '@/components/ui/ErrorModal';
import { SkeletonLoading } from './_components/SkeletonLoading';

// --- Types for STAC Collections API ---
interface StacCollection {
  id: string;
  title?: string;
  tenant?: string;
  description?: string;
}

interface StacCollectionsResponse {
  collections: StacCollection[];
  numberMatched?: number;
}

const { Title } = Typography;
const PAGE_SIZE = 10;

interface ExistingCollectionsListProps {
  onCollectionSelect: (data: Record<string, unknown>) => void;
}

const ExistingCollectionsList: React.FC<ExistingCollectionsListProps> = ({
  onCollectionSelect,
}) => {
  const { status: sessionStatus } = useSession();
  const router = useRouter();
  const [collections, setCollections] = useState<StacCollection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [collectionSelectError, setCollectionSelectError] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<string | undefined>(
    undefined
  );
  const [searchInputValue, setSearchInputValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [offset, setOffset] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [numberMatched, setNumberMatched] = useState<number | undefined>(
    undefined
  );
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const { tenants } = useUserTenants();

  const tenantOptions = [
    { value: undefined, label: 'All Tenants' },
    ...tenants
      .filter((tenant) => tenant.toLowerCase() !== 'public')
      .map((tenant) => ({ value: tenant, label: tenant })),
    { value: 'Public', label: 'Public' },
  ];

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/login');
    }

    if (sessionStatus === 'authenticated') {
      const fetchCollections = async () => {
        setIsLoading(true);
        setApiError('');

        try {
          const params = new URLSearchParams({
            limit: String(PAGE_SIZE),
            offset: String(offset),
          });

          if (searchTerm) {
            params.set('q', searchTerm);
          }

          if (selectedTenant) {
            params.set('tenant', selectedTenant);
          }

          const url = `/api/existing-collection?${params.toString()}`;
          const response = await fetch(url);

          if (!response.ok) {
            throw new Error(await response.text());
          }

          const data: StacCollectionsResponse = await response.json();
          const fetchedCollections = data.collections || [];
          setCollections(fetchedCollections);
          const total = data.numberMatched;
          setNumberMatched(total);
          setHasNextPage(
            total !== undefined
              ? offset + fetchedCollections.length < total
              : fetchedCollections.length === PAGE_SIZE
          );
        } catch (err) {
          setApiError(
            err instanceof Error ? err.message : 'An unknown error occurred.'
          );
          setCollections([]);
          setHasNextPage(false);
        } finally {
          setIsLoading(false);
          setHasLoadedOnce(true);
        }
      };

      fetchCollections();
    }
  }, [sessionStatus, router, selectedTenant, searchTerm, offset]);

  // Automatically clear the error after a delay
  useEffect(() => {
    if (apiError) {
      const timer = setTimeout(() => {
        setApiError(''); // Clear error after 5 seconds
      }, 5000);

      // Clean up the timer if the component unmounts or the error changes
      return () => clearTimeout(timer);
    }
  }, [apiError]);

  if (sessionStatus === 'loading' || (isLoading && !hasLoadedOnce)) {
    return (
      <>
        <Title level={3} style={{ marginBottom: 24 }}>
          Edit Existing Collection
        </Title>
        <SkeletonLoading
          count={PAGE_SIZE}
          bannerMessage="Loading existing collections from database..."
        />
      </>
    );
  }

  // Fetch collection details and call onCollectionSelect
  const handleCollectionSelect = async (collectionId: string) => {
    try {
      const response = await fetch(
        `/api/existing-collection/${encodeURIComponent(collectionId)}`
      );
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      onCollectionSelect(data);
    } catch (err) {
      setCollectionSelectError(
        err instanceof Error ? err.message : 'An unknown error occurred.'
      );
    }
  };

  return (
    <>
      <Title level={3} style={{ marginBottom: 24 }}>
        Edit Existing Collection
      </Title>
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <div>
          <Title level={5} style={{ marginBottom: 8 }}>
            Select Tenant
          </Title>
          <Select
            style={{ width: 220 }}
            options={tenantOptions}
            placeholder="Select a tenant (optional)"
            value={selectedTenant}
            onChange={(value) => {
              setSelectedTenant(value);
              setOffset(0);
            }}
            allowClear
            showSearch
            optionLabelProp="label"
          />
        </div>
        <div style={{ flex: 1 }}>
          <Title level={5} style={{ marginBottom: 8 }}>
            Search Collections
          </Title>
          <div style={{ display: 'flex', gap: 8 }}>
            <Input
              placeholder="Free-text queries against STAC metadata"
              value={searchInputValue}
              onChange={(event) => {
                const value = event.target.value;
                setSearchInputValue(value);

                if (!value.trim()) {
                  setSearchTerm('');
                  setOffset(0);
                }
              }}
              onPressEnter={() => {
                setSearchTerm(searchInputValue.trim());
                setOffset(0);
              }}
              allowClear
            />
            <Button
              type="primary"
              onClick={() => {
                setSearchTerm(searchInputValue.trim());
                setOffset(0);
              }}
            >
              Search
            </Button>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <div style={{ color: '#666' }}>
          {collections.length > 0
            ? `Showing ${offset + 1}-${offset + collections.length}${numberMatched !== undefined ? ` of ${numberMatched}` : ''}`
            : 'No collections in this page'}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            onClick={() =>
              setOffset((previousOffset) =>
                Math.max(previousOffset - PAGE_SIZE, 0)
              )
            }
            disabled={offset === 0}
          >
            Previous
          </Button>
          <Button
            onClick={() =>
              setOffset((previousOffset) => previousOffset + PAGE_SIZE)
            }
            disabled={!hasNextPage}
          >
            Next
          </Button>
        </div>
      </div>

      {isLoading ? (
        <SkeletonLoading count={PAGE_SIZE} />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 16,
          }}
        >
          {collections.length === 0 ? (
            <Empty description="No collections found" />
          ) : (
            collections.map((collection) => {
              const label = collection.title || collection.id;
              return (
                <Card
                  key={collection.id}
                  title={label}
                  style={{
                    width: 320,
                    borderRadius: 8,
                    boxShadow: '0 2px 8px #f0f1f2',
                  }}
                  hoverable
                  onClick={() => handleCollectionSelect(collection.id)}
                >
                  <div style={{ fontWeight: 500, marginBottom: 8 }}>
                    ID: {collection.id}
                  </div>
                  <div style={{ color: '#888', marginBottom: 8 }}>
                    {truncateWords(collection.description, 20)}
                  </div>
                  {collection.tenant && (
                    <div style={{ fontSize: 12, color: '#666' }}>
                      Tenant: {collection.tenant}
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>
      )}

      {apiError && (
        <ErrorModal context="collections-fetch" apiErrorMessage={apiError} />
      )}
      {collectionSelectError && (
        <ErrorModal
          context="collection-select"
          apiErrorMessage={collectionSelectError}
        />
      )}
    </>
  );
};

export default ExistingCollectionsList;
