import type { Metadata } from "next";

import { AppointmentsContent } from "./AppointmentsContent";

export const metadata: Metadata = {
    title: "Appointments",
};

export default function AppointmentsPage() {
    return <AppointmentsContent />;
}
