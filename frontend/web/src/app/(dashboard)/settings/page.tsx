import type { Metadata } from "next";

import { SettingsContent } from "./SettingsContent";

export const metadata: Metadata = {
    title: "Settings",
};

export default function SettingsPage() {
    return <SettingsContent />;
}
