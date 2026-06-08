"use client";

import { Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/hooks/useTranslation";
import { MetricCard } from "./MetricCard";

interface Metric {
    name: string;
    value: number;
    rating: "good" | "needs-improvement" | "poor";
}

interface Props {
    metrics: Metric[];
}

export function WebVitalsCard({ metrics }: Props) {
    const { t } = useTranslation();

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    <CardTitle className="text-base">{t("test.webVitals")}</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                {metrics.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                        {metrics.map((metric) => (
                            <MetricCard
                                key={metric.name}
                                label={metric.name}
                                value={
                                    metric.name === "CLS"
                                        ? metric.value.toFixed(3)
                                        : `${metric.value.toFixed(0)}ms`
                                }
                                rating={metric.rating}
                            />
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">
                        Metrics will appear after page load completes...
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
