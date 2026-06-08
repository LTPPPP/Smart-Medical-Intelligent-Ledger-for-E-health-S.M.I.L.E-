import type { Metadata } from "next";
import { PaymentHistory } from "@/components/payments";

export const metadata: Metadata = {
    title: "Payments",
};

export default function PaymentsPage() {
    return <PaymentHistory />;
}
