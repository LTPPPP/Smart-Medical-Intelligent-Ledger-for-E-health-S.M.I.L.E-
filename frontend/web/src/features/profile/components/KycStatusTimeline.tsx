"use client";

import { Icon } from "@iconify/react";
import { motion } from "framer-motion";

import type { KycData, KycStatus } from "@/features/auth/types/auth.type";

type StepState = "done" | "active" | "rejected" | "pending";

interface TimelineStep {
  label: string;
  state: StepState;
}

function buildSteps(status: KycStatus, ocrStatus?: KycData["ocrStatus"]): TimelineStep[] {
  if (status === "VERIFIED") {
    return [
      { label: "Submitted", state: "done" },
      { label: "OCR Check", state: "done" },
      { label: "Admin Review", state: "done" },
      { label: "Verified", state: "done" },
    ];
  }
  if (status === "REJECTED") {
    return [
      { label: "Submitted", state: "done" },
      { label: "OCR Check", state: "done" },
      { label: "Admin Review", state: "rejected" },
      { label: "Verified", state: "pending" },
    ];
  }
  if (status === "PENDING_REVIEW") {
    const ocrDone = ocrStatus === "COMPLETED" || ocrStatus === "SKIPPED" || ocrStatus === "FAILED";
    return [
      { label: "Submitted", state: "done" },
      { label: "OCR Check", state: ocrDone ? "done" : "active" },
      { label: "Admin Review", state: ocrDone ? "active" : "pending" },
      { label: "Verified", state: "pending" },
    ];
  }
  // NOT_SUBMITTED
  return [
    { label: "Submitted", state: "pending" },
    { label: "OCR Check", state: "pending" },
    { label: "Admin Review", state: "pending" },
    { label: "Verified", state: "pending" },
  ];
}

const dotVariants = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.08, duration: 0.3, ease: "easeOut" as const },
  }),
};

function dotClasses(state: StepState): string {
  switch (state) {
    case "done":
      return "bg-smile-primary";
    case "active":
      return "bg-smile-primary ring-4 ring-smile-primary/25 animate-pulse";
    case "rejected":
      return "bg-red-500";
    default:
      return "bg-gray-200 dark:bg-white/10";
  }
}

function labelClasses(state: StepState): string {
  switch (state) {
    case "done":
      return "text-smile-primary";
    case "active":
      return "text-smile-primary-dark";
    case "rejected":
      return "text-red-600";
    default:
      return "text-smile-description/60";
  }
}

interface KycStatusTimelineProps {
  status: KycStatus;
  ocrStatus?: KycData["ocrStatus"];
}

export function KycStatusTimeline({ status, ocrStatus }: KycStatusTimelineProps) {
  const steps = buildSteps(status, ocrStatus);

  return (
    <div>
      <div className="flex items-center">
        {steps.map((step, i) => (
          <div key={step.label} className={`flex items-center ${i < steps.length - 1 ? "flex-1" : ""}`}>
            <motion.span
              custom={i}
              variants={dotVariants}
              initial="hidden"
              animate="visible"
              className={`flex h-3 w-3 shrink-0 items-center justify-center rounded-full ${dotClasses(step.state)}`}
            >
              {step.state === "rejected" && <Icon icon="lucide:x" width={8} className="text-white" />}
            </motion.span>
            {i < steps.length - 1 && (
              <div
                className={
                  "mx-1.5 h-0.5 flex-1 rounded-full transition-colors " +
                  (step.state === "done" ? "bg-smile-primary" : "bg-gray-200 dark:bg-white/10")
                }
              />
            )}
          </div>
        ))}
      </div>
      <div className="mt-1.5 grid grid-cols-4">
        {steps.map((step, i) => (
          <p
            key={step.label}
            className={
              `font-inter text-[10px] font-semibold uppercase tracking-wide ${labelClasses(step.state)} ` +
              (i === 0 ? "text-left" : i === steps.length - 1 ? "text-right" : "text-center")
            }
          >
            {step.label}
          </p>
        ))}
      </div>
    </div>
  );
}
