import type { Metadata } from "next";

import { RecordsContent } from "./RecordsContent";

export const metadata: Metadata = {
    title: "Medical Records",
};

export default function RecordsPage() {
    return <RecordsContent />;
}
