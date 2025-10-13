import dotenv from "dotenv";

dotenv.config();

async function getCtaTrain(trainStation: string) {
  const url =
    "https://lapi.transitchicago.com/api/1.0/ttarrivals.aspx?key=" +
    process.env.CTA_TRAIN_API_KEY +
    "&mapid=" +
    trainStation +
    "&max=10&outputType=JSON";
  const res = await fetch(url);
  return await res.json();
}

export default getCtaTrain;
