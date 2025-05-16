import '@ant-design/v5-patch-for-react-19';
import AppLayout from '@/components/Layout';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';

const DISABLE_AUTH = process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true';

export default async function Home() {
  if (DISABLE_AUTH) {
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

  const session = await auth();

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
