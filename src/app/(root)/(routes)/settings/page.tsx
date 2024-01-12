import React from "react";
import SubscriptionButton from "@/components/subcription-button";
import { checkSubscription } from "@/lib/subscriptions";

const settingsPage = async () => {
  const hasSubscription = await checkSubscription();

  return (
    <div className="h-full p-4 space-y-2">
      <h3 className="text-lg font-medium">Settings</h3>
      <div className="text-muted-foreground text-sm">
        {hasSubscription
          ? "You are currently on a pro plan."
          : "You are currently on a free plan."}
      </div>
      <div>
        <SubscriptionButton hasSubscription={hasSubscription} />
      </div>
    </div>
  );
};

export default settingsPage;
