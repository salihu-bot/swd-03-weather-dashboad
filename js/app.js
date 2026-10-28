import { getForecast, searchCity } from "./api.js";
import {
  hideCityChoices,
  renderCityChoices,
  renderCurrentWeather,
  renderFavorites,
  renderForecast,
  renderUnitToggle,
  setStatus,
  setWeatherLoading,
  updateDashboardDate,
} from "./ui.js";
import { getWeatherCode } from "./weatherCodes.js";

const UNIT_STORAGE_KEY = "weatherly-temperature-unit";
const FAVORITES_STORAGE_KEY = "weatherly-favorites";
const LAST_CITY_STORAGE_KEY = "weatherly-last-city";
let currentWeather;
let favorites = [];
let activeController;
let storageWarning = "";

function readStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    storageWarning = "This browser could not access saved dashboard preferences.";
    return null;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    storageWarning = "Changes are active for this visit, but this browser could not save them.";
    return false;
  }
}

function readUnitPreference() {
  return readStorage(UNIT_STORAGE_KEY) === "F" ? "F" : "C";
}

function readFavorites() {
  const saved = readStorage(FAVORITES_STORAGE_KEY);
  if (!saved) return [];

  try {
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) throw new Error("Saved favourites must be an array.");
    return parsed.filter(
      (city) =>
        city &&
        typeof city.name === "string" &&
        typeof city.country === "string" &&
        Number.isFinite(city.latitude) &&
        Number.isFinite(city.longitude),
    ).map(({ name, country, latitude, longitude }) => ({
      name,
      country,
      latitude,
      longitude,
    }));
  } catch {
    storageWarning = "Saved favourites could not be read. You can add them again.";
    return [];
  }
}

function readLastCity() {
  const saved = readStorage(LAST_CITY_STORAGE_KEY);
  if (!saved) return null;

  try {
    const city = JSON.parse(saved);
    if (
      city &&
      typeof city.name === "string" &&
      typeof city.country === "string" &&
      Number.isFinite(city.latitude) &&
      Number.isFinite(city.longitude)
    ) {
      return city;
    }
    throw new Error("Saved city is invalid.");
  } catch {
    storageWarning = "Your last viewed city could not be restored.";
    return null;
  }
}

let unit = readUnitPreference();
favorites = readFavorites();

function persistFavorites() {
  const savedFavorites = favorites.map(({ name, country, latitude, longitude }) => ({
    name,
    country,
    latitude,
    longitude,
  }));
  writeStorage(FAVORITES_STORAGE_KEY, JSON.stringify(savedFavorites));
}

function updateFavoriteList() {
  renderFavorites(
    favorites,
    currentWeather,
    unit,
    (city) => loadSelectedCity(city),
    (city) => {
      favorites = favorites.filter(
        (favorite) =>
          favorite.latitude !== city.latitude ||
          favorite.longitude !== city.longitude,
      );
      persistFavorites();
      updateFavoriteList();
      if (storageWarning) setStatus(storageWarning, "error");
    },
  );
}

function saveLastCity(city) {
  const lastCity = {
    name: city.name,
    country: city.country,
    region: city.region ?? "",
    latitude: city.latitude,
    longitude: city.longitude,
    timezone: city.timezone ?? "auto",
  };
  writeStorage(LAST_CITY_STORAGE_KEY, JSON.stringify(lastCity));
}

function showWeather(weather) {
  currentWeather = weather;
  saveLastCity(weather);
  renderCurrentWeather(weather, unit);
  renderForecast(weather.forecast, unit);
  updateFavoriteList();
}

function makeWeather(city, response) {
  const conditions = getWeatherCode(response.current.weather_code);
  return {
    ...city,
    timezone: city.timezone && city.timezone !== "auto"
      ? city.timezone
      : response.timezone || "UTC",
    temperature: response.current.temperature_2m,
    condition: conditions.label,
    icon: conditions.emoji,
    wind: response.current.wind_speed_10m,
    humidity: response.current.relative_humidity_2m,
    forecast: response.daily.time.map((date, index) => {
      const dailyConditions = getWeatherCode(response.daily.weather_code[index]);
      return {
        date,
        icon: dailyConditions.emoji,
        high: response.daily.temperature_2m_max[index],
        low: response.daily.temperature_2m_min[index],
      };
    }),
  };
}

function startRequest() {
  activeController?.abort();
  const controller = new AbortController();
  activeController = controller;
  hideCityChoices();
  setStatus("");
  setWeatherLoading(true);
  return controller;
}

function reportRequestError(error, controller) {
  if (controller.signal.aborted) return;
  setStatus(
    error instanceof Error
      ? error.message
      : "Something went wrong while loading the forecast.",
    "error",
  );
}

function finishRequest(controller) {
  if (activeController === controller) {
    activeController = undefined;
    setWeatherLoading(false);
    if (storageWarning) setStatus(storageWarning, "error");
  }
}

async function loadSelectedCity(city) {
  const controller = startRequest();
  try {
    const response = await getForecast(city.latitude, city.longitude, {
      signal: controller.signal,
    });
    if (controller.signal.aborted) return;

    const weather = makeWeather(city, response);
    showWeather(weather);
    setStatus(`Showing the forecast for ${weather.name}.`);
    return true;
  } catch (error) {
    reportRequestError(error, controller);
    return false;
  } finally {
    finishRequest(controller);
  }
}

async function loadWeather(cityName) {
  const controller = startRequest();
  try {
    const cities = await searchCity(cityName, { signal: controller.signal });
    if (controller.signal.aborted) return;

    if (cities.length === 0) {
      setWeatherLoading(false);
      setStatus(
        `We couldn't find “${cityName.trim()}”. Check the spelling or try another city.`,
      );
      return false;
    }

    if (cities.length > 1) {
      setWeatherLoading(false);
      renderCityChoices(cities, (city) => loadSelectedCity(city));
      setStatus("Choose a city from the list to see its forecast.");
      return false;
    }

    const response = await getForecast(cities[0].latitude, cities[0].longitude, {
      signal: controller.signal,
    });
    if (controller.signal.aborted) return;

    const weather = makeWeather(cities[0], response);
    showWeather(weather);
    setStatus(`Showing the forecast for ${weather.name}.`);
    return true;
  } catch (error) {
    reportRequestError(error, controller);
    return false;
  } finally {
    finishRequest(controller);
  }
}

function getCurrentPosition(signal) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Location services are not available in this browser."));
      return;
    }

    let settled = false;
    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      signal.removeEventListener("abort", onAbort);
      callback(value);
    };
    const onAbort = () => finish(reject, new DOMException("Location request cancelled.", "AbortError"));
    const timeoutId = setTimeout(() => finish(reject, { code: 3 }), 12000);

    if (signal.aborted) {
      onAbort();
      return;
    }

    signal.addEventListener("abort", onAbort, { once: true });
    try {
      navigator.geolocation.getCurrentPosition(
        (position) => finish(resolve, position),
        (error) => finish(reject, error),
        {
          enableHighAccuracy: false,
          maximumAge: 300000,
          timeout: 10000,
        },
      );
    } catch (error) {
      finish(reject, error);
    }
  });
}

function locationErrorMessage(error) {
  if (error instanceof Error && error.message === "Location services are not available in this browser.") {
    return error.message;
  }
  switch (error?.code) {
    case 1:
      return "Location permission was denied. Allow location access in your browser settings, or search for a city.";
    case 2:
      return "Your location could not be determined. Check your device location settings and try again.";
    case 3:
      return "Finding your location timed out. Please try again or search for a city.";
    default:
      return "Your location could not be accessed. Please try again or search for a city.";
  }
}

async function loadMyLocation({ initial = false } = {}) {
  const controller = startRequest();
  let position;
  try {
    position = await getCurrentPosition(controller.signal);
  } catch (error) {
    if (controller.signal.aborted) return;
    const message = locationErrorMessage(error);

    if (initial) {
      const fallbackLoaded = await loadSelectedCity({
        name: "Seattle",
        country: "United States",
        region: "Washington",
        latitude: 47.60621,
        longitude: -122.33207,
        timezone: "America/Los_Angeles",
      });
      if (fallbackLoaded) setStatus(`${message} Showing Seattle instead.`);
    } else {
      setStatus(message, "error");
    }
    finishRequest(controller);
    return;
  }

  if (controller.signal.aborted) return;

  const city = {
    name: "My location",
    country: "",
    region: "",
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    timezone: "auto",
  };
  try {
    const response = await getForecast(city.latitude, city.longitude, {
      signal: controller.signal,
    });
    if (controller.signal.aborted) return;

    showWeather(makeWeather(city, response));
    setStatus("Showing the forecast for your location.");
  } catch (error) {
    reportRequestError(error, controller);
  } finally {
    finishRequest(controller);
  }
}

document.querySelector("#search-form").addEventListener("submit", (event) => {
  event.preventDefault();
  loadWeather(document.querySelector("#city-search").value);
});

document.querySelector("#favorite-toggle").addEventListener("click", () => {
  if (!currentWeather) return;

  const isFavorite = favorites.some(
    (favorite) =>
      favorite.latitude === currentWeather.latitude &&
      favorite.longitude === currentWeather.longitude,
  );

  if (isFavorite) {
    favorites = favorites.filter(
      (favorite) =>
        favorite.latitude !== currentWeather.latitude ||
        favorite.longitude !== currentWeather.longitude,
    );
  } else {
    favorites = [
      ...favorites,
      {
        name: currentWeather.name,
        country: currentWeather.country,
        latitude: currentWeather.latitude,
        longitude: currentWeather.longitude,
      },
    ];
  }

  persistFavorites();
  updateFavoriteList();
  if (storageWarning) setStatus(storageWarning, "error");
});

document.querySelector("#location-button").addEventListener("click", () => {
  loadMyLocation();
});

document.querySelector("#unit-toggle").addEventListener("click", () => {
  unit = unit === "C" ? "F" : "C";
  writeStorage(UNIT_STORAGE_KEY, unit);
  renderUnitToggle(unit);
  if (currentWeather) showWeather(currentWeather);
  if (storageWarning) setStatus(storageWarning, "error");
});

function initialize() {
  updateDashboardDate();
  renderUnitToggle(unit);
  updateFavoriteList();

  const lastCity = readLastCity();
  if (lastCity) {
    loadSelectedCity(lastCity);
  } else {
    loadMyLocation({ initial: true });
  }
}

initialize();
