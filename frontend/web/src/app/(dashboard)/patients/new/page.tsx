import type { Metadata } from "next";
import { AddPatientContent } from "./AddPatientContent";

export const metadata: Metadata = {
  title: "Add Patient",
};

export default function AddPatientPage() {
  return <AddPatientContent />;
}
