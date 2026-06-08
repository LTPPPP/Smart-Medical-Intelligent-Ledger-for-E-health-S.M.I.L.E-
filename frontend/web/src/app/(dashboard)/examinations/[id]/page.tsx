import type { Metadata } from "next";
import { ClinicalExaminationContent } from "./ClinicalExaminationContent";

export const metadata: Metadata = {
  title: "Clinical Examination",
};

export default async function ClinicalExaminationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ClinicalExaminationContent id={id} />;
}
