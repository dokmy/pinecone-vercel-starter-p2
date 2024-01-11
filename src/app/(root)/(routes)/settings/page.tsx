import React from "react";
import SubscriptionButton from "@/components/subcription-button";
import { checkSubscription } from "@/lib/subscriptions";

const settingsPage = async () => {
  const hasSubscription = await checkSubscription();

  return (
    <div className="items-center">
      <SubscriptionButton hasSubscription={hasSubscription} />
    </div>
  );
};

export default settingsPage;
