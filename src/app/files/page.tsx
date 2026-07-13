import type { Metadata } from 'next';
import { FileTransfer } from '@/components/files/file-transfer';

export const metadata: Metadata = {
  title: 'Private file relay',
  description: 'Encrypted uploads and verified downloads through the trusted relay origin.',
};

export default function FilesPage() {
  return <FileTransfer />;
}
