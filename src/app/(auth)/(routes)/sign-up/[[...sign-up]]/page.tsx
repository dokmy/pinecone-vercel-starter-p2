import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="bg-gradient-to-r from-gray-700 via-gray-900 to-black w-screen h-screen">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <SignUp />
      </div>
    </div>
  );
}
