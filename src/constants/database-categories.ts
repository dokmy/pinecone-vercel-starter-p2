interface Database {
  id: string;
  label: string;
  dbId: number;
}

interface DatabaseCategory {
  id: string;
  label: string;
  children: Database[];
}

export const DATABASE_CATEGORIES: DatabaseCategory[] = [
  {
    id: "english_case",
    label: "English Case Databases",
    children: [
      { id: "court_of_appeal", label: "Court of Appeal", dbId: 2 },
      { id: "court_of_final_appeal", label: "Court of Final Appeal", dbId: 4 },
      { id: "uk_privy_council", label: "United Kingdom Privy Council Judgments for Hong Kong", dbId: 5 },
      { id: "court_of_first_instance", label: "Court of First Instance", dbId: 7 },
      { id: "district_court", label: "District Court", dbId: 9 },
      { id: "family_court", label: "Family Court", dbId: 11 },
      { id: "competition_tribunal", label: "Competition Tribunal", dbId: 13 },
      { id: "lands_tribunal", label: "Lands Tribunal", dbId: 15 },
      { id: "coroners_court", label: "Coroner's Court", dbId: 17 },
      { id: "labour_tribunal", label: "Labour Tribunal", dbId: 19 },
      { id: "magistrates_courts", label: "Magistrates' Courts", dbId: 21 },
      { id: "small_claims_tribunal", label: "Small Claims Tribunal", dbId: 23 },
      { id: "obscene_articles_tribunal", label: "Obscene Articles Tribunal", dbId: 25 },
    ],
  },
  {
    id: "english_legislation",
    label: "English Legislation Databases",
    children: [
      { id: "hk_ordinances", label: "Hong Kong Ordinances", dbId: 27 },
      { id: "hk_regulations", label: "Hong Kong Regulations", dbId: 29 },
      { id: "hk_constitutional", label: "Hong Kong Constitutional Instruments", dbId: 31 },
      { id: "macao_arrangements", label: "Arrangements with the Macao SAR", dbId: 33 },
      { id: "mainland_arrangements", label: "Arrangements with the Mainland", dbId: 35 },
      { id: "hksar_agreements", label: "Bilateral Agreements Concluded by the HKSAR Government", dbId: 37 },
      { id: "prc_agreements", label: "Bilateral Agreements Concluded by the Central People's Government", dbId: 39 },
      { id: "treaties", label: "Treaties", dbId: 41 },
      { id: "historical_laws", label: "Historical Laws of Hong Kong", dbId: 51 },
    ],
  },
  {
    id: "english_other",
    label: "English Other Databases",
    children: [
      { id: "arbitration_centre", label: "Hong Kong International Arbitration Centre", dbId: 42 },
      { id: "lrc_consultation", label: "Law Reform Commission Consultation Papers", dbId: 44 },
      { id: "lrc_reports", label: "Law Reform Commission Reports", dbId: 46 },
      { id: "privacy_commissioner_appeal", label: "Office of the Privacy Commissioner for Personal Data Administrative Appeals Board Decisions", dbId: 48 },
      { id: "privacy_commissioner_notes", label: "Office of the Privacy Commissioner for Personal Data Complaint Case Notes", dbId: 50 },
      { id: "practice_directions", label: "Practice Directions", dbId: 53 },
    ],
  },
  {
    id: "chinese_case",
    label: "中文案例資料庫",
    children: [
      { id: "上訴法庭", label: "上訴法庭", dbId: 1 },
      { id: "終審法院", label: "終審法院", dbId: 3 },
      { id: "原訟法庭", label: "原訟法庭", dbId: 6 },
      { id: "區域法院", label: "區域法院", dbId: 8 },
      { id: "家事法庭", label: "家事法庭", dbId: 10 },
      { id: "競爭事務審裁處", label: "競爭事務審裁處", dbId: 12 },
      { id: "土地審裁處", label: "土地審裁處", dbId: 14 },
      { id: "死因裁判法庭", label: "死因裁判法庭", dbId: 16 },
      { id: "勞資審裁處", label: "勞資審裁處", dbId: 18 },
      { id: "裁判法院", label: "裁判法院", dbId: 20 },
      { id: "小額錢債審裁處", label: "小額錢債審裁處", dbId: 22 },
      { id: "淫褻物品審裁處", label: "淫褻物品審裁處", dbId: 24 },
    ],
  },
  {
    id: "chinese_legislation",
    label: "中文法例資料庫",
    children: [
      { id: "香港附屬法例", label: "香港附屬法例", dbId: 28 },
      { id: "香港憲法文件", label: "香港憲法文件", dbId: 30 },
      { id: "香港特別行政區與澳門特別行政區之間的安排", label: "香港特別行政區與澳門特別行政區之間的安排", dbId: 32 },
      { id: "香港特別行政區與內地之間的安排", label: "香港特別行政區與內地之間的安排", dbId: 34 },
      { id: "中央人民政府達成的雙邊協定", label: "中央人民政府達成的雙邊協定", dbId: 36 },
      { id: "香港特別行政區政府達成的雙邊協定", label: "香港特別行政區政府達成的雙邊協定", dbId: 38 },
      { id: "公約", label: "公約", dbId: 40 },
      { id: "香港條例", label: "香港條例", dbId: 59 },
    ],
  },
  {
    id: "chinese_other",
    label: "其他中文資料庫",
    children: [
      { id: "法律改革委員會諮詢文件", label: "法律改革委員會諮詢文件", dbId: 43 },
      { id: "法律改革委員會報告書", label: "法律改革委員會報告書", dbId: 45 },
      { id: "個人資料私隱專員公署行政上訴委員會裁決", label: "個人資料私隱專員公署行政上訴委員會裁決", dbId: 47 },
      { id: "個人資料私隱專員公署投訴個案簡述", label: "個人資料私隱專員公署投訴個案簡述", dbId: 49 },
      { id: "實務指示", label: "實務指示", dbId: 52 },
    ],
  },
]; 