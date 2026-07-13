import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { FileTransfer } from '@/components/files/file-transfer';
import { FILE_SESSION_COOKIE, isValidFileSessionToken } from '@/lib/file-auth';

export const metadata: Metadata = {
  title: 'Private file relay',
  description: 'Encrypted uploads and verified downloads through the trusted relay origin.',
};

export default async function AhihiPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(FILE_SESSION_COOKIE)?.value;
  return <FileTransfer initialAuthenticated={isValidFileSessionToken(token)} />;
}
