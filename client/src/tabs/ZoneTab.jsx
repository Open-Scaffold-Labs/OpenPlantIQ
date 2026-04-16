import React, { useState, useEffect } from 'react';
import { MapPin, Leaf } from 'lucide-react';
import PlantCard from '../components/PlantCard';

const ZONE_MAPPING = {
  1: '> 50°N',
  2: '45-50°N',
  3: '43-45°N',
  4: '40-43°N',
  5: '37-40°N',
  6: '34-37°N',
  7: '31-34°N',
  8: '28-31°N',
  9: '25-28°N',
  10: '22-25°N',
  11: '< 22°N'
};

function ZoneTab({ onAddToList }) {
  const [zone, setZone] = useState(null);
  const [zoneInput, setZoneInput] = useState('');
  const [plants, setPlants] = useState([]);
  const [selectedType, setSelectedType] = useState('All');
  const [selectedWater, setSelectedWater] = useState('All');
  const [isLocating, setIsLocating] = useState(false);

  const estimateZone = (latitude) => {
    if (latitude > 47) return '4-5';
    if (latitude > 42) return '5-6';
    if (latitude > 37) return '6-7';
    if (latitude > 32) return '7-8';
    if (latitude > 27) return '9';
    return '10';
  };

  const handleUseLocation = () => {
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const estimatedZone = estimateZone(position.coords.latitude);
        setZone(estimatedZone);
        setZoneInput('');
        setIsLocating(false);
        fetchRecommendations(estimatedZone);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsLocating(false);
      }
    );
  };

  const handleZoneSubmit = () => {
    if (zoneInput) {
      setZone(zoneInput);
      setZoneInput('');
      fetchRecommendations(zoneInput);
    }
  };

  const fetchRecommendations = async (selectedZone) => {
    try {
      const res = await fetch(`/api/plants?zone=${selectedZone}`);
      const data = await res.json();
      setPlants(data);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  };

  const filteredPlants = plants.filter(p => {
    if (selectedType !== 'All' && p.plant_type !== selectedType) return false;
    if (selectedWater !== 'All' && p.water_needs !== selectedWater) return false;
    return true;
  });

  const PLANT_TYPES = ['All', 'Trees', 'Shrubs', 'Perennials', 'Grasses', 'Groundcover'];
  const WATER_NEEDS = ['All', 'Low', 'Moderate', 'High'];

  return (
    <div className="h-full flex flex-col bg-plant-bg overflow-hidden">
      <div className="bg-plant-card border-b border-plant-border p-4">
        <h1 className="text-xl font-bold text-plant-text mb-1">Find Your Zone</h1>
        <p className="text-xs text-plant-muted">Get recommendations for your climate</p>
      </div>

      <div className="p-4 border-b border-plant-border space-y-3">
        <button
          onClick={handleUseLocation}
          disabled={isLocating}
          className="w-full touch-target bg-plant-accent hover:bg-plant-accent/90 disabled:opacity-50 text-white font-semibold rounded-lg py-3 transition-colors flex items-center justify-center gap-2"
        >
          <MapPin size={18} />
          {isLocating ? 'Finding location...' : 'Use My Location'}
        </button>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Zone (e.g., 6-7)"
            value={zoneInput}
            onChange={(e) => setZoneInput(e.target.value)}
            className="flex-1 bg-plant-card2 border border-plant-border rounded px-3 py-2 text-plant-text placeholder-plant-muted outline-none"
          />
          <button
            onClick={handleZoneSubmit}
            className="touch-target bg-plant-card2 border border-plant-border text-plant-accent hover:bg-plant-card rounded px-3 transition-colors"
          >
            Go
          </button>
        </div>

        {zone && (
          <div className="bg-plant-card2 border border-plant-accent rounded p-3">
            <p className="text-xs text-plant-muted mb-1">Your Zone</p>
            <p className="text-lg font-bold text-plant-accent">{zone}</p>
          </div>
        )}
      </div>

      {zone && (
        <div className="p-4 border-b border-plant-border space-y-2">
          <p className="text-xs text-plant-muted font-semibold">Filter by Type</p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {PLANT_TYPES.map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`touch-target whitespace-nowrap px-3 py-1 rounded transition-colors text-sm ${
                  selectedType === type
                    ? 'bg-plant-accent text-white'
                    : 'bg-plant-card2 border border-plant-border text-plant-text'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <p className="text-xs text-plant-muted font-semibold mt-3">Filter by Water</p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {WATER_NEEDS.map(water => (
              <button
                key={water}
                onClick={() => setSelectedWater(water)}
                className={`touch-target whitespace-nowrap px-3 py-1 rounded transition-colors text-sm ${
                  selectedWater === water
                    ? 'bg-plant-accent text-white'
                    : 'bg-plant-card2 border border-plant-border text-plant-text'
                }`}
              >
                {water}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        {!zone ? (
          <p className="text-center text-plant-muted py-8">Select your zone to see recommendations</p>
        ) : filteredPlants.length === 0 ? (
          <p className="text-center text-plant-muted py-8">No plants found for this combination</p>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-plant-muted mb-3">Recommended plants for Zone {zone}</p>
            {filteredPlants.map(plant => (
              <PlantCard
                key={plant.id}
                plant={plant}
                onTap={() => {}}
                onAddClick={onAddToList}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ZoneTab;
