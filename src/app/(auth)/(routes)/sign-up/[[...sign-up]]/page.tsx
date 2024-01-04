import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="bg-gradient-to-r from-gray-700 via-gray-900 to-black w-screen h-screen">
      <SignUp />;
    </div>
  );
}
