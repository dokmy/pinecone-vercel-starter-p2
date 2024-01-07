import Navbar from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";

const RootLayout = async ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="h-full">
      <div className="fixed inset-y-0 w-full h-16 z-20">
        <Navbar />
      </div>
      <div className="hidden md:flex mt-16 h-full w-20 flex-col fixed inset-y-0 border-r">
        <Sidebar />
      </div>
      <main className="md:pl-20 h-full pt-20">{children}</main>
    </div>
  );
};

export default RootLayout;
