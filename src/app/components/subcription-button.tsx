import React from "react";
import { Button } from "./ui/button";
import Link from "next/link";

interface SubscriptionProps {
  hasSubscription: boolean;
}

const SubscriptionButton: React.FC<SubscriptionProps> = ({
  hasSubscription,
}) => {
  if (hasSubscription) {
    return (
      <Link href="/">
        <Button>Manage Subscription</Button>
      </Link>
    );
  }
  return (
    <Link href="/">
      <Button>Upgrade</Button>
    </Link>
  );
};

export default SubscriptionButton;
