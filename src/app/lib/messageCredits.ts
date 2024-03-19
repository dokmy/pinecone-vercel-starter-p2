import { currentUser } from "@clerk/nextjs";
import prismadb from "./prismadb";
import { NextResponse } from "next/server";

export const incrementMessageCredit = async (userId: string, no_of_credits:number) => {

  if (!userId) {
    return;
  }

  const user = await currentUser();
  const userName = user?.firstName + " " + user?.lastName;
  const userEmail = user?.emailAddresses[0].emailAddress;

  const userMessageCredit = await prismadb.userMessageCredit.findUnique({
    where: { userId: userId },
  });

  if (userMessageCredit) {
    await prismadb.userMessageCredit.update({
      where: { userId: userId },
      data: { count: userMessageCredit.count + no_of_credits },
    });
  } else {
    await prismadb.userMessageCredit.create({
      data: { userId: userId, count: no_of_credits, userName: userName, userEmail: userEmail },
    });
  }
};

export const deductMessageCredit = async (userId: string) => {

  if (!userId) {
    return;
  }

  const userMessageCredit = await prismadb.userMessageCredit.findUnique({
    where: { userId: userId },
  });

  if (userMessageCredit) {
    await prismadb.userMessageCredit.update({
      where: { userId: userId },
      data: { count: userMessageCredit.count - 1 },
    });
  } else {
    return new NextResponse("No user record.", {status:400})
  }
};



export const checkMessageCredits = async (userId: string) => {

  if (!userId) {
    return false;
  }

  const userMessageCredit = await prismadb.userMessageCredit.findUnique({
    where: { userId: userId },
  });

  if (!userMessageCredit) {
    return false;
  } else {
    return true;
  }
};

export const getMessageCreditCount = async (userId: string) => {

  if (!userId) {
    return false;
  }

  const userMessageCredit = await prismadb.userMessageCredit.findUnique({
    where: {
      userId
    }
  });

  if (userMessageCredit == null) {
    return false
  }

  if (userMessageCredit.count == 0) {
    return 0
  }

  return userMessageCredit.count;
};