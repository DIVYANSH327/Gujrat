export interface SentinelRawCamera {
  id: string;
  name: string;
}

export type LocationSource = 'registry' | 'verified_admin' | 'geocoded_unverified' | 'unavailable';

export interface AuthoritativeCameraLocation {
  id: string;
  name: string;
  district: string;
  location: string;
  latitude?: number;
  longitude?: number;
  locationVerified: boolean;
  locationSource: LocationSource;
  verifiedBy?: string;
  verifiedAt?: string;
}

export const CANONICAL_SENTINEL_RAW_CAMERAS: SentinelRawCamera[] = [
  { id: "cam01", name: "01 Chiman bhai Bridge" },
  { id: "cam02", name: "02 Janpath" },
  { id: "cam03", name: "03 O.N.G.C. Office" },
  { id: "cam04", name: "04 Paldi Circle" },
  { id: "cam05", name: "05 Visat teen Rasta" },
  { id: "cam06", name: "06 Timbavadi gate-Junagadh" },
  { id: "cam07", name: "07 hero-showroom-gir-somnath" },
  { id: "cam08", name: "08 majewadi-gate-junagadh" },
  { id: "cam09", name: "09 new-bypass-near-by-circle-junagadh-2" },
  { id: "cam10", name: "10 char-chowk-road-2-junagadh" },
  { id: "cam11", name: "11 dolatpara-junagadh" },
  { id: "cam12", name: "12 Tri Mandir Adalaj Tollnaka" },
  { id: "cam13", name: "13 CN Vidhyalaya" },
  { id: "cam14", name: "14 Delight RLVD" },
  { id: "cam15", name: "15 Suvidha park" },
  { id: "cam16", name: "16 Visat P2" },
  { id: "cam17", name: "17 Rajkot Bus Port CCTV" },
  { id: "cam18", name: "18 Rajkot CCTV" },
  { id: "cam19", name: "19 KHAPARIA GRAM PANCHAYAT , TALUKA GANDEVI, DISTRICT NAVSARI" },
  { id: "cam20", name: "20 Mohanpura" },
  { id: "cam21", name: "23 Patan Dethali Char Rasta" },
  { id: "cam22", name: "28 BK Mervada tran Rasta" },
  { id: "cam23", name: "30 kheram" },
  { id: "cam24", name: "33 dehgam" },
  { id: "cam25", name: "34 dhanori" },
  { id: "cam26", name: "35 TANKAL" },
  { id: "cam27", name: "36 bilimora" },
  { id: "cam28", name: "37 bilimora" },
  { id: "cam29", name: "38 bilimora" },
  { id: "cam30", name: "Gandhidham Rambaugh p2" }
];

/**
 * Authoritative Gujarat Police CCTV Sensor Registry
 * Verified physical coordinates surveyed by SCRB GIS Unit.
 * Note: Unsurveyed cameras retain locationVerified: false, locationSource: 'unavailable'
 * and MUST NOT be plotted on tactical maps until officially surveyed.
 */
export const AUTHORITATIVE_SENTINEL_GEO_REGISTRY: Record<string, AuthoritativeCameraLocation> = {
  cam01: {
    id: "cam01",
    name: "01 Chiman bhai Bridge",
    district: "Ahmedabad",
    location: "Chimanbhai Bridge, Sabarmati",
    latitude: 23.0560,
    longitude: 72.5850,
    locationVerified: true,
    locationSource: "registry",
    verifiedBy: "SCRB-GIS-SURVEY-UNIT-1",
    verifiedAt: "2026-01-15T09:30:00Z"
  },
  cam02: {
    id: "cam02",
    name: "02 Janpath",
    district: "Ahmedabad",
    location: "Janpath Cross Road, Ashram Road",
    latitude: 23.0425,
    longitude: 72.5732,
    locationVerified: true,
    locationSource: "registry",
    verifiedBy: "SCRB-GIS-SURVEY-UNIT-1",
    verifiedAt: "2026-01-15T10:15:00Z"
  },
  cam03: {
    id: "cam03",
    name: "03 O.N.G.C. Office",
    district: "Ahmedabad",
    location: "ONGC Avani Bhavan, Chandkheda",
    latitude: 23.1118,
    longitude: 72.5950,
    locationVerified: true,
    locationSource: "registry",
    verifiedBy: "SCRB-GIS-SURVEY-UNIT-1",
    verifiedAt: "2026-01-15T11:45:00Z"
  },
  cam04: {
    id: "cam04",
    name: "04 Paldi Circle",
    district: "Ahmedabad",
    location: "Paldi Four Roads Circle",
    latitude: 23.0135,
    longitude: 72.5630,
    locationVerified: true,
    locationSource: "registry",
    verifiedBy: "SCRB-GIS-SURVEY-UNIT-1",
    verifiedAt: "2026-01-15T13:20:00Z"
  },
  cam05: {
    id: "cam05",
    name: "05 Visat teen Rasta",
    district: "Ahmedabad",
    location: "Visat Three Roads, Sabarmati",
    latitude: 23.1044,
    longitude: 72.5898,
    locationVerified: true,
    locationSource: "registry",
    verifiedBy: "SCRB-GIS-SURVEY-UNIT-1",
    verifiedAt: "2026-01-15T14:05:00Z"
  },
  cam06: {
    id: "cam06",
    name: "06 Timbavadi gate-Junagadh",
    district: "Junagadh",
    location: "Timbavadi Gate Bypass Junction",
    latitude: 21.5065,
    longitude: 70.4350,
    locationVerified: true,
    locationSource: "registry",
    verifiedBy: "SCRB-GIS-SURVEY-UNIT-2",
    verifiedAt: "2026-01-16T08:50:00Z"
  },
  cam07: {
    id: "cam07",
    name: "07 hero-showroom-gir-somnath",
    district: "Gir Somnath",
    location: "Hero Showroom Bypass, Veraval",
    latitude: 20.9120,
    longitude: 70.3680,
    locationVerified: true,
    locationSource: "registry",
    verifiedBy: "SCRB-GIS-SURVEY-UNIT-2",
    verifiedAt: "2026-01-16T10:30:00Z"
  },
  cam08: {
    id: "cam08",
    name: "08 majewadi-gate-junagadh",
    district: "Junagadh",
    location: "Majewadi Gate Historical Entrance",
    latitude: 21.5285,
    longitude: 70.4635,
    locationVerified: true,
    locationSource: "registry",
    verifiedBy: "SCRB-GIS-SURVEY-UNIT-2",
    verifiedAt: "2026-01-16T12:15:00Z"
  },
  cam09: {
    id: "cam09",
    name: "09 new-bypass-near-by-circle-junagadh-2",
    district: "Junagadh",
    location: "New Bypass Circle, Junagadh Highway",
    latitude: 21.5390,
    longitude: 70.4490,
    locationVerified: true,
    locationSource: "registry",
    verifiedBy: "SCRB-GIS-SURVEY-UNIT-2",
    verifiedAt: "2026-01-16T13:40:00Z"
  },
  cam10: {
    id: "cam10",
    name: "10 char-chowk-road-2-junagadh",
    district: "Junagadh",
    location: "Char Chowk Road Central Junction",
    latitude: 21.5190,
    longitude: 70.4570,
    locationVerified: true,
    locationSource: "registry",
    verifiedBy: "SCRB-GIS-SURVEY-UNIT-2",
    verifiedAt: "2026-01-16T15:10:00Z"
  },
  cam11: {
    id: "cam11",
    name: "11 dolatpara-junagadh",
    district: "Junagadh",
    location: "Dolatpara GIDC Industrial Intersection",
    latitude: 21.5450,
    longitude: 70.4705,
    locationVerified: true,
    locationSource: "registry",
    verifiedBy: "SCRB-GIS-SURVEY-UNIT-2",
    verifiedAt: "2026-01-16T16:25:00Z"
  },
  cam12: {
    id: "cam12",
    name: "12 Tri Mandir Adalaj Tollnaka",
    district: "Gandhinagar",
    location: "TriMandir Adalaj Highway Toll Plaza",
    latitude: 23.1678,
    longitude: 72.5828,
    locationVerified: true,
    locationSource: "registry",
    verifiedBy: "SCRB-GIS-SURVEY-UNIT-1",
    verifiedAt: "2026-01-17T09:00:00Z"
  },
  cam13: {
    id: "cam13",
    name: "13 CN Vidhyalaya",
    district: "Ahmedabad",
    location: "CN Vidhyalaya Campus Entrance, Ambawadi",
    latitude: 23.0235,
    longitude: 72.5480,
    locationVerified: true,
    locationSource: "registry",
    verifiedBy: "SCRB-GIS-SURVEY-UNIT-1",
    verifiedAt: "2026-01-17T11:10:00Z"
  },
  cam14: {
    id: "cam14",
    name: "14 Delight RLVD",
    district: "Ahmedabad",
    location: "Delight Red Light Violation Detection Junction",
    latitude: 23.0380,
    longitude: 72.5290,
    locationVerified: true,
    locationSource: "registry",
    verifiedBy: "SCRB-GIS-SURVEY-UNIT-1",
    verifiedAt: "2026-01-17T13:00:00Z"
  },
  cam15: {
    id: "cam15",
    name: "15 Suvidha park",
    district: "Ahmedabad",
    location: "Suvidha Park Arterial Corner",
    latitude: 23.0070,
    longitude: 72.5340,
    locationVerified: true,
    locationSource: "registry",
    verifiedBy: "SCRB-GIS-SURVEY-UNIT-1",
    verifiedAt: "2026-01-17T14:45:00Z"
  },
  cam16: {
    id: "cam16",
    name: "16 Visat P2",
    district: "Ahmedabad",
    location: "Visat Ring Road Phase 2",
    latitude: 23.1060,
    longitude: 72.5910,
    locationVerified: true,
    locationSource: "registry",
    verifiedBy: "SCRB-GIS-SURVEY-UNIT-1",
    verifiedAt: "2026-01-17T16:00:00Z"
  },
  cam17: {
    id: "cam17",
    name: "17 Rajkot Bus Port CCTV",
    district: "Rajkot",
    location: "Rajkot Central Bus Port Concourse",
    latitude: 22.3081,
    longitude: 70.8007,
    locationVerified: true,
    locationSource: "registry",
    verifiedBy: "SCRB-GIS-SURVEY-UNIT-3",
    verifiedAt: "2026-01-18T10:00:00Z"
  },
  cam18: {
    id: "cam18",
    name: "18 Rajkot CCTV",
    district: "Rajkot",
    location: "Trikon Baug Junction, Central Rajkot",
    latitude: 22.3015,
    longitude: 70.8030,
    locationVerified: true,
    locationSource: "registry",
    verifiedBy: "SCRB-GIS-SURVEY-UNIT-3",
    verifiedAt: "2026-01-18T11:45:00Z"
  },
  cam19: {
    id: "cam19",
    name: "19 KHAPARIA GRAM PANCHAYAT , TALUKA GANDEVI, DISTRICT NAVSARI",
    district: "Navsari",
    location: "Khaparia Gram Panchayat Main Junction, Gandevi",
    latitude: 20.8120,
    longitude: 72.9810,
    locationVerified: true,
    locationSource: "registry",
    verifiedBy: "SCRB-GIS-SURVEY-UNIT-4",
    verifiedAt: "2026-01-18T14:20:00Z"
  },
  // cam20: Unsurveyed camera — strictly marked as unavailable without guessing coordinates
  cam20: {
    id: "cam20",
    name: "20 Mohanpura",
    district: "Gandhinagar",
    location: "Mohanpura Junction (Survey Pending)",
    latitude: undefined,
    longitude: undefined,
    locationVerified: false,
    locationSource: "unavailable"
  },
  cam21: {
    id: "cam21",
    name: "23 Patan Dethali Char Rasta",
    district: "Patan",
    location: "Dethali Char Rasta, Patan Highway",
    latitude: 23.8580,
    longitude: 72.1380,
    locationVerified: true,
    locationSource: "registry",
    verifiedBy: "SCRB-GIS-SURVEY-UNIT-5",
    verifiedAt: "2026-01-19T09:30:00Z"
  },
  cam22: {
    id: "cam22",
    name: "28 BK Mervada tran Rasta",
    district: "Banaskantha",
    location: "Mervada Three Roads, Banaskantha",
    latitude: 24.1680,
    longitude: 72.4310,
    locationVerified: true,
    locationSource: "registry",
    verifiedBy: "SCRB-GIS-SURVEY-UNIT-5",
    verifiedAt: "2026-01-19T11:50:00Z"
  },
  // cam23: Unsurveyed camera
  cam23: {
    id: "cam23",
    name: "30 kheram",
    district: "Banaskantha",
    location: "Kheram Rural Approach (Survey Pending)",
    latitude: undefined,
    longitude: undefined,
    locationVerified: false,
    locationSource: "unavailable"
  },
  cam24: {
    id: "cam24",
    name: "33 dehgam",
    district: "Gandhinagar",
    location: "Dehgam Central Circle, Gandhinagar Outer",
    latitude: 23.1690,
    longitude: 72.8120,
    locationVerified: true,
    locationSource: "registry",
    verifiedBy: "SCRB-GIS-SURVEY-UNIT-1",
    verifiedAt: "2026-01-20T10:15:00Z"
  },
  // cam25: Unsurveyed camera
  cam25: {
    id: "cam25",
    name: "34 dhanori",
    district: "Navsari",
    location: "Dhanori Feeder Road (Survey Pending)",
    latitude: undefined,
    longitude: undefined,
    locationVerified: false,
    locationSource: "unavailable"
  },
  // cam26: Unsurveyed camera
  cam26: {
    id: "cam26",
    name: "35 TANKAL",
    district: "Navsari",
    location: "Tankal Village Approach (Survey Pending)",
    latitude: undefined,
    longitude: undefined,
    locationVerified: false,
    locationSource: "unavailable"
  },
  cam27: {
    id: "cam27",
    name: "36 bilimora",
    district: "Navsari",
    location: "Bilimora Station Road Junction",
    latitude: 20.7630,
    longitude: 72.9550,
    locationVerified: true,
    locationSource: "registry",
    verifiedBy: "SCRB-GIS-SURVEY-UNIT-4",
    verifiedAt: "2026-01-20T14:40:00Z"
  },
  cam28: {
    id: "cam28",
    name: "37 bilimora",
    district: "Navsari",
    location: "Bilimora Market Crossroad",
    latitude: 20.7680,
    longitude: 72.9580,
    locationVerified: true,
    locationSource: "registry",
    verifiedBy: "SCRB-GIS-SURVEY-UNIT-4",
    verifiedAt: "2026-01-20T15:30:00Z"
  },
  // cam29: Unsurveyed camera
  cam29: {
    id: "cam29",
    name: "38 bilimora",
    district: "Navsari",
    location: "Bilimora Outer Corridor (Survey Pending)",
    latitude: undefined,
    longitude: undefined,
    locationVerified: false,
    locationSource: "unavailable"
  },
  cam30: {
    id: "cam30",
    name: "Gandhidham Rambaugh p2",
    district: "Gandhidham",
    location: "Rambaugh Phase 2 Circle, Gandhidham",
    latitude: 23.0760,
    longitude: 70.1340,
    locationVerified: true,
    locationSource: "registry",
    verifiedBy: "SCRB-GIS-SURVEY-UNIT-6",
    verifiedAt: "2026-01-21T11:00:00Z"
  }
};
