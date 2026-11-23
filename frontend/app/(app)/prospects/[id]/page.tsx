import { ProspectDetailView } from '@/components/prospect-detail-view';

export default async function ProspectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProspectDetailView id={id} />;
}
