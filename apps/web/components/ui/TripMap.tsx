import React, { useEffect, useRef } from "react";

interface TripMapProps {
  source: string;
  destination: string;
  onRouteComputed?: (distanceKm: number, durationText: string) => void;
}

export function TripMap({
  source,
  destination,
  onRouteComputed,
}: TripMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (
      !mapRef.current ||
      typeof google === "undefined" ||
      !source ||
      !destination
    )
      return;

    // Custom dark-mode vector map styling (no emojis!)
    const darkMapStyle: google.maps.MapTypeStyle[] = [
      { elementType: "geometry", stylers: [{ color: "#18181b" }] },
      { elementType: "labels.text.stroke", stylers: [{ color: "#18181b" }] },
      { elementType: "labels.text.fill", stylers: [{ color: "#71717a" }] },
      {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ color: "#27272a" }],
      },
      {
        featureType: "road",
        elementType: "geometry.stroke",
        stylers: [{ color: "#3f3f46" }],
      },
      {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#09090b" }],
      },
    ];

    const map = new google.maps.Map(mapRef.current, {
      zoom: 6,
      center: { lat: 20.5937, lng: 78.9629 }, // Center of India
      styles: darkMapStyle,
      disableDefaultUI: true,
      zoomControl: true,
    });

    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer({
      map,
      suppressMarkers: false,
    });

    directionsService.route(
      {
        origin: source,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          directionsRenderer.setDirections(result);

          const leg = result.routes[0]?.legs[0];
          if (leg && onRouteComputed) {
            const distanceInKm = (leg.distance?.value || 0) / 1000;
            const durationText = leg.duration?.text || "Unknown";
            onRouteComputed(Number(distanceInKm.toFixed(1)), durationText);
          }
        } else {
          console.log("Directions request failed with status: " + status);
        }
      },
    );
  }, [source, destination, onRouteComputed]);

  return (
    <div
      ref={mapRef}
      className="w-full h-[320px] bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-800 shadow-inner"
    />
  );
}
