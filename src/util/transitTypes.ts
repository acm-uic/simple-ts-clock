export interface Arrival {
  mode: "bus" | "train";
  route: string; // "Blue", "8", ...
  direction: string; // "Westbound", "Forest Park-bound", ...
  destination: string;
  minutes: number | "due";
  delayed: boolean; // train isDly / bus dly
  scheduledOnly: boolean; // train isSch
  fault: boolean; // train isFlt
  canceled: boolean; // bus dyn = 1 (canceled)
  expressed: boolean; // bus dyn = 4 (drop off only)
  crowding?: "EMPTY" | "HALF_EMPTY" | "FULL";
  stopName: string;
}
