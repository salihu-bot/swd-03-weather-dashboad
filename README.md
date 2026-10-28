# Weatherly

A responsive weather dashboard built with plain HTML, CSS, and JavaScript ES modules.

Run the page from a local web server (for example, VS Code Live Server). Browser geolocation requires a secure context, such as `localhost` or HTTPS.

## Features

- Current conditions and a seven-day forecast.
- City search with a choice of matching locations.
- Favourites saved in `localStorage`; select a favourite to load its forecast.
- Celsius/Fahrenheit display with the selected unit remembered between visits.
- Use the browser's location service for a local forecast.
- Restores the last viewed city on a later visit. On the first visit, Weatherly asks for location access and falls back to Seattle if access is unavailable or denied.
- Loading skeleton and accessible status/error messages.
- Glass-style cards and responsive mobile/desktop layouts.

## API

Weatherly uses the free [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api) to find cities and the [Open-Meteo Forecast API](https://open-meteo.com/en/docs) for current and daily weather. No API key is required.

## Screenshots

> Screenshot placeholder: add a dashboard capture here.

## What I learned

- How to sequence asynchronous fetch requests with `async`/`await` and handle failures with `try`/`catch`.
- How geocoding results and forecast coordinates connect to weather data.
- How to use `AbortController` to cancel stale requests.
- How to persist small preferences and saved locations with `localStorage`.
- How to build interface elements safely with `document.createElement` and `textContent` rather than parsing API values as HTML.
- How browser geolocation permissions and failure states affect the user experience.
