import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IngestColumn } from '@/components/ingestion/_components/IngestColumn';
import { IngestPullRequest } from '@/types/ingest';

describe('IngestColumn', () => {
  const mockOnIngestSelect = vi.fn();

  const createMockPr = (title: string, ref: string): IngestPullRequest['pr'] =>
    ({
      title,
      head: { ref },
    }) as unknown as IngestPullRequest['pr'];

  const mockIngests: IngestPullRequest[] = [
    {
      pr: createMockPr(
        'Ingest Request for tenant1 Dataset',
        'refs/heads/tenant1-dataset'
      ),
      tenant: 'tenant1',
    },
    {
      pr: createMockPr(
        'Ingest Request for tenant2 Dataset',
        'refs/heads/tenant2-dataset'
      ),
      tenant: 'tenant2',
    },
  ];

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('should render title and ingests', () => {
    render(
      <IngestColumn
        title="Tenant: tenant1"
        ingests={mockIngests}
        onIngestSelect={mockOnIngestSelect}
        testId="tenant-column-tenant1"
      />
    );

    expect(screen.getByText('Tenant: tenant1')).toBeInTheDocument();
    expect(screen.getByTestId('tenant-column-tenant1')).toBeInTheDocument();
    expect(screen.getByText('tenant1 Dataset')).toBeInTheDocument();
    expect(screen.getByText('tenant2 Dataset')).toBeInTheDocument();
  });

  it('should call onIngestSelect when a button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <IngestColumn
        title="Tenant: tenant1"
        ingests={mockIngests}
        onIngestSelect={mockOnIngestSelect}
      />
    );

    await user.click(screen.getByText('tenant1 Dataset'));

    expect(mockOnIngestSelect).toHaveBeenCalledWith(
      'refs/heads/tenant1-dataset',
      'Ingest Request for tenant1 Dataset'
    );
  });

  it('should show empty state when there are no ingests', () => {
    render(
      <IngestColumn
        title="Tenant: tenant1"
        ingests={[]}
        onIngestSelect={mockOnIngestSelect}
      />
    );

    expect(screen.getByText('No pending ingests')).toBeInTheDocument();
  });
});
