import { DetailModal } from "@/components/detail/DetailModal";

export default async function TitlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DetailModal id={id} isFullPage />;
}
