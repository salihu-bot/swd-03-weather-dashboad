import { getForecast, searchCity } from "./api.js";
import {
  renderCurrentWeather,
  renderFavorites,
  renderForecast,
  setStatus,
  updateDashboardDate,
} from "./ui.js";
import { getWeatherCode } from "./weatherCodes.js";

let currentWeather;
let favorites = [];
let loading = false;

function updateFavoriteList() {
  renderFavorites(
    favorites,
    currentWeather.name,
    (city) => loadWeather(city),
    (city) => {
      favorites = favorites.filter(
        (favorite) => favorite.name.toLocaleLowerCase() !== city.toLocaleLowerCase(),
      );
      updateFavoriteList();
    },
  );
}

function showWeather(weather) {
  currentWeather = weather;
  renderCurrentWeather(weather);
  renderForecast(weather.forecast);
  updateFavoriteList();
}

async function loadWeather(cityName, { announce = false } = {}) {
  if (loading) return;
  loading = true;
  setStatus("Loading…");

  try {
    const cities = await searchCity(cityName);
    if (cities.length === 0) {
      setStatus(
        `We couldn't find “${cityName.trim()}”. Check the spelling or try another city.`,
      );
      return;
    }

    const city = cities[0];
    const forecast = await getForecast(city.latitude, city.longitude);
    const currentConditions = getWeatherCode(forecast.current.weather_code);
    const weather = {
      ...city,
      temperature: forecast.current.temperature_2m,
      condition: currentConditions.label,
      icon: currentConditions.emoji,
      wind: forecast.current.wind_speed_10m,
      humidity: forecast.current.relative_humidity_2m,
      forecast: forecast.daily.time.map((date, index) => {
        const conditions = getWeatherCode(forecast.daily.weather_code[index]);
        return {
          date,
          icon: conditions.emoji,
          high: forecast.daily.temperature_2m_max[index],
          low: forecast.daily.temperature_2m_min[index],
        };
      }),
    };

    showWeather(weather);
    setStatus(announce ? `Showing the forecast for ${weather.name}.` : "");
  } catch (error) {
    setStatus(
      error instanceof Error ? error.message : "Something went wrong while loading the forecast.",
      "error",
    );
  } finally {
    loading = false;
  }
}

document.querySelector("#search-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = document.querySelector("#city-search");
  loadWeather(input.value, { announce: true });
});

document.querySelector("#favorite-toggle").addEventListener("click", () => {
  if (!currentWeather) return;

  const currentName = currentWeather.name.toLocaleLowerCase();
  const isFavorite = favorites.some(
    (favorite) => favorite.name.toLocaleLowerCase() === currentName,
  );

  if (isFavorite) {
    favorites = favorites.filter(
      (favorite) => favorite.name.toLocaleLowerCase() !== currentName,
    );
  } else {
    favorites = [...favorites, currentWeather];
  }

  updateFavoriteList();
});

function initialize() {
  updateDashboardDate();
  loadWeather("Seattle");
}

initialize();
