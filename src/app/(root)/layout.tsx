import Navbar from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import { checkSubscription } from "@/lib/subscriptions";

const RootLayout = async ({ children }: { children: React.ReactNode }) => {
  const hasSubscription = await checkSubscription();
  return (
    <div className="flex flex-col h-screen">
      <div className="fixed inset-y-0 w-full h-16 z-20">
        <Navbar hasSubscription={hasSubscription} />
      </div>
      <div className="hidden md:flex mt-16 h-full w-20 flex-col fixed inset-y-0 border-r">
        <Sidebar />
      </div>
      <main className="flex-1 md:pl-20 pt-16">{children}</main>
    </div>
  );
};

export default RootLayout;
