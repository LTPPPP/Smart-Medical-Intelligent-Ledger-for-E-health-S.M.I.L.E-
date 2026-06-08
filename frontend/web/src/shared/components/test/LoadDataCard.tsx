"use client";

import { CheckCircle2, Database, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { useTranslation } from "@/hooks/useTranslation";
import type { TestResult } from "./connectionTestTypes";

interface Props {
    loadPatients: TestResult;
    loadAppointments: TestResult;
    onRunPatients: () => void;
    onRunAppointments: () => void;
}

export function LoadDataCard({
    loadPatients,
    loadAppointments,
    onRunPatients,
    onRunAppointments,
}: Props) {
    const { t } = useTranslation();

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    <CardTitle className="text-base">{t("test.loadData")}</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    <div className="flex gap-2">
                        <Button
                            onClick={onRunPatients}
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            disabled={loadPatients.status === "running"}
                        >
                            {loadPatients.status === "running" ? (
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            ) : null}
                            Patients
                        </Button>
                        <Button
                            onClick={onRunAppointments}
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            disabled={loadAppointments.status === "running"}
                        >
                            {loadAppointments.status === "running" ? (
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            ) : null}
                            Appointments
                        </Button>
                    </div>

                    {[loadPatients, loadAppointments].map(
                        (test) =>
                            test.message && (
                                <div
                                    key={test.name}
                                    className="flex items-center justify-between text-sm"
                                >
                                    <div className="flex items-center gap-1">
                                        {test.status === "success" ? (
                                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                                        ) : (
                                            <XCircle className="h-3.5 w-3.5 text-red-500" />
                                        )}
                                        <span>{test.message}</span>
                                    </div>
                                    {test.responseTime && (
                                        <span className="font-mono text-xs text-muted-foreground">
                                            {test.responseTime.toFixed(0)}ms
                                        </span>
                                    )}
                                </div>
                            )
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
