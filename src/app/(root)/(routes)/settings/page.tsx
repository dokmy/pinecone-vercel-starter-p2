import React from "react";
import { getMessageCreditCount } from "@/lib/messageCredits";
import { auth, currentUser } from "@clerk/nextjs";
import CryptoJS from "crypto-js";

// Encryption function
const AESEncrypt = (content: string, key: string) => {
  return CryptoJS.AES.encrypt(content, key).toString();
};

// You should store this key securely, preferably in environment variables
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "default-key";

const getSubscriptionMgtLink = async (userId: string) => {
  try {
    const response = await fetch(
      "https://x050mvneya.execute-api.us-east-2.amazonaws.com/prod/api/v1/payment/subscription-mgt-link",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userID: userId }),
      }
    );
    const data = await response.json();
    if (data.message === "success") {
      return data.data.link;
    }
  } catch (error) {
    console.error("Error fetching subscription management URL:", error);
  }
  return null;
};

const SettingsPage = async () => {
  const { userId } = auth();

  if (!userId) {
    return <div>No user Id. Please login again.</div>;
  }

  const encryptedUserId = encodeURIComponent(
    AESEncrypt(userId, ENCRYPTION_KEY)
  );

  const [creditCount, subscriptionMgtUrl] = await Promise.all([
    getMessageCreditCount(userId),
    getSubscriptionMgtLink(userId),
  ]);

  const user = await currentUser();
  const firstName = user?.firstName;

  return (
    <div className="h-full p-4 space-y-2">
      <h3 className="text-lg font-medium">Settings</h3>
      <div className="text-muted-foreground text-sm">
        Message credits left: {creditCount}
        {creditCount == 0 ? (
          <div className="flex flex-col gap-y-3">
            <p>
              Oops! It looks like you have no credits. Please upgrade or buy
              more.
            </p>
          </div>
        ) : null}
        <div className="mt-3 flex flex-col gap-y-3">
          <a
            href={subscriptionMgtUrl || "#"}
            className="text-black py-2 rounded bg-white text-sm w-40 px-2 text-center"
          >
            Manage Subscription
          </a>
          <a
            href={`http://fastlegal.dataxquad.com/pricing?p=${encryptedUserId}`}
            className="text-black py-2 rounded bg-white text-sm w-32 px-2 text-center"
          >
            Subscribe a Plan
          </a>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
