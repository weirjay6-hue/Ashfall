const SAVE_KEY = 'ashfall_saves';
const AUTOSAVE_KEY = 'ashfall_autosave';
const MAX_SAVES = 3;
const SAVE_VERSION = 2;

export function getSaveSlots() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return Array(MAX_SAVES).fill(null);
    const saves = JSON.parse(raw);
    const slots = Array(MAX_SAVES).fill(null);
    for (let i = 0; i < MAX_SAVES; i++) {
      slots[i] = saves[i] || null;
    }
    return slots;
  } catch {
    return Array(MAX_SAVES).fill(null);
  }
}

export function saveGame(slotIndex, gameState) {
  try {
    const slots = getSaveSlots();
    const saveData = {
      version: SAVE_VERSION,
      savedAt: new Date().toISOString(),
      displayName: `${gameState.player.name} — Day ${gameState.world.day}, ${gameState.player.location.regionX},${gameState.player.location.regionY}`,
      characterName: gameState.player.name,
      characterLevel: gameState.player.level,
      daysSurvived: gameState.world.day,
      thumbnail: null,
      gameState: {
        player: gameState.player,
        world: gameState.world,
        factions: gameState.factions,
        gameLog: (gameState.gameLog || []).slice(-50),
      },
    };
    slots[slotIndex] = saveData;
    localStorage.setItem(SAVE_KEY, JSON.stringify(slots));
    return { success: true, message: `Game saved to Slot ${slotIndex + 1}.` };
  } catch (err) {
    return { success: false, message: `Save failed: ${err.message}` };
  }
}

export function loadGame(slotIndex) {
  try {
    const slots = getSaveSlots();
    const slot = slots[slotIndex];
    if (!slot) return { success: false, message: 'No save in this slot.' };
    return { success: true, gameState: slot.gameState };
  } catch (err) {
    return { success: false, message: `Load failed: ${err.message}` };
  }
}

export function deleteSave(slotIndex) {
  try {
    const slots = getSaveSlots();
    slots[slotIndex] = null;
    localStorage.setItem(SAVE_KEY, JSON.stringify(slots));
    return { success: true, message: 'Save deleted.' };
  } catch {
    return { success: false, message: 'Delete failed.' };
  }
}

export function downloadSave(slotIndex) {
  try {
    const slots = getSaveSlots();
    const slot = slots[slotIndex];
    if (!slot) return { success: false, message: 'No save in this slot.' };

    const json = JSON.stringify(slot, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = (slot.characterName || 'ashfall').replace(/[^a-zA-Z0-9]/g, '_');
    a.href = url;
    a.download = `ashfall_${safeName}_slot${slotIndex + 1}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return { success: true, message: 'Save downloaded.' };
  } catch (err) {
    return { success: false, message: `Download failed: ${err.message}` };
  }
}

export function importSaveFromFile(file, slotIndex) {
  return new Promise((resolve) => {
    if (!file || !file.name.endsWith('.json')) {
      resolve({ success: false, message: 'Please select a valid .json save file.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.gameState || !data.gameState.player || !data.gameState.world) {
          resolve({ success: false, message: 'Invalid Ashfall save file.' });
          return;
        }
        const slots = getSaveSlots();
        slots[slotIndex] = {
          ...data,
          savedAt: data.savedAt || new Date().toISOString(),
          importedAt: new Date().toISOString(),
        };
        localStorage.setItem(SAVE_KEY, JSON.stringify(slots));
        resolve({ success: true, message: `Save imported into Slot ${slotIndex + 1}.` });
      } catch {
        resolve({ success: false, message: 'Could not read save file. Is it corrupted?' });
      }
    };
    reader.onerror = () => resolve({ success: false, message: 'File read error.' });
    reader.readAsText(file);
  });
}

export function autosave(gameState) {
  try {
    const data = {
      savedAt: new Date().toISOString(),
      characterName: gameState.player.name,
      characterLevel: gameState.player.level,
      daysSurvived: gameState.world.day,
      gameState: {
        player: gameState.player,
        world: gameState.world,
        factions: gameState.factions,
        gameLog: (gameState.gameLog || []).slice(-30),
      },
    };
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(data));
  } catch {}
}

export function loadAutosave() {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearAllSaves() {
  localStorage.removeItem(SAVE_KEY);
  localStorage.removeItem(AUTOSAVE_KEY);
}
