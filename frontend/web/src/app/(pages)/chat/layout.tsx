"use client";

import { ProtectedRoute } from "@/shared/components/auth/ProtectedRoute";

export default function ChatLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <ProtectedRoute>{children}</ProtectedRoute>;
}
