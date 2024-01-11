import { auth } from "@clerk/nextjs";

import prismadb from "../../lib/prismadb";
import { NextResponse } from "next/server";

export const incrementSearchCredit = async (no_of_credits:number) => {
  const { userId } = auth();

  if (!userId) {
    return;
  }

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
      data: { userId: userId, count: no_of_credits },
    });
  }
};

export const deductSearchCredit = async () => {
  const { userId } = auth();

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



export const checkSearchCredits = async () => {
  const { userId } = auth();

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

export const getSearchCreditCount = async () => {
  const { userId } = auth();

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