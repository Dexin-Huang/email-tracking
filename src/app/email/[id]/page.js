// src/app/email/[id]/page.js

export const dynamicParams = true;

import EmailDetail from '@/components/EmailDetail';

async function getEmailStats(id) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/stats?id=${id}`,
    { cache: 'no-store' }
  );
  if (!res.ok) {
    throw new Error('Failed to fetch email data');
  }
  return res.json();
}

export default async function Page({ params }) {
  const emailData = await getEmailStats(params.id);
  return <EmailDetail initialData={emailData} />;
}