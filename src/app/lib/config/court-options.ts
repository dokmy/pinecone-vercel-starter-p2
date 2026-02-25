import courtTypes from "@/lib/constants";

export const HK_COURT_OPTIONS = [
  {
    id: "cofa",
    label: "Court of Final Appeal",
    options: courtTypes.court_of_final_appeal,
  },
  {
    id: "coa",
    label: "Court of Appeal",
    options: courtTypes.court_of_appeal,
  },
  {
    id: "coficivil",
    label: "Court of First Instance - Civil",
    options: courtTypes.court_of_first_instance_civil,
  },
  {
    id: "coficriminal",
    label: "Court of First Instance - Criminal",
    options: courtTypes.court_of_first_instance_criminal,
  },
  {
    id: "cofiprobate",
    label: "Court of First Instance - Probate",
    options: courtTypes.court_of_first_instance_probate,
  },
  {
    id: "ct",
    label: "Competition Tribunal",
    options: courtTypes.competition_tribunal,
  },
  {
    id: "dc",
    label: "District Court",
    options: courtTypes.district_court,
  },
  {
    id: "fc",
    label: "Family Court",
    options: courtTypes.family_court,
  },
  {
    id: "lt",
    label: "Lands Tribunal",
    options: courtTypes.lands_tribunal,
  },
  {
    id: "others",
    label: "Other Courts",
    options: courtTypes.court_others,
  },
];

 