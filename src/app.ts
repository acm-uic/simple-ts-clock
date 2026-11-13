import path from "node:path";
import compression from "compression";
import express from "express";
import { qrCodeUrls } from "./qrCodeUrls";
import getEvents from "./util/getEvents";
import { getFlyerImage, listFlyers } from "./util/getFlyers";
import getMessages from "./util/getMessages";
import { getTransit } from "./util/getTransit";
import getWeather from "./util/getWeather";

const app = express();

app.set("views", path.join(__dirname, "../views"));
app.set("view engine", "pug");
app.use(compression());
// Relative to this file, not the working directory: systemd starts the server from "/"
app.use(express.static(path.join(__dirname, "../dist/public"), { maxAge: 0 }));

// One page for every mode; the page's script reads the mode from the address
app.get(["/", "/offline", "/demo"], (_req, res) => res.render("home", { title: "Home", qrCodeUrls }));
// The clock's old address: a page still open there finds its way back on its next reload
app.get("/config", (_req, res) => res.redirect("/"));

// A data route: sends what `load` returns, or a 502 if it fails.
// Every loader keeps its own short-lived copy (see util/cached.ts), so the routes don't cache.
function api(name: string, load: () => Promise<unknown>): void {
  app.get(`/api/${name}`, async (_req, res) => {
    try {
      res.json(await load());
    } catch (err) {
      console.error(`/api/${name} failed:`, err);
      res.status(502).json({ error: `${name} unavailable` });
    }
  });
}

api("transit", getTransit);
api("weather", getWeather);
api("events", getEvents);
api("flyers", listFlyers);
api("messages", getMessages);

// One flyer image, fetched through the server so the API key stays here
app.get("/api/flyers/:id", async (req, res) => {
  try {
    const image = await getFlyerImage(req.params.id);
    if (!image) return void res.status(404).json({ error: "No such flyer" });
    res.set({ "Content-Type": image.mimeType, "Cache-Control": "public, max-age=3600" }).send(image.bytes);
  } catch (err) {
    console.error("Flyer image failed:", err);
    res.status(502).json({ error: "Flyer unavailable" });
  }
});

export default app;
