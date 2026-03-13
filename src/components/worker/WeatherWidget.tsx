import { useState, useEffect } from "react";
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, CloudDrizzle, CloudFog, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface WeatherData {
  temperature: number;
  weatherCode: number;
  hourly: { time: string; temp: number; code: number }[];
}

const LATITUDE = 30.4515;
const LONGITUDE = -91.1871;

const weatherInfo: Record<number, { label: string; icon: React.ElementType }> = {
  0: { label: "Clear", icon: Sun },
  1: { label: "Mostly Clear", icon: Sun },
  2: { label: "Partly Cloudy", icon: Cloud },
  3: { label: "Overcast", icon: Cloud },
  45: { label: "Foggy", icon: CloudFog },
  48: { label: "Foggy", icon: CloudFog },
  51: { label: "Light Drizzle", icon: CloudDrizzle },
  53: { label: "Drizzle", icon: CloudDrizzle },
  55: { label: "Heavy Drizzle", icon: CloudDrizzle },
  61: { label: "Light Rain", icon: CloudRain },
  63: { label: "Rain", icon: CloudRain },
  65: { label: "Heavy Rain", icon: CloudRain },
  71: { label: "Light Snow", icon: CloudSnow },
  73: { label: "Snow", icon: CloudSnow },
  75: { label: "Heavy Snow", icon: CloudSnow },
  80: { label: "Rain Showers", icon: CloudRain },
  81: { label: "Rain Showers", icon: CloudRain },
  82: { label: "Heavy Showers", icon: CloudRain },
  95: { label: "Thunderstorm", icon: CloudLightning },
  96: { label: "Thunderstorm", icon: CloudLightning },
  99: { label: "Thunderstorm", icon: CloudLightning },
};

function getWeatherInfo(code: number) {
  return weatherInfo[code] || { label: "Unknown", icon: Cloud };
}

function isRainCode(code: number) {
  return [51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(code);
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    fetchWeather();
  }, []);

  const fetchWeather = async () => {
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${LATITUDE}&longitude=${LONGITUDE}&current=temperature_2m,weather_code&hourly=temperature_2m,weather_code&temperature_unit=fahrenheit&forecast_days=1&timezone=America%2FChicago`
      );
      const data = await res.json();

      const now = new Date();
      const currentHourIndex = data.hourly.time.findIndex((t: string) => new Date(t) >= now);
      const startIdx = Math.max(0, currentHourIndex);
      const hourly = data.hourly.time.slice(startIdx, startIdx + 4).map((t: string, i: number) => ({
        time: t,
        temp: Math.round(data.hourly.temperature_2m[startIdx + i]),
        code: data.hourly.weather_code[startIdx + i],
      }));

      setWeather({
        temperature: Math.round(data.current.temperature_2m),
        weatherCode: data.current.weather_code,
        hourly,
      });
    } catch {
      // silently fail
    }
  };

  if (!weather) return null;

  const current = getWeatherInfo(weather.weatherCode);
  const CurrentIcon = current.icon;
  const hasRain = isRainCode(weather.weatherCode) || weather.hourly.some((h) => isRainCode(h.code));

  return (
    <div className="space-y-2">
      {hasRain && (
        <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg px-3 py-2 text-sm font-medium">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          ⚠️ Rain expected today — contact admin before heading out
        </div>
      )}
      <Card>
        <CardContent className="flex items-center gap-4 py-3 px-4">
          <div className="flex items-center gap-2">
            <CurrentIcon className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{weather.temperature}°F</p>
              <p className="text-xs text-muted-foreground">{current.label} · Baton Rouge</p>
            </div>
          </div>
          <div className="flex-1" />
          <div className="flex gap-3">
            {weather.hourly.map((h, i) => {
              const info = getWeatherInfo(h.code);
              const HIcon = info.icon;
              const hour = new Date(h.time).getHours();
              const ampm = hour >= 12 ? "p" : "a";
              const h12 = hour % 12 || 12;
              return (
                <div key={i} className="text-center">
                  <p className="text-[10px] text-muted-foreground">{h12}{ampm}</p>
                  <HIcon className="h-4 w-4 mx-auto text-muted-foreground my-0.5" />
                  <p className="text-xs font-medium">{h.temp}°</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
