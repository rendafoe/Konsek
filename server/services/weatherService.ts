// Weather service for checking conditions during runs
// Uses OpenWeatherMap API to get weather at run location and time

interface WeatherData {
  temp: number; // Fahrenheit
  condition: "clear" | "rain" | "snow" | "clouds" | "other";
  description: string;
}

export interface WeatherCheckResult {
  isHot: boolean; // temp > 100°F
  isCold: boolean; // temp < 10°F
  isSnowing: boolean;
  isRaining: boolean;
}

// Decode Google polyline format to array of [lat, lng] coordinates
function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push([lat / 1e5, lng / 1e5]);
  }

  return points;
}

// Get start coordinate from polyline
function getRouteCoordinate(polyline: string): { lat: number; lon: number } | null {
  try {
    const points = decodePolyline(polyline);
    if (points.length === 0) return null;
    return { lat: points[0][0], lon: points[0][1] };
  } catch {
    return null;
  }
}

// Fetch current weather from OpenWeatherMap
// Note: Historical weather API requires a paid subscription, so we use current weather
// which works well for recently synced runs
async function getWeatherAtLocation(
  lat: number,
  lon: number
): Promise<WeatherData | null> {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  if (!apiKey) {
    console.warn("OpenWeatherMap API key not configured - weather-based rewards disabled");
    return null;
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error("Weather API error:", response.status, response.statusText);
      return null;
    }

    const data = await response.json();

    // Map OpenWeatherMap weather codes to conditions
    // 2xx: Thunderstorm, 3xx: Drizzle, 5xx: Rain, 6xx: Snow, 7xx: Atmosphere, 800: Clear, 80x: Clouds
    let condition: WeatherData["condition"] = "other";
    const weatherId = data.weather?.[0]?.id;

    if (weatherId >= 200 && weatherId < 600) {
      condition = "rain"; // Thunderstorm, drizzle, and rain
    } else if (weatherId >= 600 && weatherId < 700) {
      condition = "snow";
    } else if (weatherId === 800) {
      condition = "clear";
    } else if (weatherId > 800) {
      condition = "clouds";
    }

    return {
      temp: data.main?.temp ?? 50,
      condition,
      description: data.weather?.[0]?.description ?? "",
    };
  } catch (error) {
    console.error("Weather API fetch error:", error);
    return null;
  }
}

export async function checkWeatherConditions(
  polyline: string | null,
  runDate: Date
): Promise<WeatherCheckResult> {
  const defaultResult: WeatherCheckResult = {
    isHot: false,
    isCold: false,
    isSnowing: false,
    isRaining: false,
  };

  if (!polyline) {
    return defaultResult;
  }

  const coord = getRouteCoordinate(polyline);
  if (!coord) {
    return defaultResult;
  }

  const weather = await getWeatherAtLocation(coord.lat, coord.lon);
  if (!weather) {
    return defaultResult;
  }

  console.log(`Weather check at (${coord.lat.toFixed(2)}, ${coord.lon.toFixed(2)}): ${weather.temp}°F, ${weather.condition}`);

  return {
    isHot: weather.temp > 100,
    isCold: weather.temp < 10,
    isSnowing: weather.condition === "snow",
    isRaining: weather.condition === "rain",
  };
}
