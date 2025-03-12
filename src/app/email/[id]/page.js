// src/app/email/[id]/page.js

export const dynamicParams = true;

import EmailDetail from '@/components/EmailDetail';

async function getEmailStats(id) {
  // Create a complete URL with protocol
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const url = new URL('/api/stats', baseUrl);
  url.searchParams.append('id', id);

  const res = await fetch(url.toString(), { 
    cache: 'no-store' 
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch email data');
  }
  return res.json();
}

export default async function Page({ params }) {
  const emailData = await getEmailStats(params.id);
  return <EmailDetail initialData={emailData} />;
}