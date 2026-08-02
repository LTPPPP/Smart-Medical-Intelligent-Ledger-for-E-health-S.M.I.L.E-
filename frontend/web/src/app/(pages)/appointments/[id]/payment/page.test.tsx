import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import PaymentPage from "./page";

const router = {
	back: vi.fn(),
	push: vi.fn(),
};

vi.mock("next/navigation", () => ({
	useParams: () => ({ id: "appointment-1" }),
	useRouter: () => router,
}));

vi.mock("@/features/i18n", () => ({
	useTranslation: () => ({
		t: (_key: string, fallback?: string) => fallback ?? _key,
	}),
}));

vi.mock("@/shared/components/auth/ProtectedRoute", () => ({
	ProtectedRoute: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("@/shared/components/layout/AppShell", () => ({
	AppShell: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("@/features/appointment/hooks/useAppointment", () => ({
	useAppointment: () => ({
		useAppointmentById: () => ({
			data: {
				data: {
					appointment_id: "appointment-1",
					appointment_code: "APT-2026-0001",
					payment_status: "unpaid",
					doctor_id: "doctor-1",
					clinic: { clinic_name: "S.M.I.L.E Dental Center" },
					service: {
						service_name: "Comprehensive Dental Examination",
						base_price: 200000,
					},
				},
			},
			isLoading: false,
			error: null,
			refetch: vi.fn(),
		}),
		createPayment: vi.fn(),
		isCreatingPayment: false,
	}),
}));

describe("PaymentPage", () => {
	beforeEach(() => vi.clearAllMocks());

	it("presents VNPay as the only supported payment gateway", () => {
		render(<PaymentPage />);

		expect(
			screen.getByRole("heading", { name: "Payment" }),
		).toBeInTheDocument();
		expect(screen.getByRole("img", { name: /vnpay/i })).toBeInTheDocument();
		expect(screen.getByText("VNPay")).toBeInTheDocument();
		expect(screen.queryByText("MoMo")).not.toBeInTheDocument();
		expect(screen.queryByText("ZaloPay")).not.toBeInTheDocument();
	});
});
