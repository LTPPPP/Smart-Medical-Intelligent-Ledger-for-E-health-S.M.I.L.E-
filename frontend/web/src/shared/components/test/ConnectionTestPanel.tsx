// ============================================================
// ConnectionTestPanel — comprehensive API connectivity testing
// ============================================================

"use client";

import { Wifi, WifiOff, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";
import { useTranslation } from "@/hooks/useTranslation";
import { useConnectionTests } from "@/hooks/useConnectionTests";
import { HealthCheckCard } from "./HealthCheckCard";
import { LoadDataCard } from "./LoadDataCard";
import { StressTestCard } from "./StressTestCard";
import { WebVitalsCard } from "./WebVitalsCard";
import { ResponseDataPreview } from "./ResponseDataPreview";

export function ConnectionTestPanel() {
    const { t } = useTranslation();
    const { metrics } = usePerformanceMonitor();
    const {
        healthCheck,
        loadPatients,
        loadAppointments,
        stressTest,
        stressResult,
        stressProgress,
        runHealthCheck,
        runLoadPatients,
        runLoadAppointments,
        runStressTest,
        runAllTests,
    } = useConnectionTests();

    const isConnected = healthCheck.status === "success";

    return (
        <div className="space-y-6">
            {/* Connection status banner */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {isConnected ? (
                                <Wifi className="h-5 w-5 text-green-500" />
                            ) : (
                                <WifiOff className="h-5 w-5 text-muted-foreground" />
                            )}
                            <CardTitle>{t("test.title")}</CardTitle>
                        </div>
                        <Button onClick={runAllTests} size="sm">
                            <Zap className="mr-2 h-4 w-4" />
                            Run All Tests
                        </Button>
                    </div>
                    <CardDescription>{t("test.description")}</CardDescription>
                </CardHeader>
            </Card>

            {/* Test panels grid */}
            <div className="grid gap-4 md:grid-cols-2">
                <HealthCheckCard healthCheck={healthCheck} onRun={runHealthCheck} />
                <LoadDataCard
                    loadPatients={loadPatients}
                    loadAppointments={loadAppointments}
                    onRunPatients={runLoadPatients}
                    onRunAppointments={runLoadAppointments}
                />
                <StressTestCard
                    stressTest={stressTest}
                    stressResult={stressResult}
                    stressProgress={stressProgress}
                    onRun={runStressTest}
                />
                <WebVitalsCard metrics={metrics} />
            </div>

            <ResponseDataPreview
                healthCheck={healthCheck}
                loadPatients={loadPatients}
                loadAppointments={loadAppointments}
            />
        </div>
    );
}
