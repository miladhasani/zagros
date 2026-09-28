import { AuthLayout } from "@/components/templates/PublicChrome";
import { LoginForm } from "@/components/organisms/LoginForm";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <AuthLayout>
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
