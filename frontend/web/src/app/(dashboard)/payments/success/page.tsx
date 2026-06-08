import type { Metadata } from "next";
import { PaymentSuccess } from "@/components/payments";

export const metadata: Metadata = {
    title: "Payment Successful",
};

export default function PaymentSuccessPage() {
    return <PaymentSuccess />;
}
