import React, { useEffect, useMemo, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from "@/integrations/supabase/client";

interface CountryMapProps {
  companies: Array<{
    "Country of Origin": string | null;
    [key: string]: any;
  }>;
  onCountryClick: (country: string) => void;
  selectedCountry?: string;
  selectedVentureOffice?: string;
}

export const CountryMap: React.FC<CountryMapProps> = ({ 
  companies, 
  onCountryClick, 
  selectedCountry,
  selectedVentureOffice = "all"
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapboxToken, setMapboxToken] = useState<string>('');

  // Filter companies by selected venture office (for highlighted countries)
  const filteredCompanies = useMemo(() => {
    if (!selectedVentureOffice || selectedVentureOffice === "all") return companies;
    return companies.filter((company) => company.venture_office === selectedVentureOffice);
  }, [companies, selectedVentureOffice]);

  // Get unique countries from filtered companies data
  const countriesWithCompanies = useMemo(
    () =>
      Array.from(
        new Set(
          filteredCompanies
            .map((company) => company["Country of Origin"])
            .filter((country): country is string => country !== null)
        )
      ),
    [filteredCompanies]
  );

  useEffect(() => {
    // Fetch Mapbox token from Supabase secrets
    const fetchMapboxToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (error) throw error;
        setMapboxToken(data.token);
      } catch (error) {
        console.error('Error fetching Mapbox token:', error);
        // Fallback - user should enter their token
        setMapboxToken('pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjazZ0eWw2djMwMHh5M3JwZjNucG9tdTFzIn0.example');
      }
    };

    fetchMapboxToken();
  }, []);

  // Latest-value refs so map event handlers and the style.load callback
  // never capture stale props — and, critically, so the map is created
  // exactly ONCE per token. Recreating the WebGL map on every parent
  // re-render (the old deps included an array and a callback with fresh
  // identities each render) leaks GL contexts until the browser refuses
  // to paint — the "white map" failure (fixed 2026-07-19).
  const countriesRef = useRef<string[]>(countriesWithCompanies);
  const selectedCountryRef = useRef<string | undefined>(selectedCountry);
  const onCountryClickRef = useRef(onCountryClick);
  useEffect(() => {
    countriesRef.current = countriesWithCompanies;
    selectedCountryRef.current = selectedCountry;
    onCountryClickRef.current = onCountryClick;
  });

  const highlightPaint = (selected: string | undefined) => ([
    'case',
    ['==', ['get', 'name_en'], selected || ''],
    '#2563eb',
    '#059669',
  ] as unknown as mapboxgl.Expression);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      zoom: 1.5,
      center: [20, 30],
      projection: 'globe',
    });

    map.current.on('error', (e) => {
      console.error('Mapbox error:', e?.error?.message ?? e);
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({ visualizePitch: true }),
      'top-right'
    );

    map.current.on('style.load', () => {
      map.current?.addSource('countries', {
        type: 'vector',
        url: 'mapbox://mapbox.country-boundaries-v1'
      });

      map.current?.addLayer({
        id: 'countries-base',
        type: 'fill',
        source: 'countries',
        'source-layer': 'country_boundaries',
        paint: {
          'fill-color': '#f0f0f0',
          'fill-opacity': 0.3
        }
      });

      map.current?.addLayer({
        id: 'countries-highlighted',
        type: 'fill',
        source: 'countries',
        'source-layer': 'country_boundaries',
        filter: ['in', 'name_en', ...countriesRef.current],
        paint: {
          'fill-color': highlightPaint(selectedCountryRef.current),
          'fill-opacity': 0.7
        }
      });

      map.current?.addLayer({
        id: 'countries-border',
        type: 'line',
        source: 'countries',
        'source-layer': 'country_boundaries',
        paint: {
          'line-color': '#ffffff',
          'line-width': 0.5
        }
      });

      map.current?.on('click', 'countries-highlighted', (e) => {
        if (e.features && e.features[0] && e.features[0].properties) {
          const countryName = e.features[0].properties.name_en;
          if (countriesRef.current.includes(countryName)) {
            onCountryClickRef.current(countryName);
          }
        }
      });

      map.current?.on('mouseenter', 'countries-highlighted', () => {
        if (map.current) {
          map.current.getCanvas().style.cursor = 'pointer';
        }
      });

      map.current?.on('mouseleave', 'countries-highlighted', () => {
        if (map.current) {
          map.current.getCanvas().style.cursor = '';
        }
      });

      // Guard against a zero-size container at construction (lazy mount
      // inside the new app shell): re-measure once the style is in.
      map.current?.resize();
    });

    // Keep the canvas sized to its container (sidebar collapse changes
    // the main column width without a window resize event).
    const ro = new ResizeObserver(() => map.current?.resize());
    ro.observe(mapContainer.current);

    return () => {
      ro.disconnect();
      map.current?.remove();
      map.current = null;
    };
  }, [mapboxToken]);

  // Update highlight filter + selected-country paint in place — no map
  // teardown needed when data or selection changes.
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const apply = () => {
      if (!m.getLayer('countries-highlighted')) return;
      m.setFilter('countries-highlighted', ['in', 'name_en', ...countriesWithCompanies]);
      m.setPaintProperty('countries-highlighted', 'fill-color', highlightPaint(selectedCountry));
    };
    if (m.isStyleLoaded()) apply();
    else m.once('idle', apply);
  }, [countriesWithCompanies, selectedCountry]);

  // Update markers based on selected venture office
  useEffect(() => {
    if (!map.current) return;

    // Remove existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    const addMarker = (lng: number, lat: number, name: string, location: string, color: string) => {
      const marker = new mapboxgl.Marker({ color, scale: 0.7 })
        .setLngLat([lng, lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 })
            .setHTML(`<div class="font-semibold">${name}</div><div class="text-sm text-gray-600">${location}</div>`)
        )
        .addTo(map.current!);
      markersRef.current.push(marker);
    };

    // Carrollton, GA - Healthliant Ventures (Tanner Health)
    const showCarrollton = selectedVentureOffice === "all" || selectedVentureOffice === "Healthliant Ventures";
    // Gainesville, GA - Northeast Georgia Health Ventures
    const showGainesville = selectedVentureOffice === "all" || selectedVentureOffice === "Northeast Georgia Health Ventures";

    if (showCarrollton) {
      addMarker(-85.0766, 33.5801, "Healthliant Ventures", "Carrollton, GA", "#ef4444");
    }

    if (showGainesville) {
      addMarker(-83.8241, 34.2979, "Northeast Georgia Health Ventures", "Gainesville, GA", "#3b82f6");
    }
  }, [selectedVentureOffice]);

  // Update highlighted countries when data changes
  useEffect(() => {
    if (map.current && map.current.getLayer('countries-highlighted')) {
      map.current.setFilter('countries-highlighted', ['in', 'name_en', ...countriesWithCompanies]);
      
      // Update colors based on selection
      map.current.setPaintProperty('countries-highlighted', 'fill-color', [
        'case',
        ['==', ['get', 'name_en'], selectedCountry || ''],
        '#2563eb',
        '#059669'
      ]);
    }
  }, [countriesWithCompanies, selectedCountry]);

  if (!mapboxToken) {
    return (
      <div className="w-full h-96 flex items-center justify-center bg-muted rounded-lg">
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[500px] rounded-lg overflow-hidden border">{/* Expanded height by 30% */}
      <div ref={mapContainer} className="absolute inset-0" />
      <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm p-3 rounded-lg shadow-sm">
        <h3 className="font-semibold text-sm mb-1">Portfolio Company Presence</h3>
        <p className="text-xs text-muted-foreground">
          {countriesWithCompanies.length} countries with companies
        </p>
        {selectedCountry && (
          <p className="text-xs text-primary font-medium mt-1">
            Selected: {selectedCountry}
          </p>
        )}
      </div>
    </div>
  );
};