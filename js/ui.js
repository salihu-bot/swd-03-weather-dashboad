function formatTemperature(value, unit) {
  if (!Number.isFinite(value)) return "—";
  const converted = unit === "F" ? (value * 9) / 5 + 32 : value;
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(converted);
}

function cityIdentity(city) {
  return `${city.latitude},${city.longitude}`;
}

function cityLabel(city) {
  return [city.name, city.region, city.country].filter(Boolean).join(", ");
}

export function updateDashboardDate() {
  const date = new Date();
  const label = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(date);
  document.querySelector("#today-label").textContent = label;
}

export function renderCityChoices(cities, onSelect) {
  const picker = document.querySelector("#city-picker");
  picker.replaceChildren();

  const label = document.createElement("label");
  label.className = "sr-only";
  label.htmlFor = "city-choice";
  label.textContent = "Choose a city";

  const select = document.createElement("select");
  select.id = "city-choice";
  select.className = "city-choice";
  select.setAttribute("aria-label", "Choose a city");

  cities.forEach((city, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = [city.name, city.region, city.country]
      .filter(Boolean)
      .join(", ");
    select.append(option);
  });

  const chooseButton = document.createElement("button");
  chooseButton.className = "choose-city-button";
  chooseButton.type = "button";
  chooseButton.textContent = "Show weather";
  chooseButton.addEventListener("click", () => {
    const selectedCity = cities[Number(select.value)];
    if (selectedCity) onSelect(selectedCity);
  });

  picker.append(label, select, chooseButton);
  picker.hidden = false;
}

export function hideCityChoices() {
  const picker = document.querySelector("#city-picker");
  picker.hidden = true;
  picker.replaceChildren();
}

export function setWeatherLoading(loading) {
  const card = document.querySelector("#current-weather");
  const skeleton = document.querySelector("#weather-skeleton");
  card.classList.toggle("is-loading", loading);
  skeleton.hidden = !loading;
}

export function renderUnitToggle(unit) {
  const toggle = document.querySelector("#unit-toggle");
  const nextUnit = unit === "C" ? "F" : "C";
  toggle.textContent = `°${unit}`;
  toggle.setAttribute("aria-label", `Switch to °${nextUnit}`);
  toggle.title = `Switch to °${nextUnit}`;
}

export function renderCurrentWeather(weather, unit) {
  document.querySelector("#current-location").textContent = cityLabel(weather);
  document.querySelector("#current-condition").textContent = weather.condition;

  const temperature = document.querySelector("#current-temperature");
  const degree = document.createElement("span");
  degree.textContent = "°";
  temperature.replaceChildren(
    document.createTextNode(formatTemperature(weather.temperature, unit)),
    degree,
  );
  document.querySelector("#current-icon").textContent = weather.icon;
  document.querySelector("#wind-speed").textContent =
    `${Number.isFinite(weather.wind) ? weather.wind : "—"} km/h`;
  document.querySelector("#humidity").textContent =
    `${Number.isFinite(weather.humidity) ? weather.humidity : "—"}%`;

  const localTime = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: weather.timezone,
  }).format(new Date());
  document.querySelector("#local-time").textContent = localTime;
}

export function renderForecast(forecast, unit) {
  const grid = document.querySelector("#forecast-grid");
  grid.replaceChildren();

  forecast.forEach((day, index) => {
    const card = document.createElement("article");
    card.className = "forecast-card";
    const dayLabel = new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      timeZone: "UTC",
    }).format(new Date(`${day.date}T00:00:00Z`));
    const accessibleDay = index === 0 ? `Today, ${dayLabel}` : dayLabel;
    const high = formatTemperature(day.high, unit);
    const low = formatTemperature(day.low, unit);
    card.setAttribute(
      "aria-label",
      `${accessibleDay}: ${high}° high, ${low}° low`,
    );

    const dayElement = document.createElement("span");
    dayElement.className = "forecast-day";
    dayElement.textContent = index === 0 ? "Today" : dayLabel;

    const icon = document.createElement("span");
    icon.className = "forecast-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = day.icon;

    const temperatures = document.createElement("span");
    temperatures.className = "forecast-temperatures";
    const highElement = document.createElement("span");
    highElement.className = "forecast-high";
    highElement.textContent = `${high}°`;
    const lowElement = document.createElement("span");
    lowElement.className = "forecast-low";
    lowElement.textContent = `${low}°`;
    temperatures.append(highElement, lowElement);

    card.append(dayElement, icon, temperatures);
    grid.append(card);
  });
}

export function renderFavorites(favorites, currentCity, unit, onSelect, onRemove) {
  const list = document.querySelector("#favorites-list");
  list.replaceChildren();
  document.querySelector("#favorite-count").textContent = String(favorites.length);

  if (favorites.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty-favorites";
    empty.textContent = "No favourites yet. Star a city to keep it close.";
    list.append(empty);
  }

  favorites.forEach((weather) => {
    const item = document.createElement("li");
    item.className = "favorite-row";

    const selectButton = document.createElement("button");
    selectButton.className = "favorite-city";
    selectButton.type = "button";
    selectButton.setAttribute("aria-label", `Show weather for ${cityLabel(weather)}`);
    selectButton.addEventListener("click", () => onSelect(weather));

    const icon = document.createElement("span");
    icon.className = "favorite-weather-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = weather.icon ?? "📍";

    const info = document.createElement("span");
    info.className = "favorite-info";
    const name = document.createElement("span");
    name.className = "favorite-name";
    name.textContent = [weather.name, weather.region].filter(Boolean).join(", ");
    const condition = document.createElement("span");
    condition.className = "favorite-condition";
    condition.textContent =
      weather.condition ?? weather.country ?? "Tap to view forecast";
    info.append(name, condition);

    const temperature = document.createElement("span");
    temperature.className = "favorite-temperature";
    temperature.textContent = Number.isFinite(weather.temperature)
      ? `${formatTemperature(weather.temperature, unit)}°`
      : "—°";
    selectButton.append(icon, info, temperature);

    const removeButton = document.createElement("button");
    removeButton.className = "favorite-remove";
    removeButton.type = "button";
    removeButton.setAttribute("aria-label", `Remove ${weather.name} from favourites`);
    removeButton.textContent = "×";
    removeButton.addEventListener("click", () => onRemove(weather));

    item.append(selectButton, removeButton);
    list.append(item);
  });

  const favoriteButton = document.querySelector("#favorite-toggle");
  const isFavorite = Boolean(currentCity) && favorites.some(
    (weather) => cityIdentity(weather) === cityIdentity(currentCity),
  );
  favoriteButton.disabled = !currentCity;
  favoriteButton.setAttribute("aria-pressed", String(isFavorite));
  favoriteButton.setAttribute(
    "aria-label",
    currentCity
      ? `${isFavorite ? "Remove" : "Add"} ${cityLabel(currentCity)} ${isFavorite ? "from" : "to"} favourites`
      : "Add city to favourites",
  );
  favoriteButton.title = isFavorite ? "Remove from favourites" : "Add to favourites";
}

export function setStatus(message = "", type = "status") {
  const status = document.querySelector("#status-message");
  const error = document.querySelector("#error-message");
  status.hidden = type !== "status" || !message;
  error.hidden = type !== "error" || !message;
  status.textContent = type === "status" ? message : "";
  error.textContent = type === "error" ? message : "";
}
