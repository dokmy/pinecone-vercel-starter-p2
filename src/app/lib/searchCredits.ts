import { currentUser } from "@clerk/nextjs";
import prismadb from "./prismadb";
import { NextResponse } from "next/server";

export const incrementSearchCredit = async (userId: string, no_of_credits:number) => {

  if (!userId) {
    return;
  }

  const user = await currentUser();
  const userName = user?.firstName + " " + user?.lastName;
  const userEmail = user?.emailAddresses[0].emailAddress;

  const userSearchCredit = await prismadb.userSearchCredit.findUnique({
    where: { userId: userId },
  });

  if (userSearchCredit) {
    await prismadb.userSearchCredit.update({
      where: { userId: userId },
      data: { count: userSearchCredit.count + no_of_credits },
    });
  } else {
    await prismadb.userSearchCredit.create({
      data: { userId: userId, count: no_of_credits, userName: userName, userEmail: userEmail },
    });
  }
};

export const deductSearchCredit = async (userId: string) => {

  if (!userId) {
    return;
  }

  const userSearchCredit = await prismadb.userSearchCredit.findUnique({
    where: { userId: userId },
  });

  if (userSearchCredit) {
    await prismadb.userSearchCredit.update({
      where: { userId: userId },
      data: { count: userSearchCredit.count - 1 },
    });
  } else {
    return new NextResponse("No user record.", {status:400})
  }
};



export const checkSearchCredits = async (userId: string) => {

  if (!userId) {
    return false;
  }

  const userSearchCredit = await prismadb.userSearchCredit.findUnique({
    where: { userId: userId },
  });

  if (!userSearchCredit) {
    return false;
  } else {
    return true;
  }
};

export const getSearchCreditCount = async (userId: string) => {

  if (!userId) {
    return false;
  }

  const userSearchCredit = await prismadb.userSearchCredit.findUnique({
    where: {
      userId
    }
  });

  if (userSearchCredit == null) {
    return false
  }

  if (userSearchCredit.count == 0) {
    return 0
  }

  return userSearchCredit.count;
};