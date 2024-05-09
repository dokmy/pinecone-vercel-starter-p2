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
  countryOption: string;
}

interface SearchResultsArray extends Array<SearchResult> {}

const ResultsPage = async ({ params: { searchId } }: Props) => {
  const { userId } = await auth();

  if (!userId) {
    return redirect("/sign-in");
  }

  const search_metadata = await prismadb.search.findUnique({
    where: {
      id: searchId,
    },
  });

  const searchResults = await prismadb.searchResult.findMany({
    where: {
      searchId: searchId,
    },
  });

  if (!search_metadata) {
    return <div>Cannot find this search in db.</div>;
  }

  return (
    <ChatComponentsWrapper
      searchResults={searchResults}
      searchMetadataQuery={search_metadata.query}
      searchId={searchId}
      searchCountryOption={search_metadata.countryOption}
    />
  );
};

export default ResultsPage;
