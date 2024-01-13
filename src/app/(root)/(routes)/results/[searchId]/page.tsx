import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import prismadb from "../../../../lib/prismadb";
import ChatComponentsWrapper from "../components/chat-components-wrapper";

type Props = {
  params: {
    searchId: string;
  };
};

interface SearchResult {
  id: string;
  caseName: string;
  caseNeutralCit: string;
  caseActionNo: string;
  caseDate: Date; // or string, if you are using ISO date strings
  caseUrl: string;
  createdAt: Date; // or string, for ISO date strings
  searchId: string;
  userId: string;
}

interface SearchResultsArray extends Array<SearchResult> {}

const ResultsPage = async ({ params: { searchId } }: Props) => {
  const { userId } = await auth();

  if (!userId) {
    return redirect("/sign-in");
  }

  const search_metadata = await prismadb.search.findMany({
    where: {
      id: searchId,
    },
  });

  const searchResults = await prismadb.searchResult.findMany({
    where: {
      searchId: searchId,
    },
  });

  return (
    <ChatComponentsWrapper
      searchResults={searchResults}
      searchMetadataQuery={search_metadata[0].query}
    />
  );
};

export default ResultsPage;
