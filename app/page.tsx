import '@ant-design/v5-patch-for-react-19';
import AppLayout from '@/components/layout/Layout';
// Force static generation - authentication is handled by middleware
export const dynamic = 'force-static';

function Home() {
  return (
    <AppLayout>
      <section
        style={{
          textAlign: 'center',
          marginTop: 48,
          marginBottom: 40,
          padding: 100,
        }}
      >
        This application allows users to initiate the data ingest process.
      </section>
    </AppLayout>
  );
}

export default Home;
