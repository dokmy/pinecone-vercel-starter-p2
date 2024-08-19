import React from "react";
import { getMessageCreditCount } from "@/lib/messageCredits";
import { auth, currentUser } from "@clerk/nextjs";
import CryptoJS from "crypto-js";
import prismadb from "@/lib/prismadb"; // Ensure you have this import
import LanguageSelector from "@/components/LanguageSelector"; // We'll create this component

// Encryption function
const AESEncrypt = (content: string, key: string) => {
  return CryptoJS.AES.encrypt(content, key).toString();
};

// You should store this key securely, preferably in environment variables
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "default-key";

const getSubscriptionMgtLink = async (userId: string) => {
  console.log("Fetching subscription management link for userId:", userId);
  const requestBody = JSON.stringify({ userID: userId });
  console.log("Request body:", requestBody);
  try {
    const response = await fetch(
      "https://x050mvneya.execute-api.us-east-2.amazonaws.com/prod/api/v1/payment/subscription-mgt-link",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: requestBody,
      }
    );
    console.log("API Response status:", response.status);
    const responseText = await response.text();
    console.log("API Response text:", responseText);
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (error) {
      console.error("Error parsing JSON response:", error);
      return null;
    }
    console.log(
      "getSubscriptionMgtLink: data =",
      JSON.stringify(data, null, 2)
    );
    if (data.message === "success") {
      console.log("Returning subscription management link:", data.data.link);
      return data.data.link;
    } else {
      console.log("API response message is not 'success'");
    }
  } catch (error) {
    console.error("Error fetching subscription management URL:", error);
  }
  console.log("Returning null for subscription management link");
  return null;
};

const SettingsPage = async () => {
  const { userId } = auth();
  console.log("User ID from auth:", userId);

  if (!userId) {
    return <div>No user Id. Please login again.</div>;
  }

  const encryptedUserId = encodeURIComponent(
    AESEncrypt(userId, ENCRYPTION_KEY)
  );
  console.log("Encrypted User ID:", encryptedUserId);

  const [creditCount, subscriptionMgtUrl] = await Promise.all([
    getMessageCreditCount(userId),
    getSubscriptionMgtLink(userId),
  ]);

  console.log("Credit Count:", creditCount);
  console.log("Subscription Management URL:", subscriptionMgtUrl);

  const user = await currentUser();
  console.log("Current User:", user);
  const firstName = user?.firstName;

  const settings = await prismadb.settings.findUnique({
    where: { userId },
  });
  console.log("User Settings:", settings);

  const outputLanguage = settings?.outputLanguage || "English";
  console.log("Output Language:", outputLanguage);

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
          {creditCount == 0 ? (
            <a
              href={`http://fastlegal.dataxquad.com/pricing?p=${encryptedUserId}`}
              className="text-black py-2 rounded bg-white text-sm w-32 px-2 text-center"
            >
              Subscribe a Plan
            </a>
          ) : null}
        </div>
        <div className="mt-3">
          <LanguageSelector userId={userId} initialLanguage={outputLanguage} />
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
