"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { TestResult } from "./connectionTestTypes";

interface Props {
    healthCheck: TestResult;
    loadPatients: TestResult;
    loadAppointments: TestResult;
}

export function ResponseDataPreview({ healthCheck, loadPatients, loadAppointments }: Props) {
    if (!healthCheck.data && !loadPatients.data && !loadAppointments.data) return null;

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base">Response Data Preview</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {healthCheck.data && (
                        <div>
                            <p className="mb-1 text-sm font-medium">Health Check:</p>
                            <pre className="max-h-32 overflow-auto rounded-md bg-muted p-3 text-xs">
                                {JSON.stringify(healthCheck.data, null, 2)}
                            </pre>
                        </div>
                    )}
                    {loadPatients.data && (
                        <div>
                            <Separator className="mb-3" />
                            <p className="mb-1 text-sm font-medium">Patients:</p>
                            <pre className="max-h-40 overflow-auto rounded-md bg-muted p-3 text-xs">
                                {JSON.stringify(loadPatients.data, null, 2)}
                            </pre>
                        </div>
                    )}
                    {loadAppointments.data && (
                        <div>
                            <Separator className="mb-3" />
                            <p className="mb-1 text-sm font-medium">Appointments:</p>
                            <pre className="max-h-40 overflow-auto rounded-md bg-muted p-3 text-xs">
                                {JSON.stringify(loadAppointments.data, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
