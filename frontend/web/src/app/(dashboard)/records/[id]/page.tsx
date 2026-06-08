import type { Metadata } from "next";
import { RecordDetailContent } from "./RecordDetailContent";

export const metadata: Metadata = {
  title: "Medical Record Detail",
};

export default async function RecordDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RecordDetailContent id={id} />;
}
