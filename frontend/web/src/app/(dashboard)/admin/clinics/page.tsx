import type { Metadata } from "next";

import { AdminClinicsContent } from "./AdminClinicsContent";

export const metadata: Metadata = {
    title: "Clinic Management",
};

export default function AdminClinicsPage() {
    return <AdminClinicsContent />;
}
