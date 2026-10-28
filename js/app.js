import { getForecast, searchCity } from "./api.js";
import {
  hideCityChoices,
  renderCityChoices,
  renderCurrentWeather,
  renderFavorites,
  renderForecast,
  renderUnitToggle,
  setStatus,
  updateDashboardDate,
} from "./ui.js";
import { getWeatherCode } from "./weatherCodes.js";

const UNIT_STORAGE_KEY = "weatherly-temperature-unit";
let currentWeather;
let favorites = [];
let activeController;
let storageWarning = "";

function readUnitPreference() {
  try {
    return localStorage.getItem(UNIT_STORAGE_KEY) === "F" ? "F" : "C";
  } catch {
    storageWarning = "Your temperature unit preference could not be read from this browser.";
    return "C";
  }
}

let unit = readUnitPreference();

function updateFavoriteList() {
  if (!currentWeather) return;

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
      updateFavoriteList();
    },
  );
}

function showWeather(weather) {
  currentWeather = weather;
  renderCurrentWeather(weather, unit);
  renderForecast(weather.forecast, unit);
  updateFavoriteList();
}

function makeWeather(city, response) {
  const conditions = getWeatherCode(response.current.weather_code);
  return {
    ...city,
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
  setStatus("Loading…");
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
  } catch (error) {
    reportRequestError(error, controller);
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
      setStatus(
        `We couldn't find “${cityName.trim()}”. Check the spelling or try another city.`,
      );
      return;
    }

    if (cities.length > 1) {
      renderCityChoices(cities, (city) => loadSelectedCity(city));
      setStatus("Choose a city from the list to see its forecast.");
      return;
    }

    const response = await getForecast(cities[0].latitude, cities[0].longitude, {
      signal: controller.signal,
    });
    if (controller.signal.aborted) return;

    const weather = makeWeather(cities[0], response);
    showWeather(weather);
    setStatus(`Showing the forecast for ${weather.name}.`);
  } catch (error) {
    reportRequestError(error, controller);
  } finally {
    finishRequest(controller);
  }
}

document.querySelector("#search-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = document.querySelector("#city-search");
  loadWeather(input.value);
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
    favorites = [...favorites, currentWeather];
  }

  updateFavoriteList();
});

document.querySelector("#unit-toggle").addEventListener("click", () => {
  unit = unit === "C" ? "F" : "C";
  try {
    localStorage.setItem(UNIT_STORAGE_KEY, unit);
    storageWarning = "";
  } catch {
    storageWarning = "Temperature changed, but this browser could not save your preference.";
  }

  renderUnitToggle(unit);
  if (currentWeather) showWeather(currentWeather);
  if (storageWarning) setStatus(storageWarning, "error");
});

function initialize() {
  updateDashboardDate();
  renderUnitToggle(unit);
  loadWeather("Seattle");
}

initialize();
