import React, { useState } from 'react';
import { Leaf, MapPin, ClipboardList, PlusCircle, Download } from 'lucide-react';
import OfflineBanner from './components/OfflineBanner';
import BrowseTab from './tabs/BrowseTab';
import ZoneTab from './tabs/ZoneTab';
import ListsTab from './tabs/ListsTab';
import NewListTab from './tabs/NewListTab';
import ExportTab from './tabs/ExportTab';

function App() {
  const [activeTab, setActiveTab] = useState('browse');
  const [activeListId, setActiveListId] = useState(null);

  const handleAddToList = async (plant) => {
    // Navigate to new list tab with the plant pre-selected
    setActiveTab('newlist');
  };

  const handleAddPlants = (listId) => {
    setActiveListId(listId);
    setActiveTab('newlist');
  };

  const handleExport = (list) => {
    setActiveTab('export');
  };

  const handleListCreated = (list) => {
    setActiveListId(list.id);
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'browse':
        return <BrowseTab onSelectPlant={() => {}} onAddToList={handleAddToList} />;
      case 'zone':
        return <ZoneTab onAddToList={handleAddToList} />;
      case 'lists':
        return <ListsTab onExport={handleExport} onAddPlants={handleAddPlants} />;
      case 'newlist':
        return <NewListTab activeListId={activeListId} onListCreated={handleListCreated} />;
      case 'export':
        return <ExportTab />;
      default:
        return <BrowseTab onSelectPlant={() => {}} onAddToList={handleAddToList} />;
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-plant-bg overflow-hidden">
      <OfflineBanner />
      
      {/* Main content area */}
      <div className="flex-1 overflow-hidden pt-[max(0px,env(safe-area-inset-top))]">
        {renderTab()}
      </div>

      {/* Bottom navigation */}
      <nav className="bg-plant-card border-t border-plant-border flex justify-around pb-[max(0px,env(safe-area-inset-bottom))]">
        <button
          onClick={() => setActiveTab('browse')}
          className={`flex-1 touch-target flex flex-col items-center justify-center gap-1 py-3 transition-colors ${
            activeTab === 'browse'
              ? 'bg-plant-card2 text-plant-accent'
              : 'text-plant-muted hover:text-plant-text'
          }`}
        >
          <Leaf size={24} />
          <span className="text-xs">Browse</span>
        </button>

        <button
          onClick={() => setActiveTab('zone')}
          className={`flex-1 touch-target flex flex-col items-center justify-center gap-1 py-3 transition-colors ${
            activeTab === 'zone'
              ? 'bg-plant-card2 text-plant-accent'
              : 'text-plant-muted hover:text-plant-text'
          }`}
        >
          <MapPin size={24} />
          <span className="text-xs">Zone</span>
        </button>

        <button
          onClick={() => setActiveTab('lists')}
          className={`flex-1 touch-target flex flex-col items-center justify-center gap-1 py-3 transition-colors ${
            activeTab === 'lists'
              ? 'bg-plant-card2 text-plant-accent'
              : 'text-plant-muted hover:text-plant-text'
          }`}
        >
          <ClipboardList size={24} />
          <span className="text-xs">Lists</span>
        </button>

        <button
          onClick={() => setActiveTab('newlist')}
          className={`flex-1 touch-target flex flex-col items-center justify-center gap-1 py-3 transition-colors ${
            activeTab === 'newlist'
              ? 'bg-plant-card2 text-plant-accent'
              : 'text-plant-muted hover:text-plant-text'
          }`}
        >
          <PlusCircle size={24} />
          <span className="text-xs">New List</span>
        </button>

        <button
          onClick={() => setActiveTab('export')}
          className={`flex-1 touch-target flex flex-col items-center justify-center gap-1 py-3 transition-colors ${
            activeTab === 'export'
              ? 'bg-plant-card2 text-plant-accent'
              : 'text-plant-muted hover:text-plant-text'
          }`}
        >
          <Download size={24} />
          <span className="text-xs">Export</span>
        </button>
      </nav>
    </div>
  );
}

export default App;
