export const exportDatabase = async (data) => {
  const jsonString = JSON.stringify(data, null, 2);
  const fileName = `wound-care-backup-${new Date().toISOString().split('T')[0]}.json`;

  try {
    // Try File System Access API
    if (window.showSaveFilePicker) {
      const handle = await window.showSaveFilePicker({
        suggestedName: fileName,
        types: [{
          description: 'JSON Database',
          accept: { 'application/json': ['.json'] },
        }],
      });
      const writable = await handle.createWritable();
      await writable.write(jsonString);
      await writable.close();
      return true;
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.warn('File System Access API failed, falling back to download:', err);
    } else {
      return false; // User cancelled
    }
  }

  // Fallback: Create a download link
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
};

export const importDatabase = async () => {
  try {
    let file;
    
    // Try File System Access API
    if (window.showOpenFilePicker) {
      const [handle] = await window.showOpenFilePicker({
        types: [{
          description: 'JSON Database',
          accept: { 'application/json': ['.json'] },
        }],
        multiple: false
      });
      file = await handle.getFile();
    } else {
      // Fallback: Input element
      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
          if (e.target.files.length > 0) {
            resolve(readFile(e.target.files[0]));
          } else {
            resolve(null);
          }
        };
        input.click();
      });
    }

    return await readFile(file);

  } catch (err) {
    if (err.name !== 'AbortError') {
      console.error('Error importing database:', err);
      alert('Fehler beim Laden der Datei: ' + err.message);
    }
    return null;
  }
};

const readFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        resolve(data);
      } catch (error) {
        reject(new Error('Ungültiges JSON-Format'));
      }
    };
    reader.onerror = () => reject(new Error('Fehler beim Lesen der Datei'));
    reader.readAsText(file);
  });
};

export const verifyPermission = async (fileHandle, withWrite = true) => {
  const options = {};
  if (withWrite) {
    options.mode = 'readwrite';
  }
  
  // Check if permission was already granted.
  if ((await fileHandle.queryPermission(options)) === 'granted') {
    return true;
  }
  
  // Request permission. If the user grants permission, return true.
  if ((await fileHandle.requestPermission(options)) === 'granted') {
    return true;
  }
  
  // The user didn't grant permission, so return false.
  return false;
};

export const saveToHandle = async (fileHandle, data) => {
  try {
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(data, null, 2));
    await writable.close();
    return true;
  } catch (error) {
    console.error('Error saving to file handle:', error);
    return false;
  }
};
