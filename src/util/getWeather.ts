import dotenv from 'dotenv';
import fetch from 'node-fetch';
dotenv.config();

let lastTime: number | null;
let lastResponse: {};

// 15 minutes in millis
const rateLimit: number = 15 * 60 * 1000;

async function getWeather(weatherLatLong: string): Promise<{}> {
  const now: number = Date.now();

  let answer: {};
  if (lastTime == null || now - lastTime >= rateLimit) {
    lastTime = now;

    const url = `https://api.pirateweather.net/forecast/${process.env.DARK_SKY_API_KEY}/${weatherLatLong}?exclude=minutely,hourly,daily,alerts,flags&units=si`;

    let res = await fetch(url);
    let data = await res.json();

    lastResponse = data;

    answer = data;
  } else {
    // Return cached answer
    answer = lastResponse;
  }

  return answer;
}

export default getWeather;
