export interface CourtTypes {
  court_of_final_appeal: string[];
  court_of_appeal: string[];
  court_of_first_instance_civil: string[];
  court_of_first_instance_criminal: string[];
  court_of_first_instance_probate: string[];
  competition_tribunal: string[];
  district_court: string[];
  family_court: string[];
  lands_tribunal: string[];
  court_others: string[];
}

export const court_of_final_appeal = ["FACV", "FACC", "FAMV", "FAMC", "FAMP"]; 
export const court_of_appeal = [
  "CACV",
  "CACC",
  "CAAR",
  "CASJ",
  "CAQL",
  "CAAG",
  "CAMP",
];
export const court_of_first_instance_civil = [
  "HCA",
  "HCAL",
  "HCAJ",
  "HCAD",
  "HCB",
  "HCCL",
  "HCCW",
  "HCSD",
  "HCBI",
  "HCCT",
  "HCMC",
  "HCMP",
  "HCCM",
  "HCPI",
  "HCBD",
  "HCBS",
  "HCSN",
  "HCCD",
  "HCZZ",
  "HCMH",
  "HCIP",
];
export const court_of_first_instance_criminal = [
  "HCCC",
  "HCMA",
  "HCLA",
  "HCIA",
  "HCSA",
  "HCME",
  "HCOA",
  "HCUA",
  "HCED",
  "HCAA",
  "HCCP",
];
export const court_of_first_instance_probate = [
  "HCAP",
  "HCAG",
  "HCCA",
  "HCEA",
  "HCRC",
  "HCCI",
  "HCCV",
  "HCUA",
];
export const competition_tribunal = ["CTAR", "CTEA", "CTA", "CTMP"];
export const district_court = [
  "DCCJ",
  "DCCC",
  "DCDT",
  "DCTC",
  "DCEC",
  "DCEO",
  "DCMA",
  "DCMP",
  "DCOA",
  "DCPI",
  "DCPA",
  "DCSA",
  "DCZZ",
  "DCSN",
];
export const family_court = ["FCMC", "FCJA", "FCMP", "FCAD", "FCRE"];
export const lands_tribunal = [
  "LDPA",
  "LDPB",
  "LDPD",
  "LDPE",
  "LDRT",
  "LDNT",
  "LDLA",
  "LDRA",
  "LDBG",
  "LDGA",
  "LDLR",
  "LDHA",
  "LDBM",
  "LDDB",
  "LDDA",
  "LDMT",
  "LDCS",
  "LDRW",
  "LDMR",
  "LDMP",
];
export const court_others = [
  "CCDI",
  "ESCC",
  "ESS",
  "FLCC",
  "FLS",
  "KCCC",
  "KCS",
  "KTCC",
  "KTS",
  "LBTC",
  "OATD",
  "STCC",
  "STMP",
  "STS",
  "SCTC",
  "TMCC",
  "TMS",
  "WKCC",
  "WKS",
];


export default {
    court_of_final_appeal,
    court_of_appeal,
    court_of_first_instance_civil,
    court_of_first_instance_criminal,
    court_of_first_instance_probate,
    competition_tribunal,
    district_court,
    family_court,
    lands_tribunal,
    court_others,
  };