import type { Request, Response } from "express";
import { qrCodeUrls } from "../qrCodeUrls";
import { CALENDARS } from "../util/getEvents";

interface ExplictAnyIndex {
  [key: string]: any; // Add index signature
}

export const defaultConfig: ExplictAnyIndex = {
  ctaBusStops: ["6700", "6627", "307", "332", "4640", "14487", "6347", "206"],
  ctaTrainStations: ["40350"],
  weatherLatLong: "41.8658728,-87.6482463",
  eventCalendars: Object.keys(CALENDARS), // ACM and LUG; edit CALENDARS in src/util/getEvents.ts
};

export const index = (req: Request, res: Response): void => {
  if (req.query.config !== "") {
    res.redirect(
      "/config/?" +
        Object.keys(defaultConfig)
          .map((k): string => {
            return `${encodeURIComponent(k)}=${encodeURIComponent(defaultConfig[k])}`;
          })
          .join("&"),
    );
  }
};

export const config = (req: Request, res: Response): void => {
  res.locals.qrCodeUrls = qrCodeUrls;
  res.render("home", {
    title: "Home",
  });
};

export const offline = config;

export const demo = config;
