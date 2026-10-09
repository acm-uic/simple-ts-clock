export interface Arrival {
  mode: "bus" | "train";
  route: string; // "Blue", "8", ...
  direction: string; // "Westbound", "Forest Park-bound", ...
  destination: string;
  minutes: number | "due";
  delayed: boolean; // train isDly / bus dly
  scheduledOnly: boolean; // train isSch
  fault: boolean; // train isFlt
  canceled: boolean; // bus dyn = 1, 16, 17 or 18: canceled or invalidated, so hide it
  expressed: boolean; // bus dyn = 4: drop-off only, can't board
  crowding?: "EMPTY" | "HALF_EMPTY" | "FULL";
  stopName: string;
}

export interface ArrivalGroup {
  mode: "bus" | "train";
  route: string;
  direction: string;
  arrivals: Arrival[]; // at most PER_GROUP, soonest first
}
export interface CtaBusPrediction {
  tmstmp: string;
  typ: string;
  stpnm: string;
  stpid: string;
  vid: string;
  dstp: number;
  rt: string;
  rtdd: string;
  rtdir: string;
  des: string;
  prdtm: string;
  tablockid: string;
  tatripid: string;
  dly?: boolean; // v3: always present; v2: only present when delayed
  prdctdn: string;
  zone: string;
  dyn?: number;
  psgld?: string;
}

export interface CtaBusError {
  stpid: string;
  msg: string;
}

export interface CtaBusPredictions {
  "bustime-response": {
    prd?: CtaBusPrediction[];
    error?: CtaBusError[];
  };
}

export interface CtaTrainPrediction {
  staId: string;
  stpId: string;
  staNm: string;
  stpDe: string;
  rn: string;
  rt: string;
  destSt: string;
  destNm: string;
  trDr: string;
  prdt: string;
  arrT: string;
  isApp: string;
  isSch: string;
  isDly: string;
  isFlt: string;
  flags: boolean;
  lat: string;
  lon: string;
  heading: string;
}

export interface CtaTrainPredictions {
  ctatt: {
    tmst: string;
    errCd: string;
    errNm: string | null;
    eta?: CtaTrainPrediction[];
  };
}
