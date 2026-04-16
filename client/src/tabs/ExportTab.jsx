import React, { useState, useEffect } from 'react';
import { Download, Share2 } from 'lucide-react';

function ExportTab() {
  const [lists, setLists] = useState([]);
  const [selectedListId, setSelectedListId] = useState('');
  const [selectedList, setSelectedList] = useState(null);

  useEffect(() => {
    fetchLists();
  }, []);

  const fetchLists = async () => {
    try {
      const res = await fetch('/api/lists');
      const data = await res.json();
      setLists(data);
      if (data.length > 0) {
        setSelectedListId(data[0].id);
        fetchListDetail(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching lists:', error);
    }
  };

  const fetchListDetail = async (id) => {
    try {
      const res = await fetch(`/api/lists/${id}`);
      const data = await res.json();
      setSelectedList(data);
    } catch (error) {
      console.error('Error fetching list detail:', error);
    }
  };

  const handleListChange = (e) => {
    const id = e.target.value;
    setSelectedListId(id);
    if (id) {
      fetchListDetail(id);
    }
  };

  const generatePDF = () => {
    if (!selectedList || !selectedList.items) {
      alert('No plants in list to export');
      return;
    }

    const date = new Date().toLocaleDateString();
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${selectedList.name} - Plant Schedule</title>
        <style>
          body {
            font-family: 'Times New Roman', serif;
            max-width: 8.5in;
            margin: 0.5in auto;
            color: #333;
            line-height: 1.5;
          }
          .header {
            text-align: center;
            margin-bottom: 0.5in;
            border-bottom: 3px solid #166534;
            padding-bottom: 0.25in;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            color: #0f1f12;
            font-weight: bold;
          }
          .header p {
            margin: 4px 0;
            font-size: 11px;
            color: #666;
          }
          .metadata {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.25in;
            margin-bottom: 0.25in;
            font-size: 11px;
          }
          .metadata-item {
            border-left: 3px solid #166534;
            padding-left: 8px;
          }
          .metadata-label {
            color: #999;
            font-size: 10px;
          }
          .metadata-value {
            font-weight: bold;
            color: #0f1f12;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 0.25in;
            font-size: 10px;
          }
          table th {
            background-color: #0f1f12;
            color: white;
            padding: 8px;
            text-align: left;
            font-weight: bold;
            border-bottom: 2px solid #166534;
          }
          table td {
            padding: 8px;
            border-bottom: 1px solid #ddd;
          }
          table tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .botanical-name {
            font-style: italic;
            color: #666;
          }
          .common-name {
            font-weight: bold;
            color: #0f1f12;
          }
          .summary {
            margin-top: 0.25in;
            padding-top: 0.25in;
            border-top: 1px solid #ddd;
            font-size: 11px;
            text-align: right;
          }
          .summary-value {
            font-weight: bold;
            color: #166534;
            font-size: 14px;
          }
          .footer {
            margin-top: 0.5in;
            padding-top: 0.25in;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 9px;
            color: #999;
          }
          @media print {
            body { margin: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>PLANT SCHEDULE</h1>
          <p>${selectedList.name}</p>
        </div>

        <div class="metadata">
          ${selectedList.project_name ? `<div class="metadata-item"><div class="metadata-label">PROJECT</div><div class="metadata-value">${selectedList.project_name}</div></div>` : ''}
          ${selectedList.client_name ? `<div class="metadata-item"><div class="metadata-label">CLIENT</div><div class="metadata-value">${selectedList.client_name}</div></div>` : ''}
          <div class="metadata-item"><div class="metadata-label">DATE</div><div class="metadata-value">${date}</div></div>
          <div class="metadata-item"><div class="metadata-label">ZONE</div><div class="metadata-value">${selectedList.zone || 'Not specified'}</div></div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 25%">Botanical Name</th>
              <th style="width: 20%">Common Name</th>
              <th style="width: 12%">Type</th>
              <th style="width: 10%">Qty</th>
              <th style="width: 10%">Size</th>
              <th style="width: 10%">Spacing</th>
              <th style="width: 8%">Water</th>
              <th style="width: 5%">Zone</th>
            </tr>
          </thead>
          <tbody>
            ${selectedList.items.map((item, idx) => `
              <tr>
                <td class="botanical-name">${item.botanical_name}</td>
                <td class="common-name">${item.common_name}</td>
                <td>${item.plant_type}</td>
                <td style="text-align: center">${item.quantity || 1}</td>
                <td>${item.size || '—'}</td>
                <td>${item.spacing || '—'}</td>
                <td>${item.water_needs || '—'}</td>
                <td>${item.hardiness_zone || '—'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="summary">
          <div>Total Plants: <span class="summary-value">${selectedList.items.reduce((sum, item) => sum + (item.quantity || 1), 0)}</span></div>
        </div>

        <div class="footer">
          <p>Prepared with Open Plant IQ — Part of the Open Landscape Architect Platform</p>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  const handleShare = () => {
    if (!selectedList) return;

    if (navigator.share) {
      navigator.share({
        title: `${selectedList.name} - Plant Schedule`,
        text: `Plant schedule with ${selectedList.items.length} plants`
      }).catch(err => console.log('Share failed:', err));
    } else {
      alert('Sharing not supported on this browser');
    }
  };

  return (
    <div className="h-full flex flex-col bg-plant-bg overflow-hidden">
      <div className="bg-plant-card border-b border-plant-border p-4">
        <h1 className="text-xl font-bold text-plant-text">Export Plant Schedule</h1>
        <p className="text-xs text-plant-muted">Generate PDF for your landscape design</p>
      </div>

      <div className="p-4 border-b border-plant-border space-y-3">
        <div>
          <label className="text-xs text-plant-muted block mb-2">Select List</label>
          <select
            value={selectedListId}
            onChange={handleListChange}
            className="w-full bg-plant-card2 border border-plant-border rounded px-3 py-2 text-plant-text outline-none"
          >
            <option value="">Choose a list...</option>
            {lists.map(list => (
              <option key={list.id} value={list.id}>
                {list.name} ({list.item_count} plants)
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedList ? (
        <>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="bg-plant-card2 border border-plant-border rounded-lg p-4 mb-4">
              <h2 className="font-bold text-plant-text text-lg mb-2">{selectedList.name}</h2>
              {selectedList.project_name && (
                <p className="text-sm text-plant-muted mb-1">Project: {selectedList.project_name}</p>
              )}
              {selectedList.client_name && (
                <p className="text-sm text-plant-muted mb-1">Client: {selectedList.client_name}</p>
              )}
              {selectedList.zone && (
                <p className="text-sm text-plant-muted mb-1">Zone: {selectedList.zone}</p>
              )}
              <p className="text-sm text-plant-accent font-semibold mt-2">
                {selectedList.items.length} plant{selectedList.items.length !== 1 ? 's' : ''} • {selectedList.items.reduce((sum, item) => sum + (item.quantity || 1), 0)} total quantity
              </p>
            </div>

            <div className="bg-plant-card2 border border-plant-border rounded-lg p-4 mb-4">
              <h3 className="font-bold text-plant-text mb-3">Plants</h3>
              <div className="space-y-2 text-sm">
                {selectedList.items.map((item, idx) => (
                  <div key={item.id} className="flex items-start gap-2">
                    <span className="text-plant-muted flex-shrink-0 w-6">{idx + 1}.</span>
                    <div className="flex-1">
                      <p className="font-semibold text-plant-text">{item.common_name}</p>
                      <p className="text-plant-muted italic text-xs">{item.botanical_name}</p>
                      <p className="text-plant-muted text-xs mt-1">
                        Qty: {item.quantity || 1} {item.size ? `• Size: ${item.size}` : ''} {item.spacing ? `• Spacing: ${item.spacing}` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-plant-border space-y-2">
            <button
              onClick={generatePDF}
              className="w-full touch-target bg-plant-accent hover:bg-plant-accent/90 text-white font-semibold rounded-lg py-3 transition-colors flex items-center justify-center gap-2"
            >
              <Download size={18} /> Generate PDF
            </button>
            <button
              onClick={handleShare}
              className="w-full touch-target bg-plant-card2 border border-plant-accent text-plant-accent hover:bg-plant-card font-semibold rounded-lg py-3 transition-colors flex items-center justify-center gap-2"
            >
              <Share2 size={18} /> Share List
            </button>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-center text-plant-muted">No lists available</p>
        </div>
      )}
    </div>
  );
}

export default ExportTab;
