"use client";

import { Activity, CheckCircle2, Loader2, Server, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { useTranslation } from "@/hooks/useTranslation";
import { StatusBadge } from "./StatusBadge";
import type { TestResult } from "./connectionTestTypes";

interface Props {
    healthCheck: TestResult;
    onRun: () => void;
}

export function HealthCheckCard({ healthCheck, onRun }: Props) {
    const { t } = useTranslation();

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Server className="h-4 w-4" />
                        <CardTitle className="text-base">{t("test.healthCheck")}</CardTitle>
                    </div>
                    <StatusBadge status={healthCheck.status} />
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    <Button
                        onClick={onRun}
                        variant="outline"
                        size="sm"
                        className="w-full"
                        disabled={healthCheck.status === "running"}
                    >
                        {healthCheck.status === "running" ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Activity className="mr-2 h-4 w-4" />
                        )}
                        Check API Gateway
                    </Button>
                    {healthCheck.responseTime && (
                        <p className="text-sm text-muted-foreground">
                            {t("test.responseTime")}:{" "}
                            <span className="font-mono font-medium">
                                {healthCheck.responseTime.toFixed(0)}ms
                            </span>
                        </p>
                    )}
                    {healthCheck.message && (
                        <div className="flex items-center gap-1 text-sm">
                            {healthCheck.status === "success" ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                            ) : (
                                <XCircle className="h-3.5 w-3.5 text-red-500" />
                            )}
                            {healthCheck.message}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
