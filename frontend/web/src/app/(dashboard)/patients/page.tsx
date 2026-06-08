import type { Metadata } from "next";

import { PatientsContent } from "./PatientsContent";

export const metadata: Metadata = {
    title: "Patients",
};

export default function PatientsPage() {
    return <PatientsContent />;
}
