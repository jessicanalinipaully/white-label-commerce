'use client';

import { useEffect, useRef, useState } from 'react';
import { CustomerAddress } from '@/lib/api/customer';

declare global {
  interface Window {
    google?: any;
  }
}

export interface AddressFormData {
  firstName: string;
  lastName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  latitude?: number | null;
  longitude?: number | null;
  placeId?: string | null;
  isDefault: boolean;
}

interface AddressFormWithGoogleProps {
  initialValues?: Partial<AddressFormData>;
  onSave: (data: AddressFormData) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

interface PlaceSuggestion {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
  rawResult?: any;
}

export function AddressFormWithGoogle({
  initialValues,
  onSave,
  onCancel,
  submitLabel = 'Confirm Location & Save Address',
}: AddressFormWithGoogleProps) {
  const [formData, setFormData] = useState<AddressFormData>({
    firstName: initialValues?.firstName || '',
    lastName: initialValues?.lastName || '',
    phone: initialValues?.phone || '',
    addressLine1: initialValues?.addressLine1 || '',
    addressLine2: initialValues?.addressLine2 || '',
    city: initialValues?.city || '',
    state: initialValues?.state || '',
    postalCode: initialValues?.postalCode || '',
    country: initialValues?.country || 'India',
    latitude: initialValues?.latitude ? Number(initialValues.latitude) : null,
    longitude: initialValues?.longitude ? Number(initialValues.longitude) : null,
    placeId: initialValues?.placeId || null,
    isDefault: initialValues?.isDefault ?? false,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchNotice, setSearchNotice] = useState('');
  const [selectedLocationSummary, setSelectedLocationSummary] = useState('');
  const [locating, setLocating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [mapsLoaded, setMapsLoaded] = useState(false);

  const autocompleteServiceRef = useRef<any>(null);
  const geocoderRef = useRef<any>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapInstanceRef = useRef<any>(null);
  const markerInstanceRef = useRef<any>(null);
  const formSectionRef = useRef<HTMLFormElement>(null);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Load Google Maps JS API script dynamically
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initServices = () => {
      if (!window.google?.maps) return;
      try {
        if (window.google.maps.places?.AutocompleteService) {
          autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
        }
        geocoderRef.current = new window.google.maps.Geocoder();
        setMapsLoaded(true);
      } catch (err) {
        console.warn('Google Maps service initialization warning:', err);
      }
    };

    if (window.google?.maps) {
      initServices();
      return;
    }

    const scriptId = 'google-maps-js-sdk';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      const validKey = apiKey && apiKey !== 'demo' && apiKey !== 'your_google_maps_api_key_here';
      script.src = validKey
        ? `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
        : `https://maps.googleapis.com/maps/api/js?v=weekly&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        initServices();
      };
      script.onerror = () => {
        setSearchNotice('Google Maps script failed to load. Manual address entry is available.');
      };
      document.head.appendChild(script);
    } else {
      script.addEventListener('load', initServices);
    }

    return () => {
      if (script) {
        script.removeEventListener('load', initServices);
      }
    };
  }, [apiKey]);

  // Core address component parser & React form state populator
  const parseAndPopulateAddress = (
    resultsOrComponents: any,
    lat: number,
    lng: number,
    overridePlaceId?: string | null,
    overrideFormattedAddress?: string,
  ) => {
    let components: any[] = [];
    let formattedAddress = overrideFormattedAddress || '';
    let placeId = overridePlaceId || null;

    if (Array.isArray(resultsOrComponents) && resultsOrComponents.length > 0) {
      // Check if it's an array of GeocoderResult objects
      if (resultsOrComponents[0].address_components) {
        // Collect components from ALL results to ensure we capture street, sublocality, city, state, pincode
        const seenTypes = new Set<string>();
        resultsOrComponents.forEach((r: any) => {
          if (!placeId && r.place_id) placeId = r.place_id;
          if (!formattedAddress && r.formatted_address) formattedAddress = r.formatted_address;

          if (Array.isArray(r.address_components)) {
            r.address_components.forEach((c: any) => {
              const types = c.types || [];
              types.forEach((t: string) => {
                if (!seenTypes.has(t)) {
                  seenTypes.add(t);
                  components.push(c);
                }
              });
            });
          }
        });
      } else {
        // It's already a component array from place details
        components = resultsOrComponents;
      }
    }

    let streetNum = '';
    let route = '';
    let premise = '';
    let sublocality = '';
    let neighborhood = '';
    let city = '';
    let state = '';
    let postalCode = '';
    let country = '';

    components.forEach((c) => {
      const types = c.types || [];
      if (types.includes('street_number')) streetNum = c.long_name;
      if (types.includes('route')) route = c.long_name;
      if (types.includes('premise') || types.includes('building') || types.includes('establishment') || types.includes('point_of_interest')) {
        if (!premise) premise = c.long_name;
      }
      if (types.includes('sublocality_level_1') || types.includes('sublocality')) {
        if (!sublocality) sublocality = c.long_name;
      }
      if (types.includes('sublocality_level_2') || types.includes('neighborhood')) {
        if (!neighborhood) neighborhood = c.long_name;
      }
      if (types.includes('locality') || types.includes('postal_town')) {
        if (!city) city = c.long_name;
      }
      if (types.includes('administrative_area_level_2') && !city) {
        city = c.long_name;
      }
      if (types.includes('administrative_area_level_1')) {
        state = c.long_name;
      }
      if (types.includes('postal_code')) {
        postalCode = c.long_name;
      }
      if (types.includes('country')) {
        country = c.long_name;
      }
    });

    // Fallback extraction from formattedAddress string if components missed fields
    if (formattedAddress) {
      if (!postalCode) {
        const pincodeMatch = formattedAddress.match(/\b\d{5,6}\b/);
        if (pincodeMatch) postalCode = pincodeMatch[0];
      }

      const parts = formattedAddress.split(',').map((p) => p.trim());
      if (parts.length >= 3) {
        if (!country) country = parts[parts.length - 1] || 'India';
        const statePart = parts[parts.length - 2] || '';
        if (!state && statePart) {
          state = statePart.replace(/\b\d{5,6}\b/, '').trim();
        }
        const cityPart = parts[parts.length - 3] || '';
        if (!city && cityPart) {
          city = cityPart;
        }
      }
    }

    // Construct addressLine1: street number + route, or premise + route, or premise, or sublocality, or first part of formatted address
    let line1 = '';
    if (streetNum && route) {
      line1 = `${streetNum} ${route}`;
    } else if (route) {
      line1 = premise ? `${premise}, ${route}` : route;
    } else if (premise) {
      line1 = premise;
    } else if (sublocality) {
      line1 = sublocality;
    } else if (formattedAddress) {
      line1 = formattedAddress.split(',')[0] || '';
    }

    // Construct addressLine2: neighborhood or sublocality if not included in line1
    let line2 = '';
    if (sublocality && line1 !== sublocality && !line1.includes(sublocality)) {
      line2 = sublocality;
    } else if (neighborhood && line1 !== neighborhood && !line1.includes(neighborhood)) {
      line2 = neighborhood;
    }

    const summaryText = formattedAddress || [line1, line2, city, state, postalCode, country].filter(Boolean).join(', ');
    if (summaryText) {
      setSelectedLocationSummary(summaryText);
      setSearchQuery(summaryText);
    }

    // Immediately update the single source of truth: React formData state
    setFormData((prev) => ({
      ...prev,
      addressLine1: line1 || prev.addressLine1,
      addressLine2: prev.addressLine2 && prev.addressLine2.trim().length > 0 ? prev.addressLine2 : (line2 || prev.addressLine2),
      city: city || prev.city,
      state: state || prev.state,
      postalCode: postalCode || prev.postalCode,
      country: country || prev.country || 'India',
      latitude: lat,
      longitude: lng,
      placeId: placeId || prev.placeId,
    }));
  };

  // SINGLE UNIFIED LOCATION SELECTION FUNCTION used by Map Click, Marker Drag, Geolocation, and Search
  const selectLocation = (
    lat: number,
    lng: number,
    overridePlaceId?: string | null,
    overrideFormattedAddress?: string,
    providedComponents?: any[],
  ) => {
    // 1. Immediately update coordinates & map view
    setFormData((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      placeId: overridePlaceId ?? prev.placeId,
    }));

    if (googleMapInstanceRef.current && markerInstanceRef.current) {
      const newPos = { lat, lng };
      googleMapInstanceRef.current.panTo(newPos);
      googleMapInstanceRef.current.setZoom(16);
      markerInstanceRef.current.setPosition(newPos);
    }

    // 2. If pre-parsed components were provided (e.g. search suggestion selection)
    if (providedComponents && providedComponents.length > 0) {
      parseAndPopulateAddress(providedComponents, lat, lng, overridePlaceId, overrideFormattedAddress);
      return;
    }

    // 3. Otherwise run Google Reverse Geocoding for coordinates
    if (!geocoderRef.current && typeof window !== 'undefined' && window.google?.maps) {
      geocoderRef.current = new window.google.maps.Geocoder();
    }

    if (!geocoderRef.current) {
      setSearchNotice('Google Geocoder is unavailable. You can enter address fields manually.');
      return;
    }


    geocoderRef.current.geocode({ location: { lat, lng } }, (results: any[], status: string) => {

      if (status === 'OK' && results && results.length > 0) {
        setSearchNotice('');
        parseAndPopulateAddress(results, lat, lng, overridePlaceId, overrideFormattedAddress);
      } else {
        setSearchNotice('Could not determine the address. Please enter the address manually.');
      }
    });
  };

  // Initialize Map preview when container and Maps SDK are ready
  useEffect(() => {
    if (!mapsLoaded || !mapRef.current || typeof window === 'undefined' || !window.google?.maps) return;

    const defaultCenter = {
      lat: formData.latitude ? Number(formData.latitude) : 12.9716,
      lng: formData.longitude ? Number(formData.longitude) : 77.5946,
    };

    if (!googleMapInstanceRef.current) {
      const map = new window.google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: formData.latitude && formData.longitude ? 16 : 12,
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
      });

      const marker = new window.google.maps.Marker({
        position: defaultCenter,
        map,
        draggable: true,
        title: 'Selected Location',
      });

      googleMapInstanceRef.current = map;
      markerInstanceRef.current = marker;

      // Handle marker dragend -> UNIFIED selectLocation call
      marker.addListener('dragend', () => {
        const pos = marker.getPosition();
        if (pos) {
          selectLocation(pos.lat(), pos.lng());
        }
      });

      // Handle map click -> UNIFIED selectLocation call
      map.addListener('click', (e: any) => {
        if (e.latLng) {
          selectLocation(e.latLng.lat(), e.latLng.lng());
        }
      });
    }

    const triggerResize = () => {
      if (googleMapInstanceRef.current && window.google?.maps?.event) {
        window.google.maps.event.trigger(googleMapInstanceRef.current, 'resize');
      }
    };

    triggerResize();
    const t1 = setTimeout(triggerResize, 100);
    const t2 = setTimeout(triggerResize, 350);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [mapsLoaded]);

  // Update map marker & center when lat/lng state changes externally
  useEffect(() => {
    if (
      mapsLoaded &&
      googleMapInstanceRef.current &&
      markerInstanceRef.current &&
      formData.latitude !== null &&
      formData.latitude !== undefined &&
      formData.longitude !== null &&
      formData.longitude !== undefined &&
      !isNaN(Number(formData.latitude)) &&
      !isNaN(Number(formData.longitude))
    ) {
      const newPos = { lat: Number(formData.latitude), lng: Number(formData.longitude) };
      googleMapInstanceRef.current.panTo(newPos);
      googleMapInstanceRef.current.setZoom(16);
      markerInstanceRef.current.setPosition(newPos);
      if (window.google?.maps?.event) {
        window.google.maps.event.trigger(googleMapInstanceRef.current, 'resize');
      }
    }
  }, [mapsLoaded, formData.latitude, formData.longitude]);

  // Perform Address Search (Places Autocomplete -> Geocoder fallback)
  const executeAddressSearch = (query: string) => {
    const q = query.trim();
    if (!q || q.length < 3) {
      setSuggestions([]);
      setSearchNotice('');
      return;
    }

    setIsSearching(true);
    setSearchNotice('');

    const tryGeocoderSearch = () => {
      if (!geocoderRef.current && window.google?.maps) {
        geocoderRef.current = new window.google.maps.Geocoder();
      }
      if (geocoderRef.current) {
        geocoderRef.current.geocode({ address: q }, (results: any[], status: string) => {
          setIsSearching(false);
          if (status === 'OK' && results && results.length > 0) {
            const mappedSuggestions: PlaceSuggestion[] = results.map((r: any) => ({
              place_id: r.place_id,
              description: r.formatted_address,
              structured_formatting: {
                main_text: r.formatted_address.split(',')[0] || r.formatted_address,
                secondary_text: r.formatted_address.split(',').slice(1).join(',').trim(),
              },
              rawResult: r,
            }));
            setSuggestions(mappedSuggestions);
            setShowSuggestions(true);
          } else {
            setSuggestions([]);
            setSearchNotice(`No matching locations found for "${q}". Click on the map to choose manually.`);
          }
        });
      } else {
        setIsSearching(false);
        setSuggestions([]);
        setSearchNotice('Address search service unavailable. Click on the map or enter address manually.');
      }
    };

    if (autocompleteServiceRef.current) {
      try {
        autocompleteServiceRef.current.getPlacePredictions(
          { input: q },
          (results: any[], status: string) => {
            if (status === 'OK' && results && results.length > 0) {
              setIsSearching(false);
              setSuggestions(results);
              setShowSuggestions(true);
            } else {
              tryGeocoderSearch();
            }
          },
        );
      } catch {
        tryGeocoderSearch();
      }
    } else {
      tryGeocoderSearch();
    }
  };

  // Debounced search trigger
  useEffect(() => {
    if (!mapsLoaded || !searchQuery.trim() || searchQuery.length < 3) {
      setSuggestions([]);
      setSearchNotice('');
      return;
    }

    const timer = setTimeout(() => {
      executeAddressSearch(searchQuery);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery, mapsLoaded]);

  // Select place suggestion -> UNIFIED selectLocation call
  const handleSelectSuggestion = (suggestion: PlaceSuggestion) => {
    setShowSuggestions(false);
    setErrorMsg('');
    setSearchNotice('');

    if (suggestion.rawResult) {
      const place = suggestion.rawResult;
      const lat = place.geometry?.location?.lat ? place.geometry.location.lat() : null;
      const lng = place.geometry?.location?.lng ? place.geometry.location.lng() : null;
      if (lat && lng) {
        selectLocation(lat, lng, suggestion.place_id, suggestion.description, place.address_components);
      }
      return;
    }

    if (!geocoderRef.current && window.google?.maps) {
      geocoderRef.current = new window.google.maps.Geocoder();
    }

    if (geocoderRef.current) {
      geocoderRef.current.geocode({ placeId: suggestion.place_id }, (results: any[], status: string) => {
        if (status === 'OK' && results && results[0]) {
          const place = results[0];
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          selectLocation(lat, lng, suggestion.place_id, place.formatted_address, place.address_components);
        }
      });
    }
  };

  // Handle "Use my current location" -> UNIFIED selectLocation call
  const handleUseCurrentLocation = () => {
    setErrorMsg('');
    setSearchNotice('');
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        selectLocation(position.coords.latitude, position.coords.longitude);
      },
      (err) => {
        setLocating(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setErrorMsg('Location permission denied. Click on the map or enter address manually.');
            break;
          case err.POSITION_UNAVAILABLE:
            setErrorMsg('Location unavailable. Click on the map or search manually.');
            break;
          case err.TIMEOUT:
            setErrorMsg('Location request timed out. Please try again or click on the map.');
            break;
          default:
            setErrorMsg('Unable to retrieve current location. Click on the map or enter address manually.');
            break;
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.phone.trim()) {
      setErrorMsg('Please enter First Name, Last Name, and Phone Number.');
      return;
    }
    if (!formData.addressLine1.trim() || !formData.city.trim() || !formData.state.trim() || !formData.postalCode.trim()) {
      setErrorMsg('Please complete all required address fields.');
      return;
    }

    setSubmitting(true);
    try {
      await onSave(formData);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save address. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Error alert banner */}
      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
          {errorMsg}
        </div>
      )}

      {/* Search notice / fallback message */}
      {searchNotice && (
        <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 text-amber-300 text-xs font-medium flex items-center justify-between">
          <span>{searchNotice}</span>
          <button onClick={() => setSearchNotice('')} className="text-slate-400 hover:text-white font-bold ml-2">
            ×
          </button>
        </div>
      )}

      {/* Location Picker Header */}
      <div className="space-y-3 pb-3 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-white">Choose Delivery Location</h4>
            <p className="text-[11px] text-slate-400">
              Click on the map or drag the pin to adjust your exact location.
            </p>
          </div>

          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={locating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/30 text-xs font-semibold text-primary transition-colors disabled:opacity-50"
          >
            {locating ? (
              <>
                <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span>Locating...</span>
              </>
            ) : (
              <>
                <span>📍</span>
                <span>Use my current location</span>
              </>
            )}
          </button>
        </div>

        {/* Address Search Input */}
        <div className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    executeAddressSearch(searchQuery);
                  }
                }}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                placeholder="Search address or landmark (e.g. Christ University Bangalore)..."
                className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary"
              />
              {isSearching && (
                <div className="absolute right-3 top-3 w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              )}
            </div>

            <button
              type="button"
              onClick={() => executeAddressSearch(searchQuery)}
              disabled={isSearching || searchQuery.trim().length < 3}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-colors disabled:opacity-50"
            >
              Search
            </button>
          </div>

          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
              {suggestions.map((s, idx) => (
                <button
                  key={s.place_id || idx}
                  type="button"
                  onClick={() => handleSelectSuggestion(s)}
                  className="w-full text-left px-4 py-3 hover:bg-slate-800 border-b border-slate-800/60 last:border-0 text-xs text-slate-200 transition-colors flex items-start gap-2"
                >
                  <span className="text-primary text-sm mt-0.5">📍</span>
                  <div>
                    <div className="font-semibold text-slate-100">
                      {s.structured_formatting?.main_text || s.description}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {s.structured_formatting?.secondary_text || s.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Interactive Google Map Container */}
        <div className="space-y-2 pt-1">
          <div
            ref={mapRef}
            className="w-full h-60 md:h-72 min-h-[240px] rounded-xl border border-slate-700 overflow-hidden bg-slate-800 relative z-0 shadow-inner"
          />

          {/* Location Selected Summary Badge */}
          <div className="p-2.5 rounded-xl bg-slate-800/90 border border-slate-700 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2 truncate mr-2">
              <span className="text-primary font-bold text-sm">📍</span>
              <span className="truncate">
                {selectedLocationSummary ||
                  (formData.addressLine1
                    ? `${formData.addressLine1}, ${formData.city}`
                    : 'Click on the map or search to select your location')}
              </span>
            </div>
            {formData.latitude !== null && formData.longitude !== null && (
              <span className="text-[10px] text-slate-400 font-mono bg-slate-900 px-2 py-1 rounded shrink-0">
                {Number(formData.latitude).toFixed(4)}, {Number(formData.longitude).toFixed(4)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Address Details Form (SINGLE SOURCE OF TRUTH: formData) */}
      <form ref={formSectionRef} onSubmit={handleSubmit} className="space-y-3 pt-2">
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Address Details</h4>
          <span className="text-[11px] text-slate-500">Auto-populated from map • Edit anytime</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] text-slate-400 block mb-0.5">First Name *</label>
            <input
              type="text"
              placeholder="First Name"
              required
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-[11px] text-slate-400 block mb-0.5">Last Name *</label>
            <input
              type="text"
              placeholder="Last Name"
              required
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] text-slate-400 block mb-0.5">Phone Number *</label>
          <input
            type="tel"
            placeholder="Phone Number"
            required
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="text-[11px] text-slate-400 block mb-0.5">House / Flat No., Street, Building *</label>
          <input
            type="text"
            placeholder="House / Flat No., Street, Building"
            required
            value={formData.addressLine1}
            onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="text-[11px] text-slate-400 block mb-0.5">Apartment, Suite, Unit, Landmark (Optional)</label>
          <input
            type="text"
            placeholder="Apartment, suite, unit, landmark"
            value={formData.addressLine2 || ''}
            onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-primary"
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-[11px] text-slate-400 block mb-0.5">City *</label>
            <input
              type="text"
              placeholder="City"
              required
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-[11px] text-slate-400 block mb-0.5">State *</label>
            <input
              type="text"
              placeholder="State"
              required
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-[11px] text-slate-400 block mb-0.5">Pincode / Postal *</label>
            <input
              type="text"
              placeholder="Pincode"
              required
              value={formData.postalCode}
              onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] text-slate-400 block mb-0.5">Country *</label>
          <input
            type="text"
            placeholder="Country"
            required
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="isDefaultCheck"
            checked={formData.isDefault}
            onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
            className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-primary focus:ring-primary"
          />
          <label htmlFor="isDefaultCheck" className="text-xs text-slate-300 cursor-pointer">
            Set as default shipping address
          </label>
        </div>

        <div className="flex gap-2 pt-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-slate-300 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-sm font-bold text-white transition-colors disabled:opacity-50 shadow-lg shadow-primary/25"
          >
            {submitting ? 'Saving...' : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
