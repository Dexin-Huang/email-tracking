// src/app/email/[id]/page.tsx

import { EmailStats } from '@/types';
import EmailDetail from '@/components/EmailDetail';

// Fetch data for the email
async function getEmailStats(id: string): Promise<EmailStats> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/stats?id=${id}`,
    {
      cache: 'no-store' // Disable cache to always get fresh data
    }
  );

  if (!res.ok) {
    // This will activate the closest `error.js` Error Boundary
    throw new Error('Failed to fetch email data');
  }

  return res.json();
}

export default async function EmailPage({
  params
}: {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const emailData = await getEmailStats(params.id);

  return <EmailDetail initialData={emailData} />;
}
