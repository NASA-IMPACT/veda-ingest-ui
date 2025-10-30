'use client';

import { useEffect, useState } from 'react';
import { Select, Card, Spin, Typography, Empty, Alert } from 'antd';
const { Option, OptGroup } = Select;
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useUserTenants } from '@/app/contexts/TenantContext';
import { truncateWords } from '@/utils/truncateWords';

// --- Types for STAC Collections API ---
interface StacCollection {
  id: string;
  title?: string;
  tenant?: string;
  description?: string;
}

interface StacCollectionsResponse {
  collections: StacCollection[];
}

const { Title } = Typography;

interface ExistingCollectionsListProps {
  onCollectionSelect: (ref: string, title: string, data: any) => void;
}

const ExistingCollectionsList: React.FC<ExistingCollectionsListProps> = ({
  onCollectionSelect,
}) => {
  const { status: sessionStatus } = useSession();
  const router = useRouter();
  const [collections, setCollections] = useState<StacCollection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<string | undefined>(
    undefined
  );
  const [searchValue, setSearchValue] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<
    string | undefined
  >();

  const { allowedTenants } = useUserTenants();

  const tenantOptions = [
    { value: undefined, label: 'All Tenants' },
    ...allowedTenants.map((t) => ({ value: t, label: t })),
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
          let url = 'https://staging.openveda.cloud/api/stac/collections';
          if (selectedTenant) {
            url += `?tenant=${encodeURIComponent(selectedTenant)}`;
          }
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(await response.text());
          }
          const data: StacCollectionsResponse = await response.json();
          setCollections(data.collections);
        } catch (err) {
          setApiError(
            err instanceof Error ? err.message : 'An unknown error occurred.'
          );
        } finally {
          setIsLoading(false);
        }
      };
      fetchCollections();
    }
  }, [sessionStatus, router, selectedTenant]);

  // Build collection dropdown options
  const collectionOptions = collections
    .filter(
      (col) =>
        !searchValue ||
        col.title?.toLowerCase().includes(searchValue.toLowerCase()) ||
        col.id.toLowerCase().includes(searchValue.toLowerCase())
    )
    .map((col) => ({
      value: col.id,
      label: col.title || col.id,
      title: col.title,
    }));

  if (sessionStatus === 'loading' || isLoading) {
    return <Spin fullscreen />;
  }

  // Fetch collection details and call onCollectionSelect
  const handleCollectionSelect = async (
    collectionId: string,
    title: string
  ) => {
    try {
      const response = await fetch(
        `https://staging.openveda.cloud/api/stac/collections/${encodeURIComponent(collectionId)}`
      );
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      onCollectionSelect(collectionId, title, data);
    } catch (err) {
      // TODO: handle error (e.g., show a message)
    }
  };

  return (
    <>
      <Title level={3} style={{ marginBottom: 24 }}>
        Edit Existing Collection
      </Title>
      {apiError && (
        <Alert
          type="error"
          message={apiError}
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}
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
            onSelect={setSelectedTenant}
            onChange={setSelectedTenant}
            allowClear
            showSearch
            optionLabelProp="label"
          />
        </div>
        <div style={{ flex: 1 }}>
          <Title level={5} style={{ marginBottom: 8 }}>
            Select Collection
          </Title>
          <Select
            style={{ width: '100%' }}
            showSearch
            placeholder="Select or search a collection"
            value={selectedCollection}
            onChange={async (value) => {
              setSelectedCollection(value);
              const selected = collectionOptions.find(
                (opt) => opt.value === value
              );
              if (selected) {
                await handleCollectionSelect(
                  selected.value,
                  selected.title || selected.value
                );
              }
            }}
            onSearch={setSearchValue}
            filterOption={false}
            notFoundContent={<Empty description="No collections found" />}
            allowClear
            options={collectionOptions}
          />
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        {collectionOptions.length === 0 ? (
          <Empty description="No collections found" />
        ) : (
          collectionOptions.map((col) => {
            const collection = collections.find((c) => c.id === col.value);
            return (
              <Card
                key={col.value}
                title={col.label}
                style={{
                  width: 320,
                  borderRadius: 8,
                  boxShadow: '0 2px 8px #f0f1f2',
                }}
                hoverable
                onClick={() =>
                  handleCollectionSelect(col.value, col.title || col.value)
                }
              >
                <div style={{ fontWeight: 500, marginBottom: 8 }}>
                  ID: {col.value}
                </div>
                <div style={{ color: '#888', marginBottom: 8 }}>
                  {truncateWords(collection?.description, 20)}
                </div>
                {collection?.tenant && (
                  <div style={{ fontSize: 12, color: '#666' }}>
                    Tenant: {collection.tenant}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </>
  );
};

export default ExistingCollectionsList;
