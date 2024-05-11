import React from "react";
import { getMessageCreditCount } from "@/lib/messageCredits";
import { auth, currentUser } from "@clerk/nextjs";

const SettingsPage = async () => {
  const { userId } = auth();

  if (!userId) {
    return <div>No user Id. Please login again.</div>;
  }

  const creditCount = await getMessageCreditCount(userId);

  const user = await currentUser();
  const firstName = user?.firstName;

  return (
    <div className="h-full p-4 space-y-2">
      <h3 className="text-lg font-medium">Settings</h3>
      <div className="text-muted-foreground text-sm">
        Message credits left: {creditCount}
        {creditCount == 0 ? (
          <p>
            Oops! It looks like you have no credits. Please upgrade or buy more.
          </p>
        ) : null}
      </div>
    </div>
  );
};

export default SettingsPage;
