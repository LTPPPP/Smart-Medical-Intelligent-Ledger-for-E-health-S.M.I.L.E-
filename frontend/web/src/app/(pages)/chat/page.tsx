"use client";

import { Icon } from "@iconify/react";

import { useTranslation } from "@/features/i18n";
import { AppShell } from "@/shared/components/layout/AppShell";

export default function ChatPage() {
	const { t } = useTranslation();

	return (
		<AppShell>
			<div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-8 sm:py-10">
				<section className="rounded-[20px] border p-8 [border-color:var(--surface-card-border)] [background:var(--surface-card-bg)]">
					<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-smile-primary text-white">
						<Icon icon="lucide:message-circle" className="h-6 w-6" />
					</div>
					<h1 className="mt-5 font-poppins text-2xl font-semibold text-smile-primary-dark">
						{t("chat.page.title", "SMILE scheduling assistant")}
					</h1>
					<p className="mt-3 font-inter text-sm leading-6 text-smile-description">
						{t(
							"chat.page.description",
							"The assistant now runs as a floating chat bubble across the app. Use the button in the bottom-right corner to open it, resize the chat window, start a new conversation, or use the guided booking flow.",
						)}
					</p>
				</section>
			</div>
		</AppShell>
	);
}
