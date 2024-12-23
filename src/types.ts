export type SearchResult = {
  id: string;
  caseName: string;
  caseNeutralCit: string;
  caseActionNo: string;
  caseDate: Date;
  caseUrl: string;
  createdAt: Date;
  searchId: string;
  userId: string;
  userEmail: string | null;
  userName: string | null;
  gptScore: number | null;
  vectorScore: number | null;
} 