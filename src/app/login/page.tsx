import { Suspense } from "react";

import { LoginForm } from "@/components/auth/login-form";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <Card className="w-full max-w-md space-y-5 border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-[0.14em] text-slate-500 uppercase">
            Private Access
          </p>
          <CardTitle className="text-2xl">Dedy Command Center</CardTitle>
          <CardDescription>
            Single-user authentication is enabled. Sign in to access the private dashboard.
          </CardDescription>
        </div>

        <Suspense fallback={<p className="text-sm text-slate-600">Loading login form...</p>}>
          <LoginForm defaultEmail={process.env.AUTH_EMAIL ?? ""} />
        </Suspense>
      </Card>
    </div>
  );
}
