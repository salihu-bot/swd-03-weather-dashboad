const cityData = {
  seattle: {
    name: "Seattle",
    country: "United States",
    timezone: "America/Los_Angeles",
    temperature: 18,
    feelsLike: 17,
    condition: "Partly cloudy",
    icon: "🌤️",
    wind: 12,
    humidity: 64,
    forecast: [
      { icon: "🌤️", high: 19, low: 12 },
      { icon: "🌦️", high: 17, low: 11, rain: "30%" },
      { icon: "🌧️", high: 15, low: 10, rain: "60%" },
      { icon: "☁️", high: 16, low: 9 },
      { icon: "🌤️", high: 20, low: 12 },
      { icon: "☀️", high: 22, low: 13 },
      { icon: "🌤️", high: 21, low: 12 },
    ],
  },
  london: {
    name: "London",
    country: "United Kingdom",
    timezone: "Europe/London",
    temperature: 16,
    feelsLike: 15,
    condition: "Light showers",
    icon: "🌦️",
    wind: 18,
    humidity: 72,
    forecast: [
      { icon: "🌦️", high: 17, low: 11, rain: "35%" },
      { icon: "🌧️", high: 15, low: 10, rain: "65%" },
      { icon: "☁️", high: 16, low: 9 },
      { icon: "🌤️", high: 18, low: 11 },
      { icon: "☀️", high: 20, low: 12 },
      { icon: "🌤️", high: 19, low: 12 },
      { icon: "☁️", high: 17, low: 10 },
    ],
  },
  tokyo: {
    name: "Tokyo",
    country: "Japan",
    timezone: "Asia/Tokyo",
    temperature: 24,
    feelsLike: 25,
    condition: "Mostly sunny",
    icon: "☀️",
    wind: 9,
    humidity: 58,
    forecast: [
      { icon: "☀️", high: 25, low: 17 },
      { icon: "🌤️", high: 24, low: 18 },
      { icon: "🌦️", high: 21, low: 16, rain: "40%" },
      { icon: "🌧️", high: 19, low: 15, rain: "70%" },
      { icon: "🌤️", high: 22, low: 16 },
      { icon: "☀️", high: 26, low: 18 },
      { icon: "☀️", high: 27, low: 19 },
    ],
  },
  "new york": {
    name: "New York",
    country: "United States",
    timezone: "America/New_York",
    temperature: 21,
    feelsLike: 20,
    condition: "Clear skies",
    icon: "☀️",
    wind: 14,
    humidity: 51,
    forecast: [
      { icon: "☀️", high: 23, low: 16 },
      { icon: "🌤️", high: 22, low: 15 },
      { icon: "☁️", high: 20, low: 14 },
      { icon: "🌦️", high: 18, low: 13, rain: "35%" },
      { icon: "🌤️", high: 21, low: 14 },
      { icon: "☀️", high: 24, low: 16 },
      { icon: "☀️", high: 25, low: 17 },
    ],
  },
  paris: {
    name: "Paris",
    country: "France",
    timezone: "Europe/Paris",
    temperature: 19,
    feelsLike: 19,
    condition: "Partly cloudy",
    icon: "🌤️",
    wind: 11,
    humidity: 60,
    forecast: [
      { icon: "🌤️", high: 20, low: 13 },
      { icon: "☀️", high: 22, low: 14 },
      { icon: "🌤️", high: 21, low: 14 },
      { icon: "🌦️", high: 18, low: 12, rain: "30%" },
      { icon: "☁️", high: 17, low: 11 },
      { icon: "🌤️", high: 20, low: 13 },
      { icon: "☀️", high: 23, low: 15 },
    ],
  },
  sydney: {
    name: "Sydney",
    country: "Australia",
    timezone: "Australia/Sydney",
    temperature: 22,
    feelsLike: 22,
    condition: "Sunny",
    icon: "☀️",
    wind: 16,
    humidity: 55,
    forecast: [
      { icon: "☀️", high: 24, low: 17 },
      { icon: "🌤️", high: 23, low: 16 },
      { icon: "☁️", high: 21, low: 15 },
      { icon: "🌦️", high: 19, low: 14, rain: "40%" },
      { icon: "🌤️", high: 21, low: 15 },
      { icon: "☀️", high: 24, low: 17 },
      { icon: "🌤️", high: 23, low: 16 },
    ],
  },
};

const defaultCity = "seattle";

function cloneWeather(weather) {
  return {
    ...weather,
    forecast: weather.forecast.map((day) => ({ ...day })),
  };
}

export async function getWeather(cityName) {
  const query = String(cityName ?? "").trim().toLocaleLowerCase();
  if (!query) {
    throw new Error("Enter a city name to see its forecast.");
  }

  await Promise.resolve();
  const weather = cityData[query];
  if (!weather) {
    throw new Error(`We couldn't find “${String(cityName).trim()}”. Try Seattle, London, Tokyo, New York, Paris, or Sydney.`);
  }

  return cloneWeather(weather);
}

export async function getDefaultWeather() {
  return getWeather(defaultCity);
}

export async function getFavoriteWeather() {
  const favoriteCities = ["London", "Tokyo", "New York"];
  return Promise.all(favoriteCities.map((city) => getWeather(city)));
}
