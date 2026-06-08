import type { Metadata } from "next";
import { InitiatePayment } from "@/components/payments";

export const metadata: Metadata = {
    title: "Initiate Payment",
};

export default function InitiatePaymentPage() {
    return <InitiatePayment />;
}
