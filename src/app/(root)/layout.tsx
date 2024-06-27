import Navbar from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import {
  incrementSearchCredit,
  checkSearchCredits,
  getSearchCreditCount,
} from "@/lib/searchCredits";
import {
  incrementMessageCredit,
  checkMessageCredits,
  getMessageCreditCount,
} from "@/lib/messageCredits";
import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";

const RootLayout = async ({ children }: { children: React.ReactNode }) => {
  const { userId } = auth();

  if (!userId) {
    return redirect("/");
  }
  const inSearchCreditsDb = await checkSearchCredits(userId);

  if (!inSearchCreditsDb) {
    await incrementSearchCredit(userId, 5);
    console.log("First time logging in. 5 credits are given.");
  }

  const inMessageCreditsDb = await checkMessageCredits(userId);

  if (!inMessageCreditsDb) {
    await incrementMessageCredit(userId, 50);
    console.log("First time logging in. 50 credits are given.");
  }

  const messageCredits = await getMessageCreditCount(userId);

  let zeroMessageCredits = false;
  if (messageCredits == 0) {
    zeroMessageCredits = true;
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="fixed inset-y-0 w-full h-16 z-20">
        <Navbar zeroMessageCredits={zeroMessageCredits} />
      </div>
      <div className="hidden md:flex mt-16 h-full w-20 flex-col fixed inset-y-0 border-r">
        <Sidebar />
      </div>
      <main className="flex-1 md:pl-20 pt-16">{children}</main>
    </div>
  );
};

export default RootLayout;
