import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import prismadb from "../../../../lib/prismadb";
import ChatComponent from "../components/chat-component";

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

const resultsPage = async ({ params: { searchId } }: Props) => {
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
    <div className="flex overflow-x-auto h-full">
      {searchResults.map((result) => (
        <div key={result.id} className="flex-none w-1/3 border-r h-full">
          <ChatComponent
            key={result.id}
            data={result}
            query={search_metadata[0].query}
          />
        </div>
      ))}
    </div>
  );
};

export default resultsPage;