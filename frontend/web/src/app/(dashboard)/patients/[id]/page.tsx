import type { Metadata } from "next";

import { PatientDetailContent } from "./PatientDetailContent";

export const metadata: Metadata = {
    title: "Patient Details",
};

export default async function PatientDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    return <PatientDetailContent id={id} />;
}
