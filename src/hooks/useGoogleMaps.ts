import { useEffect, useState } from "react";

declare global {
  interface Window {
    google: any;
    __googleMapsCallback?: () => void;
  }
}

let isScriptLoading = false;
let isScriptLoaded = false;
let loadPromise: Promise<void> | null = null;

export const loadGoogleMapsScript = (apiKey: string): Promise<void> => {
  if (isScriptLoaded) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    if (window.google && window.google.maps) {
      isScriptLoaded = true;
      resolve();
      return;
    }

    const callbackName = "__googleMapsCallback";
    window[callbackName] = () => {
      isScriptLoaded = true;
      isScriptLoading = false;
      delete window[callbackName];
      resolve();
    };

    const existingScript = document.getElementById("google-maps-api-script");
    if (existingScript) {
      // Script tag exists but not loaded yet
      return;
    }

    const script = document.createElement("script");
    script.id = "google-maps-api-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&loading=async&callback=${callbackName}`;
    script.async = true;
    script.defer = true;

    script.onerror = (err) => {
      loadPromise = null;
      isScriptLoading = false;
      reject(err);
    };

    isScriptLoading = true;
    document.head.appendChild(script);
  });

  return loadPromise;
};

export function useGoogleMaps() {
  const [loaded, setLoaded] = useState(isScriptLoaded);
  const [error, setError] = useState<any>(null);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (isScriptLoaded) {
      setLoaded(true);
      return;
    }

    if (!apiKey) {
      setError(new Error("Google Maps API key (VITE_GOOGLE_MAPS_API_KEY) is not defined in environment variables."));
      return;
    }

    loadGoogleMapsScript(apiKey)
      .then(() => setLoaded(true))
      .catch((err) => {
        console.error("Failed to load Google Maps API:", err);
        setError(err);
      });
  }, [apiKey]);

  return { loaded, error };
}
