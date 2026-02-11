import { Button, Card, List, Tooltip, Col } from 'antd';
import { IngestPullRequest } from '@/types/ingest';

interface IngestColumnProps {
  title: string;
  ingests: IngestPullRequest[];
  onIngestSelect: (ref: string, title: string) => void;
  testId?: string;
}

export const IngestColumn: React.FC<IngestColumnProps> = ({
  title,
  ingests,
  onIngestSelect,
  testId,
}) => {
  return (
    <Col xs={24} sm={12} md={8} lg={6} data-testid={testId}>
      <Card
        title={title}
        style={{
          marginBottom: 24,
          borderRadius: 8,
          boxShadow: '0 2px 8px #f0f1f2',
        }}
      >
        <List
          dataSource={ingests}
          renderItem={(item: IngestPullRequest) => (
            <List.Item>
              <Tooltip title={item.pr.title} placement="topLeft">
                <Button
                  onClick={() =>
                    onIngestSelect(item.pr.head.ref, item.pr.title)
                  }
                  block
                >
                  <span
                    style={{
                      display: 'block',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {item.pr.title.replace('Ingest Request for ', '')}
                  </span>
                </Button>
              </Tooltip>
            </List.Item>
          )}
          locale={{ emptyText: 'No pending ingests' }}
        />
      </Card>
    </Col>
  );
};
