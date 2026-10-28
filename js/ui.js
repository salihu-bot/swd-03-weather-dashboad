const dayFormatter = new Intl.DateTimeFormat(undefined, { weekday: "short" });

function getForecastDay(offset) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return offset === 0 ? "Today" : dayFormatter.format(date);
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

export function renderCurrentWeather(weather) {
  document.querySelector("#current-location").textContent =
    `${weather.name}, ${weather.country}`;
  document.querySelector("#current-condition").textContent = weather.condition;
  document.querySelector("#current-temperature").innerHTML =
    `${weather.temperature}<span>°</span>`;
  document.querySelector("#current-icon").textContent = weather.icon;
  document.querySelector("#wind-speed").textContent = `${weather.wind} km/h`;
  document.querySelector("#humidity").textContent = `${weather.humidity}%`;

  const localTime = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: weather.timezone,
  }).format(new Date());
  document.querySelector("#local-time").textContent = localTime;

  const favoriteButton = document.querySelector("#favorite-toggle");
  favoriteButton.setAttribute(
    "aria-label",
    `Add ${weather.name} to favourites`,
  );
}

export function renderForecast(forecast) {
  const grid = document.querySelector("#forecast-grid");
  grid.replaceChildren();

  forecast.forEach((day, index) => {
    const card = document.createElement("article");
    card.className = "forecast-card";
    const dayLabel = day.date
      ? new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(
          new Date(`${day.date}T12:00:00`),
        )
      : getForecastDay(index);
    const accessibleDay = index === 0 ? `Today, ${dayLabel}` : dayLabel;
    card.setAttribute(
      "aria-label",
      `${accessibleDay}: ${day.high}° high, ${day.low}° low`,
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
    const high = document.createElement("span");
    high.className = "forecast-high";
    high.textContent = `${day.high}°`;
    const low = document.createElement("span");
    low.className = "forecast-low";
    low.textContent = `${day.low}°`;
    temperatures.append(high, low);

    card.append(dayElement, icon, temperatures);
    if (day.rain) {
      const rain = document.createElement("span");
      rain.className = "forecast-rain";
      rain.textContent = `${day.rain} rain`;
      card.append(rain);
    }

    grid.append(card);
  });
}

export function renderFavorites(favorites, currentCity, onSelect, onRemove) {
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
    selectButton.setAttribute("aria-label", `Show weather for ${weather.name}`);
    selectButton.addEventListener("click", () => onSelect(weather.name));

    const icon = document.createElement("span");
    icon.className = "favorite-weather-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = weather.icon;

    const info = document.createElement("span");
    info.className = "favorite-info";
    const name = document.createElement("span");
    name.className = "favorite-name";
    name.textContent = weather.name;
    const condition = document.createElement("span");
    condition.className = "favorite-condition";
    condition.textContent = weather.condition;
    info.append(name, condition);

    const temperature = document.createElement("span");
    temperature.className = "favorite-temperature";
    temperature.textContent = `${weather.temperature}°`;
    selectButton.append(icon, info, temperature);

    const removeButton = document.createElement("button");
    removeButton.className = "favorite-remove";
    removeButton.type = "button";
    removeButton.setAttribute("aria-label", `Remove ${weather.name} from favourites`);
    removeButton.textContent = "×";
    removeButton.addEventListener("click", () => onRemove(weather.name));

    item.append(selectButton, removeButton);
    list.append(item);
  });

  const favoriteButton = document.querySelector("#favorite-toggle");
  const isFavorite = favorites.some(
    (weather) => weather.name.toLocaleLowerCase() === currentCity.toLocaleLowerCase(),
  );
  favoriteButton.setAttribute("aria-pressed", String(isFavorite));
  favoriteButton.setAttribute(
    "aria-label",
    `${isFavorite ? "Remove" : "Add"} ${currentCity} ${isFavorite ? "from" : "to"} favourites`,
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
