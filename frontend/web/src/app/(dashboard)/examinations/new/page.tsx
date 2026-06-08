import type { Metadata } from "next";
import { TreatmentFormContent } from "./TreatmentFormContent";

export const metadata: Metadata = {
  title: "New Treatment Record",
};

export default function TreatmentFormPage() {
  return <TreatmentFormContent />;
}
