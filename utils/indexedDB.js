const DB_NAME = 'WoundCareProDB';
const DB_VERSION = 1;
const STORE_NAME = 'fileHandles';

export const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('IndexedDB error:', event.target.error);
      reject('Error opening IndexedDB');
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
};

export const storeFileHandle = async (handle) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(handle, 'dbHandle');

    request.onsuccess = () => resolve(true);
    request.onerror = () => reject('Error storing file handle');
  });
};

export const getFileHandle = async () => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get('dbHandle');

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject('Error retrieving file handle');
  });
};
