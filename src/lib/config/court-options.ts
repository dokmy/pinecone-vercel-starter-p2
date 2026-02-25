import courtTypes from "@/lib/constants";

export const HK_COURT_OPTIONS = [
  {
    id: "courtOfFinalAppeal",
    label: "Court of Final Appeal",
    options: courtTypes.court_of_final_appeal,
  },
  {
    id: "courtOfAppeal",
    label: "Court of Appeal",
    options: courtTypes.court_of_appeal,
  },
  {
    id: "courtOfFirstInstanceCivil",
    label: "Court of First Instance - Civil",
    options: courtTypes.court_of_first_instance_civil,
  },
  {
    id: "courtOfFirstInstanceCriminal",
    label: "Court of First Instance - Criminal",
    options: courtTypes.court_of_first_instance_criminal,
  },
  {
    id: "courtOfFirstInstanceProbate",
    label: "Court of First Instance - Probate",
    options: courtTypes.court_of_first_instance_probate,
  },
  {
    id: "competitionTribunal",
    label: "Competition Tribunal",
    options: courtTypes.competition_tribunal,
  },
  {
    id: "districtCourt",
    label: "District Court",
    options: courtTypes.district_court,
  },
  {
    id: "familyCourt",
    label: "Family Court",
    options: courtTypes.family_court,
  },
  {
    id: "landsTribunal",
    label: "Lands Tribunal",
    options: courtTypes.lands_tribunal,
  },
  {
    id: "courtOthers",
    label: "Other Courts",
    options: courtTypes.court_others,
  },
];

 