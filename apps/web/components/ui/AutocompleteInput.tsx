import React, { useEffect, useRef } from "react";

interface AutocompleteProps {
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
}

export function AutocompleteInput({
  value,
  onChange,
  placeholder,
}: AutocompleteProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || typeof google === "undefined") return;

    // 1. Create the modern non-deprecated Place Autocomplete web component
    const autocompleteEl = document.createElement("gmp-place-autocomplete");
    autocompleteEl.setAttribute("placeholder", placeholder);

    // Enforce country restriction strictly to India ("IN") using the modern country attribute
    autocompleteEl.setAttribute("country", "in");

    // Apply clean styling matching our glassmorphism text fields
    autocompleteEl.className =
      "w-full h-10 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-white placeholder:text-neutral-600 focus:border-blue-500 outline-none transition-all block";

    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(autocompleteEl);

    // 2. Listen to modern select events (replaces place_changed listener)
    const handlePlaceSelect = (e: Event) => {
      const customEvent = e as CustomEvent;
      const place = customEvent.detail.place;
      if (place) {
        if (place.formattedAddress) {
          onChange(place.formattedAddress);
        } else {
          // Asynchronously pull displayName or address fields if not hydrated
          place
            .fetchFields({ fields: ["displayName", "formattedAddress"] })
            .then(() => {
              onChange(place.formattedAddress || place.displayName || "");
            });
        }
      }
    };

    autocompleteEl.addEventListener("gmp-placeselect", handlePlaceSelect);

    return () => {
      autocompleteEl.removeEventListener("gmp-placeselect", handlePlaceSelect);
    };
  }, [onChange, placeholder]);

  return (
    <div ref={containerRef} className="w-full relative">
      {/* Standard input fallback while the Google script loads and hydrates the shadow DOM */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 px-3 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-white placeholder:text-neutral-600 focus:border-blue-500 outline-none transition-all"
      />
    </div>
  );
}
