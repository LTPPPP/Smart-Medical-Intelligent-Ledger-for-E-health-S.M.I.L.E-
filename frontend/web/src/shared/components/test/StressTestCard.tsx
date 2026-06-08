"use client";

import { Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "@/hooks/useTranslation";
import { StatusBadge } from "./StatusBadge";
import type { StressTestResult, TestResult } from "./connectionTestTypes";

interface Props {
    stressTest: TestResult;
    stressResult: StressTestResult | null;
    stressProgress: number;
    onRun: () => void;
}

export function StressTestCard({ stressTest, stressResult, stressProgress, onRun }: Props) {
    const { t } = useTranslation();

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        <CardTitle className="text-base">{t("test.stressTest")}</CardTitle>
                    </div>
                    <StatusBadge status={stressTest.status} />
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    <Button
                        onClick={onRun}
                        variant="outline"
                        size="sm"
                        className="w-full"
                        disabled={stressTest.status === "running"}
                    >
                        {stressTest.status === "running" ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Zap className="mr-2 h-4 w-4" />
                        )}
                        Run 50 Sequential Requests
                    </Button>

                    {stressTest.status === "running" && (
                        <Progress value={stressProgress} className="h-2" />
                    )}

                    {stressResult && (
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                                <span className="text-muted-foreground">Success:</span>{" "}
                                <span className="font-medium text-green-600">{stressResult.successCount}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Failed:</span>{" "}
                                <span className="font-medium text-red-600">{stressResult.errorCount}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Avg:</span>{" "}
                                <span className="font-mono">{stressResult.avgResponseTime.toFixed(0)}ms</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">P95:</span>{" "}
                                <span className="font-mono">{stressResult.p95ResponseTime.toFixed(0)}ms</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Min:</span>{" "}
                                <span className="font-mono">{stressResult.minResponseTime.toFixed(0)}ms</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Max:</span>{" "}
                                <span className="font-mono">{stressResult.maxResponseTime.toFixed(0)}ms</span>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
