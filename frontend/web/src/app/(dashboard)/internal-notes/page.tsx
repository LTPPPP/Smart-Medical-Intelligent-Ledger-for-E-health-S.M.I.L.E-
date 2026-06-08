import type { Metadata } from "next";
import { InternalNotesContent } from "./InternalNotesContent";

export const metadata: Metadata = {
  title: "Internal Notes",
};

export default function InternalNotesPage() {
  return <InternalNotesContent />;
}
