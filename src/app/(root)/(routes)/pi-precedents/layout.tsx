import { auth, currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { isAuthorizedForBetaFeatures } from "@/lib/accessControl";

export default async function PIPrecedentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = auth();

  if (!userId) {
    return redirect("/");
  }

  const user = await currentUser();
  const userEmail = user?.emailAddresses?.[0]?.emailAddress;

  if (!isAuthorizedForBetaFeatures(userEmail)) {
    return redirect("/dashboard");
  }

  return <>{children}</>;
}
