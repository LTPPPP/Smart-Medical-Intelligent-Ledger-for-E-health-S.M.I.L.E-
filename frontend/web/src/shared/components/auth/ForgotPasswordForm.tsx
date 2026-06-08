// ============================================================
// Forgot password form — client component
// ============================================================

"use client";

import Link from "next/link";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROUTES } from "@/constants";
import { useTranslation } from "@/hooks";
import {
    forgotPasswordSchema,
    type ForgotPasswordFormData,
} from "@/lib/validators";

export function ForgotPasswordForm() {
    const { t } = useTranslation();
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting, isSubmitSuccessful },
    } = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: { email: "" },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const onSubmit = async (_: ForgotPasswordFormData) => {
        // TODO: Implement forgot password API call
        await new Promise((resolve) => setTimeout(resolve, 1000));
    };

    return (
        <Card>
            <CardHeader className="text-center">
                <CardTitle className="text-xl">{t("auth.resetPasswordTitle")}</CardTitle>
                <CardDescription>
                    {t("auth.resetPasswordSubtitle")}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isSubmitSuccessful ? (
                    <div className="rounded-md bg-primary/10 p-4 text-center text-sm">
                        <p className="font-medium">{t("auth.checkYourEmail")}</p>
                        <p className="mt-1 text-muted-foreground">
                            {t("auth.resetLinkSentDetail")}
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">{t("auth.emailLabel", "Email")}</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                autoComplete="email"
                                {...register("email")}
                            />
                            {errors.email && (
                                <p className="text-xs text-destructive">
                                    {errors.email.message}
                                </p>
                            )}
                        </div>

                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            {t("auth.sendResetLink", "Send reset link")}
                        </Button>
                    </form>
                )}
            </CardContent>
            <CardFooter className="justify-center">
                <Link
                    href={ROUTES.LOGIN}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
                >
                    <ArrowLeft className="h-3 w-3" />
                    {t("auth.backToLogin", "Back to login")}
                </Link>
            </CardFooter>
        </Card>
    );
}
