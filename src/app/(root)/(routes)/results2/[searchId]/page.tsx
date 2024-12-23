import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import prismadb from "../../../../lib/prismadb";
import ChatComponentsWrapper from "../components/2-chat-components-wrapper";
import { SearchResult } from "../../../../../types";

type Props = {
  params: {
    searchId: string;
  };
};

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
    }) as Promise<SearchResult[]>,
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
