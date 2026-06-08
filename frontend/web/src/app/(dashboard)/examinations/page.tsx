import type { Metadata } from "next";

import { ExaminationsContent } from "./ExaminationsContent";

export const metadata: Metadata = {
    title: "Examinations",
};

export default function ExaminationsPage() {
    return <ExaminationsContent />;
}
