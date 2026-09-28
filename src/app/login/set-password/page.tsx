import { AuthLayout } from "@/components/templates/PublicChrome";
import { SetPasswordForm } from "@/components/organisms/SetPasswordForm";
import { getSessionUser } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function SetPasswordPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!user.mustSetPassword) redirect("/panel");
  return (
    <AuthLayout>
      <SetPasswordForm />
    </AuthLayout>
  );
}
