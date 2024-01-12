"use client";
import React from "react";
import { Button } from "./ui/button";
import axios from "axios";

interface SubscriptionProps {
  hasSubscription: boolean;
}

const SubscriptionButton: React.FC<SubscriptionProps> = ({
  hasSubscription,
}) => {
  const onClick = async () => {
    try {
      const response = await axios.get("/api/stripe");
      window.location.href = response.data.url;
    } catch (error) {
      console.log(error);
    }
  };

  if (hasSubscription) {
    return (
      <Button size="sm" onClick={onClick}>
        Manage Subscription
      </Button>
    );
  }
  return (
    <Button size="sm" onClick={onClick}>
      Upgrade
    </Button>
  );
};

export default SubscriptionButton;
