import { redirect } from "next/navigation";

export default function LegacyCompleteSignupPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token;
  redirect(token ? `/complete-signup?token=${encodeURIComponent(token)}` : "/complete-signup");
}
