"use client";

import { useState } from "react";

import { Icon } from "@iconify/react";

interface TreatmentPlan {
	id: string;
	title: string;
	description: string;
	doctorName: string;
	createdAt: string;
	status: "pending" | "signed" | "expired";
}

interface TreatmentConsentProps {
	patientId: string;
	plans?: TreatmentPlan[];
	onSign?: (planId: string, signature: string) => Promise<void>;
}

export function TreatmentConsent({
	patientId,
	plans = [],
	onSign,
}: TreatmentConsentProps) {
	const [selectedPlan, setSelectedPlan] = useState<TreatmentPlan | null>(null);
	const [isSigning, setIsSigning] = useState(false);
	const [agreed, setAgreed] = useState(false);

	const handleSign = async () => {
		if (!selectedPlan || !agreed || !onSign) return;
		setIsSigning(true);
		try {
			await onSign(selectedPlan.id, `e-sign-${patientId}-${Date.now()}`);
			setSelectedPlan(null);
			setAgreed(false);
		} finally {
			setIsSigning(false);
		}
	};

	const pendingPlans = plans.filter((p) => p.status === "pending");
	const signedPlans = plans.filter((p) => p.status === "signed");

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				<div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
					<Icon
						icon="tabler:file-certificate"
						className="text-teal-600"
						width={20}
					/>
				</div>
				<div>
					<h3 className="font-semibold text-lg">Treatment Plan Consent</h3>
					<p className="text-sm text-muted-foreground">
						Review and e-sign treatment plans proposed by your doctor
					</p>
				</div>
			</div>

			{/* Pending Plans */}
			{pendingPlans.length > 0 && (
				<div className="space-y-3">
					<h4 className="text-sm font-medium text-slate-500 uppercase tracking-wide">
						Pending Review ({pendingPlans.length})
					</h4>
					{pendingPlans.map((plan) => (
						<div
							key={plan.id}
							className="glass-smile rounded-xl p-4 cursor-pointer hover:ring-2 hover:ring-teal-300 transition-all"
							onClick={() => setSelectedPlan(plan)}
						>
							<div className="flex items-start justify-between">
								<div>
									<h5 className="font-medium">{plan.title}</h5>
									<p className="text-sm text-muted-foreground mt-1">
										Dr. {plan.doctorName} ·{" "}
										{new Date(plan.createdAt).toLocaleDateString()}
									</p>
								</div>
								<span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
									Pending
								</span>
							</div>
						</div>
					))}
				</div>
			)}

			{/* Signed Plans */}
			{signedPlans.length > 0 && (
				<div className="space-y-3">
					<h4 className="text-sm font-medium text-slate-500 uppercase tracking-wide">
						Signed ({signedPlans.length})
					</h4>
					{signedPlans.map((plan) => (
						<div key={plan.id} className="nm-sunken rounded-xl p-4 opacity-75">
							<div className="flex items-start justify-between">
								<div>
									<h5 className="font-medium">{plan.title}</h5>
									<p className="text-sm text-muted-foreground mt-1">
										Dr. {plan.doctorName} ·{" "}
										{new Date(plan.createdAt).toLocaleDateString()}
									</p>
								</div>
								<span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full flex items-center gap-1">
									<Icon icon="tabler:check" width={12} />
									Signed
								</span>
							</div>
						</div>
					))}
				</div>
			)}

			{/* Sign Dialog */}
			{selectedPlan && (
				<div className="glass-smile rounded-xl p-6 border-2 border-teal-200 space-y-4">
					<h4 className="font-semibold text-lg">{selectedPlan.title}</h4>
					<div className="nm-sunken rounded-lg p-4 text-sm leading-relaxed">
						{selectedPlan.description}
					</div>
					<label className="flex items-start gap-3 cursor-pointer">
						<input
							type="checkbox"
							checked={agreed}
							onChange={(e) => setAgreed(e.target.checked)}
							className="mt-1 w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
						/>
						<span className="text-sm">
							I have read and understood the treatment plan. I consent to the
							proposed procedures and acknowledge the associated risks as
							explained by my doctor.
						</span>
					</label>
					<div className="flex gap-3">
						<button
							onClick={handleSign}
							disabled={!agreed || isSigning}
							className="px-6 py-2.5 bg-teal-600 text-white rounded-lg font-medium
                hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors flex items-center gap-2"
						>
							<Icon icon="tabler:signature" width={18} />
							{isSigning ? "Signing..." : "E-Sign Consent"}
						</button>
						<button
							onClick={() => {
								setSelectedPlan(null);
								setAgreed(false);
							}}
							className="px-4 py-2.5 border rounded-lg hover:bg-slate-50 transition-colors"
						>
							Cancel
						</button>
					</div>
				</div>
			)}

			{plans.length === 0 && (
				<div className="nm-sunken rounded-xl p-8 text-center">
					<Icon
						icon="tabler:file-off"
						className="mx-auto text-slate-400 mb-3"
						width={40}
					/>
					<p className="text-muted-foreground">No treatment plans to review</p>
				</div>
			)}
		</div>
	);
}
