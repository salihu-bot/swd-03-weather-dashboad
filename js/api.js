const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

export async function fetchJson(url) {
  let response;
  try {
    response = await fetch(url);
  } catch (error) {
    const reason = error instanceof Error ? `: ${error.message}` : "";
    throw new Error(`Could not reach the weather service${reason}`);
  }

  if (!response.ok) {
    throw new Error(
      `The weather service returned ${response.status} ${response.statusText}.`,
    );
  }

  try {
    return await response.json();
  } catch {
    throw new Error("The weather service returned an invalid response.");
  }
}

export async function searchCity(name) {
  const cityName = String(name ?? "").trim();
  if (!cityName) {
    throw new Error("Enter a city name to see its forecast.");
  }

  const url = `${GEOCODING_URL}?name=${encodeURIComponent(cityName)}&count=5`;
  try {
    const data = await fetchJson(url);
    return (data.results ?? []).map((city) => ({
      name: city.name,
      country: city.country,
      latitude: city.latitude,
      longitude: city.longitude,
      timezone: city.timezone,
    }));
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error("City search failed for an unknown reason.");
  }
}

export async function getForecast(latitude, longitude) {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m",
    daily: "weather_code,temperature_2m_max,temperature_2m_min",
    timezone: "auto",
  });

  return fetchJson(`${FORECAST_URL}?${params}`);
}
