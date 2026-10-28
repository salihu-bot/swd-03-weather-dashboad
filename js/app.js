import {
  getDefaultWeather,
  getFavoriteWeather,
  getWeather,
} from "./api.js";
import {
  renderCurrentWeather,
  renderFavorites,
  renderForecast,
  setStatus,
  updateDashboardDate,
} from "./ui.js";

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
  setStatus(announce ? "Finding your forecast…" : "");

  try {
    const weather = await getWeather(cityName);
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

async function initialize() {
  updateDashboardDate();

  try {
    const [weather, favoriteWeather] = await Promise.all([
      getDefaultWeather(),
      getFavoriteWeather(),
    ]);
    favorites = favoriteWeather;
    showWeather(weather);
  } catch (error) {
    setStatus(
      error instanceof Error ? error.message : "Something went wrong while loading the dashboard.",
      "error",
    );
  }
}

initialize();
