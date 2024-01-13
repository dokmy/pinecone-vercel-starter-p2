import React from "react";
import SubscriptionButton from "@/components/subcription-button";
import { checkSubscription } from "@/lib/subscriptions";
import { getSearchCreditCount } from "@/lib/searchCredits";
import { auth } from "@clerk/nextjs";

const SettingsPage = async () => {
  const { userId } = auth();
  const hasSubscription = await checkSubscription();

  if (!userId) {
    return <div>No user Id. Please login again.</div>;
  }

  const creditCount = await getSearchCreditCount(userId);

  return (
    <div className="h-full p-4 space-y-2">
      <h3 className="text-lg font-medium">Settings</h3>
      <div className="text-muted-foreground text-sm">
        {hasSubscription
          ? `You are currently on a pro plan. Search credits left: ${creditCount}`
          : `You are currently on a free plan. Search credits left: ${creditCount}`}
      </div>
      <div>
        <SubscriptionButton hasSubscription={hasSubscription} />
      </div>
    </div>
  );
};

export default SettingsPage;
