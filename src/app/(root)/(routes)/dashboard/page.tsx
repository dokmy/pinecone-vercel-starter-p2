"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { auth, useUser } from "@clerk/nextjs";
import Link from "next/link";
import axios from "axios";
import { useState, useEffect } from "react";
import { Search } from "@prisma/client";
import { Button } from "@/components/ui/button";

const dashboardPage = () => {
  const [searches, setSearches] = useState<null | Search[]>(null);
  const { user } = useUser();
  useEffect(() => {
    const fetchSearches = async () => {
      if (user) {
        try {
          const response = await axios.post(`/api/get-searches`, {
            userId: user.id,
          });
          setSearches(response.data);
        } catch (error) {
          console.log("Error feteching searches: ", error);
        }
      }
    };
    fetchSearches();
  }, [user]);

  const formatDate = (dateString) => {
    // Check if dateString is not provided or is empty
    if (!dateString) {
      return "N/A";
    }

    // Try to parse the dateString into a Date object
    const date = new Date(dateString);

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return "N/A";
    }

    // Format the date
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (searches == null) {
    return <div>Loading searches...</div>;
  }

  if (searches.length == 0) {
    return <div>No searches yet</div>;
  }

  return (
    <div className="flex flex-row flex-wrap overflow-x-auto gap-4 p-5 justify-center">
      {searches.map((search, index) => (
        <div key={index}>
          <Card key={index} className="w-96 h-96">
            <CardHeader>
              <CardTitle>{"Search " + (index + 1)}</CardTitle>
              {/* <CardDescription>Card Description</CardDescription> */}
            </CardHeader>
            <CardContent className="break-words">
              <ul className="px-3">
                <li>
                  <strong>Query:</strong> {search.query}
                </li>
                <li>
                  <strong>Filters:</strong>{" "}
                  {search.prefixFilters ? search.prefixFilters : "N/A"}
                </li>
                <li>
                  <strong>Search Period:</strong> {formatDate(search.minDate)} -{" "}
                  {formatDate(search.maxDate)}
                </li>
                <li>
                  <strong>Search Date:</strong> {formatDate(search.createdAt)}
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Link href={`/results/${search.id}`}>
                <Button className="w-full">Mark all as read</Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      ))}
    </div>
  );
};

export default dashboardPage;
