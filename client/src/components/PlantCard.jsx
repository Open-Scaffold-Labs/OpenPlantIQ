import React from 'react';
import { Leaf, Trees, Flower2, Droplets, Sun, MapPin } from 'lucide-react';

function PlantCard({ plant, onTap, onAddClick }) {
  const getPlantIcon = () => {
    switch (plant.plant_type) {
      case 'Tree': return <Trees size={32} className="text-plant-accent" />;
      case 'Shrub': return <Leaf size={32} className="text-plant-accent" />;
      case 'Grass':
      case 'Groundcover': return <Leaf size={32} className="text-plant-muted" />;
      default: return <Flower2 size={32} className="text-plant-accent" />;
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
      className="bg-plant-card2 border border-plant-border rounded-lg p-4 cursor-pointer hover:bg-plant-card transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">{getPlantIcon()}</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-plant-text truncate">{plant.common_name}</h3>
          <p className="text-sm text-plant-muted italic truncate">{plant.botanical_name}</p>
          
          <div className="flex flex-wrap gap-2 mt-2">
            {plant.hardiness_zone && (
              <span className="text-xs bg-plant-border text-plant-text px-2 py-1 rounded">
                Zone {plant.hardiness_zone}
              </span>
            )}
            {plant.water_needs && (
              <span className="text-xs bg-plant-border text-plant-text px-2 py-1 rounded flex items-center gap-1">
                {getWaterIcon(plant.water_needs)} {plant.water_needs}
              </span>
            )}
            {plant.plant_type && (
              <span className="text-xs bg-plant-border text-plant-text px-2 py-1 rounded">
                {plant.plant_type}
              </span>
            )}
          </div>

          {plant.sun_requirement && (
            <p className="text-xs text-plant-muted mt-2 flex items-center gap-1">
              <Sun size={14} /> {plant.sun_requirement}
            </p>
          )}
        </div>
        {onAddClick && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddClick(plant);
            }}
            className="flex-shrink-0 touch-target bg-plant-accent text-white rounded-full p-2 hover:bg-plant-accent/90 transition-colors"
          >
            <span className="text-lg">+</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default PlantCard;
