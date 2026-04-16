import React, { useState } from 'react';
import { Leaf, Trees, Flower2, Droplets, Sun, MapPin } from 'lucide-react';

function PlantCard({ plant, onTap, onAddClick }) {
  const [imgError, setImgError] = useState(false);

  const getPlantIcon = () => {
    switch (plant.plant_type) {
      case 'Tree': return <Trees size={28} className="text-plant-accent" />;
      case 'Shrub': return <Leaf size={28} className="text-plant-accent" />;
      case 'Grass':
      case 'Groundcover': return <Leaf size={28} className="text-plant-muted" />;
      default: return <Flower2 size={28} className="text-plant-accent" />;
    }
  };

  const getWaterIcon = (needs) => {
    switch (needs) {
      case 'High': return <Droplets size={16} className="text-blue-400" />;
      case 'Moderate': return <Droplets size={16} className="text-teal-400" />;
      case 'Low': return <Droplets size={16} className="text-amber-400" />;
      default: return null;
    }
  };

  return (
    <div
      onClick={onTap}
      className="bg-plant-card2 border border-plant-border rounded-lg overflow-hidden cursor-pointer hover:bg-plant-card transition-colors"
    >
      <div className="flex items-stretch">
        {/* Plant photo */}
        <div className="flex-shrink-0 w-24 h-24 bg-plant-bg relative">
          {plant.image_url && !imgError ? (
            <img
              src={plant.image_url}
              alt={plant.common_name}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {getPlantIcon()}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 p-3 flex flex-col justify-center">
          <h3 className="font-semibold text-plant-text truncate">{plant.common_name}</h3>
          <p className="text-sm text-plant-muted italic truncate">{plant.botanical_name}</p>

          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {plant.hardiness_zone && (
              <span className="text-xs bg-plant-border text-plant-text px-2 py-0.5 rounded">
                Zone {plant.hardiness_zone}
              </span>
            )}
            {plant.water_needs && (
              <span className="text-xs bg-plant-border text-plant-text px-2 py-0.5 rounded flex items-center gap-1">
                {getWaterIcon(plant.water_needs)} {plant.water_needs}
              </span>
            )}
            {plant.plant_type && (
              <span className="text-xs bg-plant-border text-plant-text px-2 py-0.5 rounded">
                {plant.plant_type}
              </span>
            )}
          </div>
        </div>

        {/* Add button */}
        {onAddClick && (
          <div className="flex-shrink-0 flex items-center pr-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddClick(plant);
              }}
              className="touch-target bg-plant-accent text-white rounded-full w-9 h-9 flex items-center justify-center hover:bg-plant-accent/90 transition-colors"
            >
              <span className="text-lg">+</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default PlantCard;
