import React, { useState, useEffect } from 'react';
import { ChevronLeft, Trash2, Plus, Download } from 'lucide-react';

function ListsTab({ onExport, onAddPlants }) {
  const [lists, setLists] = useState([]);
  const [selectedList, setSelectedList] = useState(null);
  const [selectedListDetail, setSelectedListDetail] = useState(null);

  useEffect(() => {
    fetchLists();
  }, []);

  const fetchLists = async () => {
    try {
      const res = await fetch('/api/lists');
      const data = await res.json();
      setLists(data);
    } catch (error) {
      console.error('Error fetching lists:', error);
    }
  };

  const fetchListDetail = async (id) => {
    try {
      const res = await fetch(`/api/lists/${id}`);
      const data = await res.json();
      setSelectedListDetail(data);
      setSelectedList(id);
    } catch (error) {
      console.error('Error fetching list detail:', error);
    }
  };
  const deleteList = async (id) => {
    if (confirm('Delete this list?')) {
      try {
        await fetch(`/api/lists/${id}`, { method: 'DELETE' });
        fetchLists();
        setSelectedList(null);
        setSelectedListDetail(null);
      } catch (error) {
        console.error('Error deleting list:', error);
      }
    }
  };

  const removeItem = async (listId, itemId) => {
    try {
      await fetch(`/api/lists/${listId}/items/${itemId}`, { method: 'DELETE' });
      fetchListDetail(listId);
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const updateQuantity = async (listId, itemId, quantity) => {
    try {
      await fetch(`/api/lists/${listId}/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: parseInt(quantity) })
      });
      fetchListDetail(listId);
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };
  if (selectedList && selectedListDetail) {
    const totalQuantity = selectedListDetail.items.reduce((sum, item) => sum + (item.quantity || 1), 0);

    return (
      <div className="h-full flex flex-col bg-plant-bg overflow-hidden">
        <div className="bg-plant-card border-b border-plant-border p-4 flex items-center gap-3">
          <button onClick={() => setSelectedList(null)} className="touch-target">
            <ChevronLeft size={24} className="text-plant-accent" />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-plant-text">{selectedListDetail.name}</h1>
            {selectedListDetail.project_name && (
              <p className="text-xs text-plant-muted">{selectedListDetail.project_name}</p>
            )}
            {selectedListDetail.client_name && (
              <p className="text-xs text-plant-muted">{selectedListDetail.client_name}</p>
            )}
          </div>
          <button
            onClick={() => deleteList(selectedListDetail.id)}
            className="touch-target text-red-400 hover:text-red-300"
          >
            <Trash2 size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {selectedListDetail.items.length === 0 ? (
            <p className="text-center text-plant-muted py-8">No plants in this list</p>
          ) : (
            <div className="space-y-3">
              {selectedListDetail.items.map((item, idx) => (
                <div key={item.id} className="bg-plant-card2 border border-plant-border rounded-lg overflow-hidden">
                  <div className="flex">
                    {/* Plant photo */}
                    {item.image_url && (
                      <div className="flex-shrink-0 w-20 h-20">
                        <img
                          src={item.image_url}
                          alt={item.common_name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => { e.target.parentElement.style.display = 'none'; }}
                        />
                      </div>
                    )}
                    <div className="flex-1 p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-semibold text-plant-text">{item.common_name}</p>
                          <p className="text-sm text-plant-muted italic">{item.botanical_name}</p>
                          <p className="text-xs text-plant-muted mt-1">{item.plant_type}</p>
                        </div>                        <button
                          onClick={() => removeItem(selectedListDetail.id, item.id)}
                          className="touch-target text-red-400 hover:text-red-300"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <label className="text-xs text-plant-muted block mb-1">Qty</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity || 1}
                        onChange={(e) => updateQuantity(selectedListDetail.id, item.id, e.target.value)}
                        className="w-full bg-plant-bg border border-plant-border rounded px-2 py-1 text-plant-text text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-plant-muted block mb-1">Size</label>
                      <input
                        type="text"
                        placeholder="e.g. 5 gal"
                        defaultValue={item.size || ''}
                        className="w-full bg-plant-bg border border-plant-border rounded px-2 py-1 text-plant-text text-sm"
                      />
                    </div>
                  </div>                  {item.spacing && (
                    <p className="text-xs text-plant-muted mt-2">Spacing: {item.spacing}</p>
                  )}
                  {item.notes && (
                    <p className="text-xs text-plant-muted mt-2">Notes: {item.notes}</p>
                  )}
                    </div>
                  </div>
                </div>
              ))}
              <p className="text-sm font-semibold text-plant-accent mt-4 text-center">
                Total Plants: {totalQuantity}
              </p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-plant-border space-y-2">
          <button
            onClick={() => {
              onAddPlants(selectedList);
            }}
            className="w-full touch-target bg-plant-card2 border border-plant-accent text-plant-accent hover:bg-plant-card font-semibold rounded-lg py-3 transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={18} /> Add Plants
          </button>          <button
            onClick={() => {
              onExport(selectedListDetail);
            }}
            className="w-full touch-target bg-plant-accent hover:bg-plant-accent/90 text-white font-semibold rounded-lg py-3 transition-colors flex items-center justify-center gap-2"
          >
            <Download size={18} /> Export PDF
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-plant-bg overflow-hidden">
      <div className="bg-plant-card border-b border-plant-border p-4">
        <h1 className="text-xl font-bold text-plant-text mb-1">My Plant Lists</h1>
        <p className="text-xs text-plant-muted">{lists.length} list{lists.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {lists.length === 0 ? (
          <p className="text-center text-plant-muted py-8">No lists yet. Create one in the "New List" tab.</p>
        ) : (
          <div className="space-y-3">
            {lists.map(list => (
              <div
                key={list.id}
                onClick={() => fetchListDetail(list.id)}
                className="bg-plant-card2 border border-plant-border rounded-lg p-4 cursor-pointer hover:bg-plant-card transition-colors"
              >
                <h3 className="font-semibold text-plant-text">{list.name}</h3>
                {list.project_name && (
                  <p className="text-sm text-plant-muted">Project: {list.project_name}</p>
                )}
                {list.client_name && (
                  <p className="text-sm text-plant-muted">Client: {list.client_name}</p>
                )}
                <div className="flex justify-between mt-2 text-xs text-plant-muted">
                  <span>{list.item_count} plant{list.item_count !== 1 ? 's' : ''}</span>
                  <span>{new Date(list.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ListsTab;