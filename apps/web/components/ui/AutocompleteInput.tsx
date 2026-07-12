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
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep onChange in a ref to avoid re-binding autocomplete listeners
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (
      !inputRef.current ||
      typeof google === "undefined" ||
      !google.maps ||
      !google.maps.places
    ) {
      return;
    }

    // Initialize classic, robust Google Places Autocomplete on our native input
    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: "in" }, // Restrict suggestions strictly to India
      fields: ["formatted_address", "geometry", "name"],
    });

    // Handle place selection
    const listener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (place) {
        const address = place.formatted_address || place.name || "";
        onChangeRef.current(address);
      }
    });

    return () => {
      if (google && google.maps && google.maps.event && listener) {
        google.maps.event.removeListener(listener);
      }
    };
  }, []);

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full h-10 px-3.5 bg-white/45 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700/70 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all rounded-xl text-sm font-semibold outline-none text-foreground placeholder:text-slate-400 dark:placeholder:text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
    />
  );
}
