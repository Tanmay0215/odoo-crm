import { useEffect, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";

export function useGoogleMaps(): boolean {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn(
        "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is missing. Google Maps is deactivated.",
      );
      return;
    }

    // Google's official, zero-dependency, singleton loader
    const loader = new Loader({
      apiKey,
      version: "weekly",
      libraries: ["places"],
    });

    loader
      .load()
      .then(() => {
        setIsLoaded(true);
      })
      .catch((err) => {
        console.error("Failed to load Google Maps SDK:", err);
      });
  }, []);

  return isLoaded;
}
