import type { Metadata } from "next";
import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/features/auth/LoginForm";
import { SessionExpiredNotice } from "@/components/features/auth/SessionExpiredNotice";

export const metadata: Metadata = {
  title: "Ingresar · Auto Help Desk",
};

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Auto Help Desk</CardTitle>
          <CardDescription>Ingresá con tu cuenta para continuar.</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={null}>
            <SessionExpiredNotice />
          </Suspense>
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  );
}
