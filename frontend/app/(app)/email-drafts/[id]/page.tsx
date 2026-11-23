import { EmailDraftDetailView } from '@/components/email-draft-detail-view';

export default async function EmailDraftDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EmailDraftDetailView id={id} />;
}
