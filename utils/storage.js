const STORAGE_KEY = 'wound_care_pro_local_db';

export const saveToLocal = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    console.log('Auto-saved to local storage');
  } catch (error) {
    console.error('Failed to save to local storage:', error);
  }
};

export const loadFromLocal = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to load from local storage:', error);
    return null;
  }
};

export const clearLocal = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear local storage:', error);
  }
};
