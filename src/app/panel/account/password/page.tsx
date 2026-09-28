import { PageHeader } from "@/components/molecules";
import { ChangePasswordForm } from "@/components/organisms/ChangePasswordForm";
import { requireUser } from "@/lib/session";

export default async function ChangePasswordPage() {
  await requireUser();

  return (
    <>
      <PageHeader
        title="تغییر رمز عبور"
        description="برای امنیت حساب، رمز فعلی را وارد کنید و یک رمز جدید انتخاب کنید."
      />
      <ChangePasswordForm />
    </>
  );
}
