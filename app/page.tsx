import '@ant-design/v5-patch-for-react-19';
import AppLayout from '@/components/layout/Layout';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';

async function Home() {
  let session;
  try {
    session = await auth();
  } catch (error) {
    console.error('Error fetching session in home page:', error);
    // If auth fails, redirect to login
    redirect('/login');
  }

  if (!session) {
    redirect('/login');
  }

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
