'use client';

import { useEffect, useState } from 'react';
import { Select, Card, Spin, Typography, Empty, Alert } from 'antd';
const { Option, OptGroup } = Select;
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useUserTenants } from '@/app/contexts/TenantContext';
import { IngestPullRequest } from '@/types/ingest';

const { Title } = Typography;

type GroupedCollections = Record<string, IngestPullRequest[]>;

function groupCollectionsByTenant(
  ingests: IngestPullRequest[]
): GroupedCollections {
  return ingests.reduce((acc, ingest) => {
    const group =
      ingest.tenant && ingest.tenant !== '' ? ingest.tenant : 'Public';
    if (!acc[group]) acc[group] = [];
    acc[group].push(ingest);
    return acc;
  }, {} as GroupedCollections);
}

type SelectOption = {
  value: string;
  label: string;
  fullTitle: string;
};

type GroupedOption = {
  label: string;
  options: SelectOption[];
};

function buildGroupedOptions(grouped: GroupedCollections): GroupedOption[] {
  return Object.entries(grouped).map(([group, items]) => ({
    label: group,
    options: items.map((item) => ({
      value: item.pr.head.ref,
      label: item.pr.title.replace('Ingest Request for ', ''),
      fullTitle: item.pr.title,
    })),
  }));
}

function filterGroupedOptions(
  groups: GroupedOption[],
  selectedTenant?: string,
  searchValue?: string
): GroupedOption[] {
  let filtered = selectedTenant
    ? groups.filter((g) => g.label === selectedTenant)
    : groups;

  if (searchValue) {
    filtered = filtered
      .map((group) => ({
        ...group,
        options: group.options.filter((option) =>
          option.label.toLowerCase().includes(searchValue.toLowerCase())
        ),
      }))
      .filter((group) => group.options.length > 0);
  }
  return filtered;
}

interface ExistingCollectionsListProps {
  onCollectionSelect: (ref: string, title: string) => void;
}

const ExistingCollectionsList: React.FC<ExistingCollectionsListProps> = ({
  onCollectionSelect,
}) => {
  const { status: sessionStatus } = useSession();
  const router = useRouter();
  const [allIngests, setAllIngests] = useState<IngestPullRequest[]>([]);
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
      const fetchPRs = async () => {
        setIsLoading(true);
        setApiError('');
        try {
          const url = `api/list-ingests?ingestionType=collection`;
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(await response.text());
          }
          const { githubResponse } = await response.json();
          setAllIngests(githubResponse);
        } catch (err) {
          setApiError(
            err instanceof Error ? err.message : 'An unknown error occurred.'
          );
        } finally {
          setIsLoading(false);
        }
      };
      fetchPRs();
    }
  }, [sessionStatus, router]);

  const groupedCollections = groupCollectionsByTenant(allIngests);
  const groupedOptions = buildGroupedOptions(groupedCollections);
  const filteredGroupsWithSearch = filterGroupedOptions(
    groupedOptions,
    selectedTenant,
    searchValue
  );

  if (sessionStatus === 'loading' || isLoading) {
    return <Spin fullscreen />;
  }

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
      <Card
        style={{
          marginBottom: 24,
          borderRadius: 8,
          boxShadow: '0 2px 8px #f0f1f2',
        }}
      >
        <Title level={5} style={{ marginBottom: 16 }}>
          Select Tenant
        </Title>
        <Select
          style={{ width: 300 }}
          options={tenantOptions}
          placeholder="Select a tenant (optional)"
          value={selectedTenant}
          onSelect={setSelectedTenant}
          onChange={setSelectedTenant}
          allowClear
          showSearch
          optionLabelProp="label"
        />
      </Card>
      <Card
        title={
          selectedTenant
            ? `Collections for Tenant: ${selectedTenant}`
            : 'All Collections'
        }
        style={{ borderRadius: 8, boxShadow: '0 2px 8px #f0f1f2' }}
      >
        <Select
          style={{ width: '100%' }}
          showSearch
          placeholder="Select or search a collection"
          value={selectedCollection}
          onChange={(value) => {
            setSelectedCollection(value);
            const selected = filteredGroupsWithSearch
              .flatMap((g) => g.options)
              .find((opt) => opt.value === value);
            if (selected) {
              onCollectionSelect(selected.value, selected.fullTitle);
            }
          }}
          onSearch={setSearchValue}
          filterOption={false}
          notFoundContent={<Empty description="No collections found" />}
          allowClear
        >
          {filteredGroupsWithSearch.map((group) => (
            <OptGroup key={group.label} label={group.label}>
              {group.options.map((option) => (
                <Option
                  key={option.value}
                  value={option.value}
                  label={option.label}
                >
                  {option.label}
                </Option>
              ))}
            </OptGroup>
          ))}
        </Select>
      </Card>
    </>
  );
};

export default ExistingCollectionsList;
