import React, { useEffect, useRef, useState } from 'react';
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
}

export const CountryMap: React.FC<CountryMapProps> = ({ 
  companies, 
  onCountryClick, 
  selectedCountry 
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');

  // Get unique countries from companies data
  const countriesWithCompanies = Array.from(new Set(
    companies
      .map(company => company["Country of Origin"])
      .filter((country): country is string => country !== null)
  ));

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

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      zoom: 1.5,
      center: [20, 30],
      projection: 'globe',
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    map.current.on('style.load', () => {
      // Add a data source for countries
      map.current?.addSource('countries', {
        type: 'vector',
        url: 'mapbox://mapbox.country-boundaries-v1'
      });

      // Add layer for all countries (base layer)
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

      // Add layer for countries with companies (highlighted)
      map.current?.addLayer({
        id: 'countries-highlighted',
        type: 'fill',
        source: 'countries',
        'source-layer': 'country_boundaries',
        filter: ['in', 'name_en', ...countriesWithCompanies],
        paint: {
          'fill-color': [
            'case',
            ['==', ['get', 'name_en'], selectedCountry || ''],
            '#2563eb', // Selected country color (blue)
            '#059669'  // Default highlighted color (green)
          ],
          'fill-opacity': 0.7
        }
      });

      // Add border layer
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

      // Add click event
      map.current?.on('click', 'countries-highlighted', (e) => {
        if (e.features && e.features[0] && e.features[0].properties) {
          const countryName = e.features[0].properties.name_en;
          if (countriesWithCompanies.includes(countryName)) {
            onCountryClick(countryName);
          }
        }
      });

      // Change cursor on hover
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
    });

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, countriesWithCompanies, selectedCountry, onCountryClick]);

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
    <div className="relative w-full h-96 rounded-lg overflow-hidden border">
      <div ref={mapContainer} className="absolute inset-0" />
      <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm p-3 rounded-lg shadow-sm">
        <h3 className="font-semibold text-sm mb-1">Portfolio Presence</h3>
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