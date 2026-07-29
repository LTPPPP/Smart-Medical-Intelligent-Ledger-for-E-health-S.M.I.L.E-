"use client";

import { Suspense } from "react";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Icon } from "@iconify/react";

import { useAuthStore } from "@/features/auth/store/authStore";
import { normalizeRole } from "@/shared/constants/roles";
import { ROUTES } from "@/shared/constants/routes";

const displayRole = (role: string) =>
	normalizeRole(role)
		.toLowerCase()
		.replace(/(^|_)([a-z])/g, (_, prefix: string, letter: string) =>
			`${prefix ? " " : ""}${letter.toUpperCase()}`,
		);

const safeDeniedPath = (value: string | null) =>
	value?.startsWith("/") && !value.startsWith("//") ? value : "this page";

function UnauthorizedContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { user, logout } = useAuthStore();
	const deniedPath = safeDeniedPath(searchParams.get("from"));
	const allowedRoles = (searchParams.get("roles") ?? "")
		.split(",")
		.map((role) => role.trim())
		.filter(Boolean)
		.map(displayRole);
	const currentRoles = (user?.roles ?? []).map(displayRole);

	const handleSignOut = () => {
		logout();
		router.replace(ROUTES.LOGIN);
	};

	return (
		<main className="flex min-h-screen items-center justify-center bg-background p-6">
			<section className="w-full max-w-2xl rounded-[24px] border p-8 text-center [background:var(--surface-card-bg)] [border-color:var(--surface-card-border)] [box-shadow:var(--surface-card-shadow)] sm:p-10">
				<div className="mb-6">
					<Icon
						icon="mdi:lock-alert"
						className="mx-auto text-red-500"
						width={88}
						height={88}
					/>
				</div>

				<p className="font-inter text-xs font-semibold uppercase tracking-[2px] text-red-500">
					Authorization error
				</p>
				<h1 className="mt-2 font-poppins text-3xl font-bold text-smile-primary-dark">
					Access denied
				</h1>
				<p className="mx-auto mt-3 max-w-lg text-base text-smile-description">
					Your signed-in role does not have permission to open{" "}
					<code className="rounded bg-red-50 px-1.5 py-0.5 font-mono text-sm text-red-700">
						{deniedPath}
					</code>
					.
				</p>

				<div className="mt-7 grid gap-3 text-left sm:grid-cols-2">
					<div className="rounded-2xl border p-4 [background:var(--surface-panel-bg)] [border-color:var(--surface-panel-border)]">
						<p className="text-xs font-semibold uppercase tracking-[1.5px] text-smile-description">
							Signed-in role
						</p>
						<p className="mt-1 font-semibold text-smile-title">
							{currentRoles.join(", ") || "Unknown"}
						</p>
					</div>
					<div className="rounded-2xl border p-4 [background:var(--surface-panel-bg)] [border-color:var(--surface-panel-border)]">
						<p className="text-xs font-semibold uppercase tracking-[1.5px] text-smile-description">
							Allowed roles
						</p>
						<p className="mt-1 font-semibold text-smile-title">
							{allowedRoles.join(", ") || "Additional permission required"}
						</p>
					</div>
				</div>

				<p className="mt-6 text-sm text-smile-description">
					Return to your dashboard or sign out and use another account.
				</p>
				<div className="mt-6 flex flex-col-reverse justify-center gap-3 sm:flex-row">
					<button
						type="button"
						onClick={handleSignOut}
						className="min-h-11 rounded-full border px-6 py-2.5 font-semibold text-smile-title transition hover:border-red-300 hover:text-red-600 [border-color:var(--surface-input-border)] [background:var(--surface-input-bg)]"
					>
						Sign out
					</button>
					<Link
						href={ROUTES.DASHBOARD}
						className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-smile-primary px-6 py-2.5 font-semibold text-white transition hover:bg-smile-primary-dark"
					>
						<Icon icon="lucide:layout-dashboard" width={18} />
						Go to Dashboard
					</Link>
				</div>
			</section>
		</main>
	);
}

export default function UnauthorizedPage() {
	return (
		<Suspense
			fallback={
				<main className="flex min-h-screen items-center justify-center bg-background p-6 text-smile-description">
					Loading access details...
				</main>
			}
		>
			<UnauthorizedContent />
		</Suspense>
	);
}
