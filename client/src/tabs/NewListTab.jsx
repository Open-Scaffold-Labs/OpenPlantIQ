import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Plus, Trash2, Upload, FileText, CheckCircle, AlertCircle, X, Loader2 } from 'lucide-react';
import PlantCard from '../components/PlantCard';

function NewListTab({ activeListId, onListCreated }) {
  const [mode, setMode] = useState(activeListId ? 'adding' : 'create');
  const [listName, setListName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [zone, setZone] = useState('');
  const [currentListId, setCurrentListId] = useState(activeListId);
  const [searchTerm, setSearchTerm] = useState('');
  const [plants, setPlants] = useState([]);
  const [filteredPlants, setFilteredPlants] = useState([]);
  const [listItems, setListItems] = useState([]);

  // File import state
  const [importMode, setImportMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [importError, setImportError] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => { fetchPlants(); }, []);
  useEffect(() => { filterPlants(); }, [plants, searchTerm]);

  const fetchPlants = async () => {
    try {
      const res = await fetch('/api/plants');
      const data = await res.json();
      setPlants(data);
    } catch (error) {
      console.error('Error fetching plants:', error);
    }
  };

  const filterPlants = () => {
    const term = searchTerm.toLowerCase();
    const filtered = plants.filter(p =>
      p.common_name.toLowerCase().includes(term) ||
      p.botanical_name.toLowerCase().includes(term)
    );
    setFilteredPlants(filtered);
  };

  // ── File Import Logic ────────────────────────────────────────

  const handleFile = async (file) => {
    if (!file) return;
    const allowed = ['xlsx', 'xls', 'csv', 'tsv', 'docx', 'pdf'];
    const ext = file.name.split('.').pop().toLowerCase();
    if (!allowed.includes(ext)) {
      setImportError(`Unsupported file type: .${ext}. Use Word, Excel, CSV, or PDF.`);
      return;
    }

    setImportLoading(true);
    setImportError(null);
    setImportResults(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/import/parse', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setImportError(data.error || 'Failed to parse file');
        return;
      }

      setImportResults(data);
      // Auto-fill list name from filename if empty
      if (!listName) {
        const baseName = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
        setListName(baseName);
      }
    } catch (err) {
      setImportError(err.message || 'Failed to upload file');
    } finally {
      setImportLoading(false);
    }
  };

  const onDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };
  const onFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  };

  const toggleImportItem = (index) => {
    setImportResults(prev => {
      const items = [...prev.items];
      items[index] = { ...items[index], _excluded: !items[index]._excluded };
      return { ...prev, items };
    });
  };

  // ── Create list (with optional import) ───────────────────────

  const createList = async () => {
    if (!listName) {
      alert('List name is required');
      return;
    }

    try {
      // Create the list
      const res = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: listName,
          description: '',
          project_name: projectName || null,
          client_name: clientName || null,
          zone: zone || null,
        }),
      });
      const list = await res.json();

      // If we have import results, add matched plants to the list
      if (importResults?.items) {
        const itemsToAdd = importResults.items.filter(i => i.matched && !i._excluded);
        for (const item of itemsToAdd) {
          await fetch(`/api/lists/${list.id}/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              plant_id: item.plant.id,
              quantity: item.quantity || 1,
              size: item.size || null,
              spacing: item.spacing || null,
              notes: item.notes || null,
            }),
          });
        }
      }

      setCurrentListId(list.id);
      setMode('adding');
      setImportResults(null);
      setImportMode(false);
      onListCreated(list);
    } catch (error) {
      console.error('Error creating list:', error);
      alert('Failed to create list');
    }
  };

  const addPlantToList = async (plant) => {
    try {
      const res = await fetch(`/api/lists/${currentListId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plant_id: plant.id,
          quantity: 1,
          size: null,
          spacing: null,
          notes: null,
        }),
      });
      const item = await res.json();
      setListItems([...listItems, item]);
    } catch (error) {
      console.error('Error adding plant:', error);
    }
  };

  const removeItem = async (itemId) => {
    try {
      await fetch(`/api/lists/${currentListId}/items/${itemId}`, { method: 'DELETE' });
      setListItems(listItems.filter(item => item.id !== itemId));
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  // ── RENDER: Create mode ──────────────────────────────────────

  if (mode === 'create') {
    return (
      <div className="h-full flex flex-col bg-plant-bg overflow-hidden">
        <div className="bg-plant-card border-b border-plant-border p-4">
          <h1 className="text-xl font-bold text-plant-text">Create New List</h1>
          <p className="text-xs text-plant-muted">Build a plant schedule for your project</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* File import drop zone */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-plant-muted font-semibold">Import from File</label>
              {importResults && (
                <button
                  onClick={() => { setImportResults(null); setImportError(null); }}
                  className="text-xs text-plant-muted hover:text-plant-text flex items-center gap-1"
                >
                  <X size={12} /> Clear
                </button>
              )}
            </div>

            {!importResults && !importLoading && (
              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-plant-accent bg-plant-accent/10'
                    : 'border-plant-border hover:border-plant-accent/50 hover:bg-plant-card2'
                }`}
              >
                <Upload size={28} className="mx-auto mb-2 text-plant-muted" />
                <p className="text-sm text-plant-text font-medium">
                  Drop a file here or tap to browse
                </p>
                <p className="text-xs text-plant-muted mt-1">
                  Word, Excel, CSV, or PDF with plant names
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv,.tsv,.docx,.pdf"
                  onChange={onFileSelect}
                  className="hidden"
                />
              </div>
            )}

            {importLoading && (
              <div className="border border-plant-border rounded-lg p-6 text-center bg-plant-card2">
                <Loader2 size={28} className="mx-auto mb-2 text-plant-accent animate-spin" />
                <p className="text-sm text-plant-text">Parsing file and matching plants...</p>
              </div>
            )}

            {importError && (
              <div className="border border-red-500/30 rounded-lg p-3 bg-red-500/10">
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-red-300">{importError}</p>
                    <button
                      onClick={() => { setImportError(null); }}
                      className="text-xs text-red-400 hover:text-red-300 mt-1 underline"
                    >
                      Try again
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Import results preview */}
            {importResults && (
              <div className="border border-plant-border rounded-lg bg-plant-card2 overflow-hidden">
                <div className="p-3 border-b border-plant-border">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-plant-accent" />
                    <span className="text-sm text-plant-text font-medium">{importResults.filename}</span>
                  </div>
                  <div className="flex gap-3 mt-1">
                    <span className="text-xs text-green-400">
                      {importResults.summary.matched} matched
                    </span>
                    {importResults.summary.unmatched > 0 && (
                      <span className="text-xs text-yellow-400">
                        {importResults.summary.unmatched} unmatched
                      </span>
                    )}
                  </div>
                </div>

                <div className="max-h-48 overflow-y-auto divide-y divide-plant-border">
                  {importResults.items.map((item, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-3 px-3 py-2 ${
                        item._excluded ? 'opacity-40' : ''
                      }`}
                    >
                      <button
                        onClick={() => toggleImportItem(idx)}
                        className="flex-shrink-0"
                      >
                        {item.matched && !item._excluded ? (
                          <CheckCircle size={18} className="text-green-400" />
                        ) : item.matched && item._excluded ? (
                          <X size={18} className="text-plant-muted" />
                        ) : (
                          <AlertCircle size={18} className="text-yellow-500" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        {item.matched ? (
                          <>
                            <p className="text-sm text-plant-text truncate">
                              {item.plant.common_name}
                            </p>
                            <p className="text-xs text-plant-muted italic truncate">
                              {item.plant.botanical_name}
                            </p>
                          </>
                        ) : (
                          <p className="text-sm text-yellow-300 truncate">
                            {item.original_name}
                            <span className="text-xs text-yellow-500 ml-2">no match</span>
                          </p>
                        )}
                      </div>

                      {item.quantity > 1 && (
                        <span className="text-xs bg-plant-accent/20 text-plant-accent px-2 py-0.5 rounded flex-shrink-0">
                          ×{item.quantity}
                        </span>
                      )}
                      {item.size && (
                        <span className="text-xs text-plant-muted flex-shrink-0">{item.size}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Form fields */}
          <div>
            <label className="text-xs text-plant-muted block mb-2">List Name *</label>
            <input
              type="text"
              placeholder="e.g., Front Landscape"
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              className="w-full bg-plant-card2 border border-plant-border rounded px-3 py-2 text-plant-text placeholder-plant-muted outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-plant-muted block mb-2">Project Name (optional)</label>
            <input
              type="text"
              placeholder="e.g., Downtown Park Renovation"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full bg-plant-card2 border border-plant-border rounded px-3 py-2 text-plant-text placeholder-plant-muted outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-plant-muted block mb-2">Client Name (optional)</label>
            <input
              type="text"
              placeholder="e.g., City of Springfield"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full bg-plant-card2 border border-plant-border rounded px-3 py-2 text-plant-text placeholder-plant-muted outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-plant-muted block mb-2">Zone (optional)</label>
            <input
              type="text"
              placeholder="e.g., 6-7"
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              className="w-full bg-plant-card2 border border-plant-border rounded px-3 py-2 text-plant-text placeholder-plant-muted outline-none"
            />
          </div>
        </div>

        <div className="p-4 border-t border-plant-border">
          <button
            onClick={createList}
            className="w-full touch-target bg-plant-accent hover:bg-plant-accent/90 text-white font-semibold rounded-lg py-3 transition-colors"
          >
            {importResults?.summary?.matched > 0
              ? `Create List with ${importResults.items.filter(i => i.matched && !i._excluded).length} Plants`
              : 'Create List'}
          </button>
        </div>
      </div>
    );
  }

  // ── RENDER: Adding mode ──────────────────────────────────────

  return (
    <div className="h-full flex flex-col bg-plant-bg overflow-hidden">
      <div className="bg-plant-card border-b border-plant-border p-4">
        <h1 className="text-xl font-bold text-plant-text">{listItems.length} plants added</h1>
        <p className="text-xs text-plant-muted">Search and add plants to your list</p>
      </div>

      <div className="p-4 border-b border-plant-border">
        <input
          type="text"
          placeholder="Search plants..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-plant-card2 border border-plant-border rounded px-3 py-2 text-plant-text placeholder-plant-muted outline-none"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 gap-3">
          {filteredPlants.map(plant => (
            <PlantCard
              key={plant.id}
              plant={plant}
              onTap={() => {}}
              onAddClick={addPlantToList}
            />
          ))}
        </div>
      </div>

      {listItems.length > 0 && (
        <div className="border-t border-plant-border bg-plant-card2 max-h-32 overflow-y-auto">
          <div className="p-3 space-y-2">
            <p className="text-xs text-plant-muted font-semibold">Added Plants</p>
            {listItems.map(item => (
              <div key={item.id} className="flex items-center justify-between text-sm bg-plant-bg rounded p-2">
                <span className="text-plant-text truncate">
                  {plants.find(p => p.id === item.plant_id)?.common_name}
                </span>
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-red-400 hover:text-red-300 flex-shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default NewListTab;
