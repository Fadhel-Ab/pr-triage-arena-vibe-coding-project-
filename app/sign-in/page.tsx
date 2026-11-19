import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { getViewer } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function SignInPage() {
  if ((await getViewer()).user) redirect("/");
  return <AuthForm mode="sign-in" />;
}
