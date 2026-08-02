import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { MapPin, Loader2 } from 'lucide-react';

interface GooglePlacesInputProps {
  value: string;
  onChange: (value: string, placeData?: any) => void;
  placeholder?: string;
  className?: string;
}

interface PlaceSuggestion {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export function GooglePlacesInput({ value, onChange, placeholder, className }: GooglePlacesInputProps) {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const fetchSuggestions = async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      // Using Google Places API through a proxy or public API
      // For demo purposes, using a mock implementation that uses location data
      const response = await fetch(`https://api.postalpincode.in/postoffice/${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (data[0]?.Status === 'Success') {
        const places = data[0].PostOffice?.slice(0, 5).map((office: any, index: number) => ({
          place_id: `${office.Name}-${index}`,
          description: `${office.Name}, ${office.District}, ${office.State}`,
          structured_formatting: {
            main_text: office.Name,
            secondary_text: `${office.District}, ${office.State}`
          },
          postOffice: office
        })) || [];
        setSuggestions(places);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (newValue: string) => {
    onChange(newValue);
    setShowSuggestions(true);
    
    // Debounce API calls
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      fetchSuggestions(newValue);
    }, 300);
  };

  const handleSuggestionClick = (suggestion: PlaceSuggestion) => {
    onChange(suggestion.structured_formatting.main_text, suggestion);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleBlur = () => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => setShowSuggestions(false), 200);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={className}
        />
        <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        {isLoading && (
          <Loader2 className="absolute right-8 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
        )}
      </div>
      
      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto border shadow-lg bg-white">
          <div className="p-1">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.place_id}
                onClick={() => handleSuggestionClick(suggestion)}
                className="flex items-center p-3 hover:bg-gray-50 cursor-pointer rounded-md"
              >
                <MapPin className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {suggestion.structured_formatting.main_text}
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {suggestion.structured_formatting.secondary_text}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}