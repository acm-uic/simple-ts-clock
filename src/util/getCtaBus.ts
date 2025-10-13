import dotenv from "dotenv";

dotenv.config();

async function getCtaBus(busStop: string) {
  const url =
    "http://ctabustracker.com/bustime/api/v2/getpredictions?key=" +
    process.env.CTA_BUS_API_KEY +
    "&stpid=" +
    busStop +
    "&format=json";
  const res = await fetch(url);
  return await res.json();
}

export default getCtaBus;
