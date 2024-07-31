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

// interface SearchResultsArray extends Array<SearchResult> {}

const ResultsPage = async ({ params: { searchId } }: Props) => {
  const { userId } = await auth();

  if (!userId) {
    return redirect("/sign-in");
  }

  const [search_metadata, searchResults, userSettings] = await Promise.all([
    prismadb.search.findUnique({
      where: {
        id: searchId,
      },
    }),
    prismadb.searchResult.findMany({
      where: {
        searchId: searchId,
      },
    }),
    prismadb.settings.findUnique({
      where: { userId },
    }),
  ]);

  if (!search_metadata) {
    return <div>Cannot find this search in db.</div>;
  }

  const outputLanguage = userSettings?.outputLanguage || "English";

  return (
    <ChatComponentsWrapper
      searchResults={searchResults}
      searchMetadataQuery={search_metadata.query}
      searchId={searchId}
      searchCountryOption={search_metadata.countryOption}
      outputLanguage={outputLanguage}
    />
  );
};

export default ResultsPage;
