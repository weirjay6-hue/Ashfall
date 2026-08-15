import React, { useRef, useState } from 'react';
import useGameStore from '../store/gameStore.js';
import { deleteSave, downloadSave, importSaveFromFile } from '../engine/save.js';

export default function SaveMenu() {
  const saveSlots = useGameStore(s => s.saveSlots);
  const saveToSlot = useGameStore(s => s.saveToSlot);
  const loadSave = useGameStore(s => s.loadSave);
  const returnToTitle = useGameStore(s => s.returnToTitle);

  const [importStatus, setImportStatus] = useState(null);
  const [importingSlot, setImportingSlot] = useState(null);
  const fileInputRef = useRef(null);

  function handleDelete(i) {
    if (!confirm(`Delete save in Slot ${i + 1}? This cannot be undone.`)) return;
    deleteSave(i);
    window.location.reload();
  }

  function handleDownload(i) {
    const result = downloadSave(i);
    if (!result.success) alert(result.message);
  }

  function handleImportClick(i) {
    setImportingSlot(i);
    setImportStatus(null);
    fileInputRef.current.value = '';
    fileInputRef.current.click();
  }

  async function handleFileSelected(e) {
    const file = e.target.files?.[0];
    if (!file || importingSlot === null) return;
    setImportStatus({ loading: true, slotIndex: importingSlot });
    const result = await importSaveFromFile(file, importingSlot);
    if (result.success) {
      setImportStatus({ success: true, message: result.message, slotIndex: importingSlot });
      setTimeout(() => window.location.reload(), 900);
    } else {
      setImportStatus({ success: false, message: result.message, slotIndex: importingSlot });
    }
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleFileSelected}
      />

      <div style={{ fontFamily: 'var(--font-title)', fontSize: '12px', color: 'var(--ash-amber)', letterSpacing: '0.15em', marginBottom: '16px' }}>
        SAVE / LOAD
      </div>

      {saveSlots.map((save, i) => (
        <div key={i} style={{ background: 'var(--ash-charcoal)', border: '1px solid var(--ash-border)', borderRadius: 'var(--radius-lg)', padding: '12px', marginBottom: '10px' }}>
          <div style={{ fontFamily: 'var(--font-title)', fontSize: '11px', color: 'var(--ash-text-dim)', marginBottom: '6px', letterSpacing: '0.1em' }}>
            SLOT {i + 1}
          </div>

          {importStatus?.slotIndex === i && (
            <div style={{
              fontSize: '11px',
              color: importStatus.loading ? 'var(--ash-amber)' : importStatus.success ? '#6ecf6e' : 'var(--ash-crimson-light)',
              marginBottom: '8px',
              padding: '4px 8px',
              background: 'rgba(255,255,255,0.04)',
              borderRadius: '4px',
            }}>
              {importStatus.loading ? '⏳ Importing...' : importStatus.success ? `✅ ${importStatus.message}` : `❌ ${importStatus.message}`}
            </div>
          )}

          {save ? (
            <>
              <div style={{ fontSize: '14px', color: 'var(--ash-text-bright)', marginBottom: '2px' }}>{save.characterName}</div>
              <div style={{ fontSize: '12px', color: 'var(--ash-text-dim)', marginBottom: '2px' }}>Level {save.characterLevel} · Day {save.daysSurvived}</div>
              <div style={{ fontSize: '11px', color: 'var(--ash-text-dim)', marginBottom: '10px' }}>
                {save.importedAt ? '📥 Imported · ' : ''}{new Date(save.savedAt).toLocaleString()}
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => loadSave(i)}>Load</button>
                <button className="btn btn-primary btn-sm" onClick={() => saveToSlot(i)}>Overwrite</button>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ borderColor: 'rgba(100,160,255,0.5)', color: '#80b0ff' }}
                  onClick={() => handleDownload(i)}
                  title="Download save as .json file"
                >
                  ⬇ Download
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ borderColor: 'rgba(100,200,100,0.5)', color: '#80d080' }}
                  onClick={() => handleImportClick(i)}
                  title="Import a .json save file into this slot"
                >
                  ⬆ Import
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ borderColor: 'var(--ash-crimson)', color: 'var(--ash-crimson-light)' }}
                  onClick={() => handleDelete(i)}
                >
                  Delete
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
              <span style={{ fontSize: '13px', color: 'var(--ash-text-dim)', fontStyle: 'italic' }}>Empty slot</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button className="btn btn-primary btn-sm" onClick={() => saveToSlot(i)}>Save Here</button>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ borderColor: 'rgba(100,200,100,0.5)', color: '#80d080' }}
                  onClick={() => handleImportClick(i)}
                  title="Import a .json save file"
                >
                  ⬆ Import
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      <div style={{
        background: 'rgba(100,160,255,0.06)',
        border: '1px solid rgba(100,160,255,0.2)',
        borderRadius: 'var(--radius-lg)',
        padding: '10px 14px',
        marginBottom: '16px',
        fontSize: '11px',
        color: 'var(--ash-text-dim)',
        lineHeight: '1.5',
      }}>
        <span style={{ color: '#80b0ff', fontWeight: 600 }}>⬇ Download</span> saves your game as a .json file to your device.
        <br />
        <span style={{ color: '#80d080', fontWeight: 600 }}>⬆ Import</span> loads a previously downloaded .json file into any slot.
      </div>

      <div className="divider" />

      <button
        className="btn btn-ghost"
        style={{ width: '100%', justifyContent: 'center', marginTop: '8px', borderColor: 'var(--ash-crimson)' }}
        onClick={() => { if (confirm('Return to title? Unsaved progress will be lost.')) returnToTitle(); }}
      >
        Return to Title
      </button>
    </div>
  );
}
