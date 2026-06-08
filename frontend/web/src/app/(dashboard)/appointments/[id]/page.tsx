import type { Metadata } from "next";

import { AppointmentDetailContent } from "./AppointmentDetailContent";

export const metadata: Metadata = {
    title: "Appointment Details",
};

export default async function AppointmentDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    return <AppointmentDetailContent id={id} />;
}
