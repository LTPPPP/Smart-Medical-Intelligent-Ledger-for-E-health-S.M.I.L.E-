import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import PaymentCallbackPage from "./page";

const mocks = vi.hoisted(() => ({
	apiGet: vi.fn(),
	refetchPayments: vi.fn(),
	refundPayment: vi.fn(),
	routerPush: vi.fn(),
	payments: [] as Array<Record<string, unknown>>,
}));

const signedCallback = new URLSearchParams({
	vnp_ResponseCode: "00",
	vnp_TxnRef: "payment-1",
	vnp_TransactionNo: "transaction-1",
	vnp_Amount: "20000000",
	vnp_SecureHash: "signed-hash",
	appointmentId: "appointment-1",
});

vi.mock("next/navigation", () => ({
	useParams: () => ({ id: "appointment-1" }),
	useRouter: () => ({ back: vi.fn(), push: mocks.routerPush }),
	useSearchParams: () => signedCallback,
}));

vi.mock("@/features/i18n", () => ({
	useTranslation: () => ({
		t: (_key: string, fallback?: string) => fallback ?? _key,
	}),
}));

vi.mock("@/shared/components/layout/AppShell", () => ({
	AppShell: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("@/shared/api/client", () => ({
	apiClient: { get: mocks.apiGet },
}));

vi.mock("@/features/appointment/hooks/useAppointment", () => ({
	useAppointment: () => ({
		usePaymentsByAppointment: () => ({
			data: { data: { data: mocks.payments } },
			refetch: mocks.refetchPayments,
		}),
		refundPayment: mocks.refundPayment,
		isRefunding: false,
	}),
}));

const verifiedPayment = {
	payment_id: "payment-1",
	appointment_id: "appointment-1",
	amount: 200000,
	currency: "VND",
	status: "paid",
	provider: "vnpay",
	provider_txn_ref: "transaction-1",
	order_info: null,
	refund_amount: null,
	refunded_at: null,
	refund_status: null,
	refund_reason: null,
	refund_requested_by: null,
	refund_requested_at: null,
	refund_reviewed_by: null,
	refund_reviewed_at: null,
	created_at: "2026-07-31T00:00:00.000Z",
	updated_at: "2026-07-31T00:00:00.000Z",
};

describe("PaymentCallbackPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.payments = [];
		mocks.refetchPayments.mockResolvedValue({});
		mocks.refundPayment.mockResolvedValue({});
	});
	afterEach(cleanup);

	it("forwards the complete signed VNPay query and trusts the verified payment", async () => {
		mocks.apiGet.mockResolvedValue({ data: { data: verifiedPayment } });

		render(<PaymentCallbackPage />);

		expect(
			await screen.findByRole("heading", { name: "Payment Successful!" }),
		).toBeInTheDocument();
		expect(mocks.apiGet).toHaveBeenCalledWith(expect.any(String), {
			params: expect.objectContaining({
				vnp_ResponseCode: "00",
				vnp_TxnRef: "payment-1",
				vnp_TransactionNo: "transaction-1",
				vnp_Amount: "20000000",
				vnp_SecureHash: "signed-hash",
			}),
		});
	});

	it("shows a failure and never redirects when signature verification fails", async () => {
		mocks.apiGet.mockRejectedValue({
			isAxiosError: true,
			response: {
				status: 400,
				data: { message: "Invalid VNPay signature", code: "INVALID_SIGNATURE" },
			},
		});

		render(<PaymentCallbackPage />);

		expect(
			await screen.findByRole("heading", { name: "Payment Failed" }),
		).toBeInTheDocument();
		expect(
			screen.getByText(
				"Invalid request. Check the entered information and try again.",
			),
		).toBeInTheDocument();
		expect(screen.getByText("HTTP 400")).toBeInTheDocument();
		await waitFor(() => expect(mocks.refetchPayments).toHaveBeenCalled());
		expect(mocks.routerPush).not.toHaveBeenCalled();
	});

	it("disables duplicate refund requests while a request is open", async () => {
		mocks.apiGet.mockResolvedValue({ data: { data: verifiedPayment } });
		mocks.payments = [
			{ ...verifiedPayment, refund_status: "REQUESTED" },
		];

		render(<PaymentCallbackPage />);

		const pendingButton = await screen.findByRole("button", {
			name: "Refund request pending",
		});
		expect(pendingButton).toBeDisabled();
		expect(
			screen.queryByRole("button", { name: "Request refund" }),
		).not.toBeInTheDocument();
	});

	it("reviews refund details before submitting the mutation", async () => {
		const user = userEvent.setup();
		mocks.apiGet.mockResolvedValue({ data: { data: verifiedPayment } });
		mocks.payments = [verifiedPayment];

		render(<PaymentCallbackPage />);

		await user.click(
			await screen.findByRole("button", { name: "Request refund" }),
		);
		expect(mocks.refundPayment).not.toHaveBeenCalled();
		expect(
			screen.getByRole("dialog", { name: "Refund Request" }),
		).toBeVisible();

		await user.type(
			screen.getByLabelText("Reason for refund"),
			"Appointment was cancelled before treatment",
		);
		await user.click(screen.getByRole("button", { name: "Submit request" }));

		await waitFor(() =>
			expect(mocks.refundPayment).toHaveBeenCalledWith({
				paymentId: "payment-1",
				request: {
					amount: 200000,
					reason: "Appointment was cancelled before treatment",
				},
			}),
		);
	});
});
