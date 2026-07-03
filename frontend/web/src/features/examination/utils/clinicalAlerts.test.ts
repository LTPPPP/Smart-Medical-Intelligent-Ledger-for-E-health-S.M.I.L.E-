import { describe, expect, it } from "vitest";

import { buildClinicalAlerts } from "./clinicalAlerts";

describe("buildClinicalAlerts", () => {
  it("should summarize allergy, chronic disease, minor, and history alerts", () => {
    const alerts = buildClinicalAlerts({
      patient: {
        date_of_birth: "2015-01-01",
        allergies: ["Penicillin", "Latex"],
        chronic_diseases: ["Diabetes"],
      },
      medicalHistory: [
        {
          condition_name: "Asthma",
          condition_type: "chronic",
          notes: "Uses inhaler",
        },
      ],
      today: new Date("2026-07-03T00:00:00.000Z"),
    });

    expect(alerts).toEqual([
      {
        tone: "critical",
        label: "Allergies",
        value: "Penicillin, Latex",
      },
      {
        tone: "warning",
        label: "Minor patient",
        value:
          "Age 11. Confirm guardian/representative before consent-sensitive steps.",
      },
      {
        tone: "info",
        label: "Chronic diseases",
        value: "Diabetes",
      },
      {
        tone: "info",
        label: "Medical history",
        value: "Asthma (chronic): Uses inhaler",
      },
    ]);
  });

  it("should return a single no-known-alerts item when the clinical context is empty", () => {
    expect(buildClinicalAlerts({ patient: null, medicalHistory: [] })).toEqual([
      {
        tone: "neutral",
        label: "Clinical alerts",
        value: "No allergies, chronic diseases, or medical history recorded.",
      },
    ]);
  });
});
