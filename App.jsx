import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Activity, 
  Calendar, 
  ArrowLeft, 
  MapPin, 
  Trash2,
  FileText,
  Save,
  Upload,
  Download,
  Database,
  Cloud,
  CloudOff,
  AlertTriangle,
  MoreVertical,
  Lock
} from 'lucide-react';

// --- Firebase Imports & Config ---
/*
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken,
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  deleteDoc,
  getDocs, 
  query, 
  where, 
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
*/

// --- Custom Components ---
import { STATUS_COLORS, STATUS_TRANSLATION } from './utils/constants';
import BodyMap from './components/BodyMap';
import NewPatientModal from './components/NewPatientModal';
import NewWoundModal from './components/NewWoundModal';
import AssessmentCard from './components/AssessmentCard';
import WoundAssessmentForm from './components/WoundAssessmentForm';
import ConfirmationModal from './components/ConfirmationModal';
import LocalModeSetupModal from './components/LocalModeSetupModal';
import PasswordModal from './components/PasswordModal';
import ConnectionSettingsModal from './components/ConnectionSettingsModal';
import ChangePasswordModal from './components/ChangePasswordModal';
import { formatDate } from './utils/dateHelpers';
import { saveToLocal, loadFromLocal } from './utils/storage';
import { exportDatabase, importDatabase, verifyPermission, saveToHandle } from './utils/fileSystem';
import { storeFileHandle, getFileHandle } from './utils/indexedDB';
import { generateUUID } from './utils/helpers';
import { encryptData, decryptData } from './utils/crypto';

// --- Configuration ---
/*
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
*/
const appId = typeof __app_id !== 'undefined' ? __app_id : 'wound-care-demo';

// --- Main Application Component ---

export default function WoundCareApp() {
  const [user, setUser] = useState(null);
  const [isLocalMode, setIsLocalMode] = useState(true);
  const [fileHandle, setFileHandle] = useState(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Security & Encryption State
  const [password, setPassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordModalMode, setPasswordModalMode] = useState('unlock'); // 'unlock' | 'setup'
  const [passwordError, setPasswordError] = useState('');
  const [cryptoLoading, setCryptoLoading] = useState(false);
  const [rawEncryptedData, setRawEncryptedData] = useState(null);

  // Storage Engine State (Local vs Synology Live)
  const [storageMode, setStorageMode] = useState(() => {
    return localStorage.getItem('wound_care_storage_mode') || 'local'; // 'local' | 'synology'
  });
  const [synologyUrl, setSynologyUrl] = useState(() => {
    return localStorage.getItem('wound_care_synology_url') || 'http://localhost:3000';
  });
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  
  // Navigation State
  const [currentView, setCurrentView] = useState('PATIENT_LIST'); 
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedWound, setSelectedWound] = useState(null);
  const [isEditingWound, setIsEditingWound] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState(null);
  
  // Modal States
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);
  const [showNewWoundModal, setShowNewWoundModal] = useState(false);
  const [showLocalModeSetupModal, setShowLocalModeSetupModal] = useState(false);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  
  // Deletion States
  const [showWoundDeleteConfirm, setShowWoundDeleteConfirm] = useState(false);
  const [showAssessmentDeleteConfirm, setShowAssessmentDeleteConfirm] = useState(false);
  const [assessmentToDelete, setAssessmentToDelete] = useState(null);
  const [showPatientDeleteConfirm, setShowPatientDeleteConfirm] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState(null);

  const [tempWoundData, setTempWoundData] = useState(null); // Stores coords + name

  // Data State
  const [patients, setPatients] = useState([]);
  const [wounds, setWounds] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- Authentication & Setup ---
  useEffect(() => {
    // Check for test mode
    const isTestMode = import.meta.env.VITE_TEST_MODE === 'true' || 
                       new URLSearchParams(window.location.search).get('test_mode') === 'true';

    if (isTestMode) {
      console.warn("⚠️ Application running in TEST MODE. Firebase Auth is bypassed.");
      setUser({ 
        uid: 'test-user-id', 
        isAnonymous: true, 
        email: 'test@example.com' 
      });
      return;
    }

    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.warn("Auth failed (expected in demo), falling back to demo user:", error);
        setUser({ uid: 'demo-user', isAnonymous: true, email: 'demo@example.com' });
      }
    };
    
    /*
    if (!isLocalMode) {
      initAuth();
      const unsubscribe = onAuthStateChanged(auth, (u) => {
        if (u) setUser(u);
      });
      return () => unsubscribe();
    } else {
    */
      // Local Mode User
      setUser({ uid: 'local-user', isAnonymous: true, email: 'local@offline.com' });
    // }
  }, [isLocalMode]);

  // --- Local Mode Effects ---

  // 1. Initialize Local Mode (Load Handle or Prompt)
  useEffect(() => {
    const initLocalMode = async () => {
      if (!isLocalMode) return;

      // 1. Try to get existing handle from IndexedDB
      try {
        const existingHandle = await getFileHandle();
        
        if (existingHandle) {
          // Verify permission
          const hasPermission = await verifyPermission(existingHandle, true);
          if (hasPermission) {
            setFileHandle(existingHandle);
            return;
          }
        }
      } catch (e) {
        console.warn("Could not retrieve file handle:", e);
      }

      // 2. If no handle or no permission, prompt user via Modal
      const hasAcknowledged = localStorage.getItem('local_mode_browser_only_ack');
      if (hasAcknowledged) {
        return; // User previously acknowledged and chose fallback/standard
      }

      const hasApi = 'showSaveFilePicker' in window;
      
      if (hasApi) {
        if (window.showSaveFilePicker) {
            setShowLocalModeSetupModal(true);
        }
      } else {
        setShowLocalModeSetupModal(true);
      }
    };

    initLocalMode();
  }, [isLocalMode]);

  const handleLocalModeSetupConfirm = async () => {
    // If API is missing, this is just an acknowledgement
    if (!('showSaveFilePicker' in window)) {
       localStorage.setItem('local_mode_browser_only_ack', 'true');
       setShowLocalModeSetupModal(false);
       return;
    }

    setLoading(true);
    try {
      const newHandle = await window.showSaveFilePicker({
        suggestedName: `wound-care-local-db.json`,
        types: [{
          description: 'JSON Database',
          accept: { 'application/json': ['.json'] },
        }],
      });
      
      await storeFileHandle(newHandle);
      setFileHandle(newHandle);
      
      // Initial save to establish the file
      await saveToHandle(newHandle, { patients, wounds, entries });
      localStorage.setItem('local_mode_browser_only_ack', 'true');
      setShowLocalModeSetupModal(false);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error("Error picking file:", err);
        alert("Fehler bei der Dateiauswahl.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleContinueWithDefault = () => {
    setShowLocalModeSetupModal(false);
    localStorage.setItem('local_mode_browser_only_ack', 'true');
  };

  // Fetch data from Synology API
  const loadSynologyData = async () => {
    try {
      setCryptoLoading(true);
      const urlPat = `${synologyUrl}/api/patients`;
      const urlWnd = `${synologyUrl}/api/wounds`;
      const urlEnt = `${synologyUrl}/api/entries`;

      const [resPatients, resWounds, resEntries] = await Promise.all([
        fetch(urlPat),
        fetch(urlWnd),
        fetch(urlEnt)
      ]);

      if (!resPatients.ok || !resWounds.ok || !resEntries.ok) {
        throw new Error('Server antwortete mit einem Fehlerstatus.');
      }

      const pData = await resPatients.json();
      const wData = await resWounds.json();
      const eData = await resEntries.json();

      setPatients(pData);
      setWounds(wData);
      setEntries(eData);
      setIsDataLoaded(true);
      setShowPasswordModal(false);
    } catch (err) {
      console.error(err);
      alert("Fehler beim Laden vom Synology Server:\n" + err.message + "\n\nDie App wird im Offline-Modus gestufen.");
      setStorageMode('local');
      localStorage.setItem('wound_care_storage_mode', 'local');
    } finally {
      setCryptoLoading(false);
    }
  };

  // 2. Load from Local Storage on Init (Fallback & Initial Load)
  useEffect(() => {
    if (storageMode === 'synology') {
      loadSynologyData();
    } else {
      if (isLocalMode) {
        const dbData = loadFromLocal();
        if (dbData) {
          if (dbData.ciphertext) {
            // Encrypted database found. Show unlock prompt.
            setRawEncryptedData(dbData);
            setPasswordModalMode('unlock');
            setShowPasswordModal(true);
          } else {
            // Plaintext database found (legacy data transition).
            // Prompt user to set a password to encrypt this existing data.
            setRawEncryptedData(dbData);
            setPasswordModalMode('setup');
            setShowPasswordModal(true);
          }
        } else {
          // Brand new database. Force user to set a password on startup to secure future inputs.
          setPasswordModalMode('setup');
          setShowPasswordModal(true);
        }
      }
    }
  }, [isLocalMode, storageMode]);

  // Handle password prompt submissions
  const handlePasswordSubmit = async (pwd) => {
    setPasswordError('');
    setCryptoLoading(true);

    try {
      if (passwordModalMode === 'setup') {
        // Enrolling new password!
        setPassword(pwd);
        
        // If there was legacy plaintext data in memory, encrypt and save it now
        if (rawEncryptedData && !rawEncryptedData.ciphertext) {
          const plainText = JSON.stringify(rawEncryptedData);
          const encrypted = await encryptData(plainText, pwd);
          saveToLocal(encrypted);
          if (fileHandle) {
            await saveToHandle(fileHandle, encrypted);
          }
          // Load the database state
          if (rawEncryptedData.patients) setPatients(rawEncryptedData.patients);
          if (rawEncryptedData.wounds) setWounds(rawEncryptedData.wounds);
          if (rawEncryptedData.entries) setEntries(rawEncryptedData.entries);
        } else {
          // New empty database
          setPatients([]);
          setWounds([]);
          setEntries([]);
          
          // Save an empty encrypted shell so it doesn't prompt for setup again on next boot
          const plainText = JSON.stringify({ patients: [], wounds: [], entries: [] });
          const encrypted = await encryptData(plainText, pwd);
          saveToLocal(encrypted);
        }

        setIsDataLoaded(true);
        setShowPasswordModal(false);
      } else {
        // Unlocking existing database
        if (!rawEncryptedData || !rawEncryptedData.ciphertext) {
          throw new Error('Keine verschlüsselten Daten gefunden.');
        }

        const decryptedText = await decryptData(rawEncryptedData, pwd);
        const parsed = JSON.parse(decryptedText);

        setPassword(pwd);
        setPatients(parsed.patients || []);
        setWounds(parsed.wounds || []);
        setEntries(parsed.entries || []);
        setIsDataLoaded(true);
        setShowPasswordModal(false);
      }
    } catch (err) {
      console.error(err);
      if (passwordModalMode === 'unlock') {
        setPasswordError('Falsches Passwort. Bitte versuchen Sie es erneut.');
      } else {
        setPasswordError('Fehler beim Einrichten der Verschlüsselung: ' + err.message);
      }
    } finally {
      setCryptoLoading(false);
    }
  };

  // Save Settings handler
  const handleSaveConnectionSettings = (mode, url) => {
    setStorageMode(mode);
    setSynologyUrl(url);
    localStorage.setItem('wound_care_storage_mode', mode);
    localStorage.setItem('wound_care_synology_url', url);
    setShowSettingsModal(false);
    setIsDataLoaded(false);
  };

  const handleChangePassword = async (newPassword) => {
    try {
      setCryptoLoading(true);
      const plainText = JSON.stringify({ patients, wounds, entries });
      const encrypted = await encryptData(plainText, newPassword);
      
      saveToLocal(encrypted);
      if (fileHandle) {
        await saveToHandle(fileHandle, encrypted);
      }
      
      setPassword(newPassword);
      setShowChangePasswordModal(false);
      alert("Passwort erfolgreich geändert! Ab dem nächsten Start müssen Sie das neue Passwort verwenden.");
    } catch (err) {
      console.error(err);
      alert("Fehler beim Ändern des Passworts: " + err.message);
    } finally {
      setCryptoLoading(false);
    }
  };

  // 3. Auto-Save (File System + LocalStorage Fallback)
  useEffect(() => {
    // Only save if data is loaded AND password is set AND we are in local mode
    if (!isLocalMode || !isDataLoaded || !password || storageMode === 'synology') return;

    const saveData = async () => {
      try {
        const plainText = JSON.stringify({ patients, wounds, entries });
        const encrypted = await encryptData(plainText, password);
        
        saveToLocal(encrypted);

        if (fileHandle) {
          await saveToHandle(fileHandle, encrypted);
        }
      } catch (err) {
        console.error("Fehler beim automatischen Verschlüsseln/Speichern:", err);
      }
    };

    const timeoutId = setTimeout(saveData, 1000); // 1s debounce
    return () => clearTimeout(timeoutId);

  }, [patients, wounds, entries, isLocalMode, fileHandle, password, isDataLoaded, storageMode]);

  // --- Data Fetching ---
  
  /*
  // Fetch Patients
  useEffect(() => {
    if (!user || isLocalMode) return;
    
    try {
      const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'patients'));
      const unsub = onSnapshot(q, (snapshot) => {
        const pList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setPatients(pList);
      }, (err) => {
        console.error("Err fetching patients (using mock data)", err);
        setPatients([
          { id: '1', name: 'Max Mustermann', dob: '1960-05-12', mrn: 'MRN-1234' },
          { id: '2', name: 'Erika Musterfrau', dob: '1955-08-23', mrn: 'MRN-5678' }
        ]);
      });
      return () => unsub();
    } catch (e) {
       console.error("Setup failed", e);
       setPatients([
          { id: '1', name: 'Max Mustermann', dob: '1960-05-12', mrn: 'MRN-1234' },
          { id: '2', name: 'Erika Musterfrau', dob: '1955-08-23', mrn: 'MRN-5678' }
       ]);
    }
  }, [user, isLocalMode]);

  // Fetch Wounds for Selected Patient
  useEffect(() => {
    if (!user || !selectedPatient || isLocalMode) return;
    setLoading(true);
    const q = query(
      collection(db, 'artifacts', appId, 'public', 'data', 'wounds'), 
      where('patientId', '==', selectedPatient.id)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const wList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setWounds(wList);
      setLoading(false);
    }, (err) => console.error("Err fetching wounds", err));
    return () => unsub();
  }, [user, selectedPatient, isLocalMode]);

  // Fetch Entries for Selected Wound
  useEffect(() => {
    if (!user || !selectedWound || isLocalMode) return;
    setLoading(true);
    const q = query(
      collection(db, 'artifacts', appId, 'public', 'data', 'assessments'),
      where('woundId', '==', selectedWound.id)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const eList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      // Robust sort handling both Firestore Timestamps and ISO strings
      eList.sort((a, b) => {
        const dateA = a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(a.createdAt);
        const dateB = b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : new Date(b.createdAt);
        return dateB - dateA;
      });
      setEntries(eList);
      setLoading(false);
    }, (err) => console.error("Err fetching entries", err));
    return () => unsub();
  }, [user, selectedWound, isLocalMode]);
  */

  // --- Action Handlers ---

  const handleAddPatient = () => {
    setShowNewPatientModal(true);
  };

  const handleSavePatient = async (patientData) => {
    if (!user) return;

    // if (isLocalMode) {
    const newPatient = {
      id: generateUUID(),
      name: patientData.name,
      dob: patientData.dob,
      mrn: `MRN-${Math.floor(Math.random() * 10000)}`,
      createdAt: new Date().toISOString()
    };
    
    if (storageMode === 'synology') {
      try {
        await fetch(`${synologyUrl}/api/patients`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newPatient)
        });
      } catch (err) {
        console.error("Synology Save Patient Error:", err);
        alert("Speichern auf Synology fehlgeschlagen.");
      }
    }

    setPatients(prev => [...prev, newPatient]);
    setShowNewPatientModal(false);
    return;
    // }

    /*
    try {
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Request timed out (10s). Check your network connection.")), 10000)
      );

      await Promise.race([
        addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'patients'), {
          name: patientData.name,
          dob: patientData.dob,
          mrn: `MRN-${Math.floor(Math.random() * 10000)}`,
          createdAt: serverTimestamp()
        }),
        timeout
      ]);
    } catch (error) {
      console.error("Error adding patient:", error);
      alert("Fehler beim Speichern: " + error.message);
    } finally {
      setShowNewPatientModal(false);
    }
    */
  };

  const handleMapClick = (data) => {
    if (!selectedPatient) return;
    setTempWoundData(data); // Contains x, y, and optional partName
    setShowNewWoundModal(true);
  };

  const handleSaveWound = async (locationName) => {
    if (!selectedPatient || !tempWoundData) return;

    // if (isLocalMode) {
    const newWound = {
      id: generateUUID(),
      patientId: selectedPatient.id,
      locationName,
      x: tempWoundData.x,
      y: tempWoundData.y,
      view: tempWoundData.view || 'front',
      status: 'active',
      createdAt: new Date().toISOString()
    };
    
    if (storageMode === 'synology') {
      try {
        await fetch(`${synologyUrl}/api/wounds`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newWound)
        });
      } catch (err) {
        console.error("Synology Save Wound Error:", err);
        alert("Speichern der Wunde auf Synology fehlgeschlagen.");
      }
    }

    setWounds(prev => [...prev, newWound]);
    setSelectedWound(newWound);
    setTempWoundData(null);
    setIsEditingWound(true);
    setShowNewWoundModal(false);
    return;
    // }

    /*
    const newWound = {
      patientId: selectedPatient.id,
      locationName,
      x: tempWoundData.x,
      y: tempWoundData.y,
      view: tempWoundData.view || 'front',
      status: 'active',
      createdAt: serverTimestamp()
    };

    try {
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Request timed out (5s)")), 5000)
      );

      const docRef = await Promise.race([
        addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'wounds'), newWound),
        timeout
      ]);

      setSelectedWound({ ...newWound, id: docRef.id });
      setTempWoundData(null);
      setIsEditingWound(true);
      setCurrentView('WOUND_FORM');
    } catch (error) {
      console.error("Error saving wound:", error);
      alert("Fehler beim Speichern: " + error.message);
    } finally {
      setShowNewWoundModal(false);
    }
    */
  };

  const handleSaveAssessment = async (formData) => {
    if (!user || !selectedWound) return;

    if (!selectedPatient) {
      console.error("Critical Error: No patient selected when saving assessment");
      alert("Fehler: Kein Patient ausgewählt. Bitte laden Sie die Seite neu.");
      return;
    }

    // if (isLocalMode) {
    if (editingAssessment) {
      // Update existing entry
      const updatedEntry = { ...editingAssessment, ...formData };
      
      if (storageMode === 'synology') {
        try {
          await fetch(`${synologyUrl}/api/entries`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedEntry)
          });
        } catch (err) {
          console.error("Synology Update Assessment Error:", err);
          alert("Doku-Update auf Synology fehlgeschlagen.");
        }
      }

      setEntries(prev => prev.map(e => e.id === editingAssessment.id ? updatedEntry : e));
    } else {
      // Create new entry
      const newEntry = {
        id: generateUUID(),
        ...formData,
        woundId: selectedWound.id,
        patientId: selectedPatient.id,
        authorId: user.uid,
        createdAt: new Date().toISOString()
      };

      if (storageMode === 'synology') {
        try {
          await fetch(`${synologyUrl}/api/entries`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newEntry)
          });
        } catch (err) {
          console.error("Synology Create Assessment Error:", err);
          alert("Speichern der Doku auf Synology fehlgeschlagen.");
        }
      }

      setEntries(prev => [newEntry, ...prev]);
    }
    setIsEditingWound(false);
    setEditingAssessment(null);
    return;
    // }
    
    /*
    try {
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Request timed out (5s)")), 5000)
      );

      await Promise.race([
        addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'assessments'), {
          ...formData,
          woundId: selectedWound.id,
          patientId: selectedPatient.id,
          authorId: user.uid,
          createdAt: serverTimestamp()
        }),
        timeout
      ]);

      setIsEditingWound(false);
      setCurrentView('WOUND_HISTORY');
    } catch (error) {
      console.error("Error saving assessment:", error);
      alert("Fehler beim Speichern: " + error.message);
    }
    */
  };

  // --- Deletion Handlers ---

  const handleDeleteWound = async () => {
    if (!selectedWound || !user) return;

    setLoading(true);

    if (storageMode === 'synology') {
      try {
        await fetch(`${synologyUrl}/api/wounds/${selectedWound.id}`, {
          method: 'DELETE'
        });
      } catch (err) {
        console.error("Synology Delete Wound Error:", err);
      }
    }

    // Local Delete
    setEntries(prev => prev.filter(e => e.woundId !== selectedWound.id));
    setWounds(prev => prev.filter(w => w.id !== selectedWound.id));
    setSelectedWound(null);
    setLoading(false);
    setShowWoundDeleteConfirm(false);
    return;
    // }

    /*
    try {
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Request timed out (5s)")), 5000)
      );

      // 1. Delete all assessments associated with this wound (Clean up)
      const q = query(
        collection(db, 'artifacts', appId, 'public', 'data', 'assessments'),
        where('woundId', '==', selectedWound.id)
      );
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref));
      
      await Promise.race([
        Promise.all([...deletePromises, deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'wounds', selectedWound.id))]),
        timeout
      ]);

      // 3. Reset UI - Success path
      setSelectedWound(null);
      setCurrentView('PATIENT_DETAIL'); // Go back to patient dashboard
    } catch (error) {
      console.error("Error deleting wound:", error);
      alert("Fehler beim Löschen: " + error.message);
    } finally {
      setLoading(false);
      setShowWoundDeleteConfirm(false); // Ensure modal closes
    }
    */
  };

  const handleDeleteAssessmentRequest = (assessmentId) => {
    setAssessmentToDelete(assessmentId);
    setShowAssessmentDeleteConfirm(true);
  };

  const handleConfirmDeleteAssessment = async () => {
    if (!user || !assessmentToDelete) return;
    
    setLoading(true);

    if (storageMode === 'synology') {
      try {
        await fetch(`${synologyUrl}/api/entries/${assessmentToDelete}`, {
          method: 'DELETE'
        });
      } catch (err) {
        console.error("Synology Delete Assessment Error:", err);
      }
    }

    setEntries(prev => prev.filter(e => e.id !== assessmentToDelete));
    setAssessmentToDelete(null);
    setLoading(false);
    setShowAssessmentDeleteConfirm(false);
    return;
    // }

    /*
    try {
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Request timed out (5s)")), 5000)
      );

      await Promise.race([
        deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'assessments', assessmentToDelete)),
        timeout
      ]);

      setAssessmentToDelete(null);
    } catch (e) {
      console.error("Failed to delete assessment", e);
      alert("Fehler beim Löschen: " + e.message);
    } finally {
      setLoading(false);
      setShowAssessmentDeleteConfirm(false);
    }
    */
  };

  const handleDeletePatientRequest = (e, patient) => {
    e.stopPropagation();
    setPatientToDelete(patient);
    setShowPatientDeleteConfirm(true);
  };

  const handleConfirmDeletePatient = async () => {
    if (!user || !patientToDelete) return;

    setLoading(true);

    if (storageMode === 'synology') {
      try {
        await fetch(`${synologyUrl}/api/patients/${patientToDelete.id}`, {
          method: 'DELETE'
        });
      } catch (err) {
        console.error("Synology Delete Patient Error:", err);
      }
    }

    // Local Delete
    setEntries(prev => prev.filter(e => e.patientId !== patientToDelete.id));
    setWounds(prev => prev.filter(w => w.patientId !== patientToDelete.id));
    setPatients(prev => prev.filter(p => p.id !== patientToDelete.id));
    setPatientToDelete(null);
    setLoading(false);
    setShowPatientDeleteConfirm(false);
    return;
    // }

    /*
    try {
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Request timed out (10s)")), 10000)
      );

      // 1. Get all wounds for this patient
      const woundsQuery = query(
        collection(db, 'artifacts', appId, 'public', 'data', 'wounds'),
        where('patientId', '==', patientToDelete.id)
      );
      const woundsSnapshot = await getDocs(woundsQuery);
      
      // 2. For each wound, delete its assessments and the wound itself
      const deletePromises = [];
      
      for (const woundDoc of woundsSnapshot.docs) {
        // Get assessments for this wound
        const assessmentsQuery = query(
          collection(db, 'artifacts', appId, 'public', 'data', 'assessments'),
          where('woundId', '==', woundDoc.id)
        );
        const assessmentsSnapshot = await getDocs(assessmentsQuery);
        assessmentsSnapshot.docs.forEach(d => deletePromises.push(deleteDoc(d.ref)));
        
        // Delete the wound
        deletePromises.push(deleteDoc(woundDoc.ref));
      }

      // 3. Delete the patient
      deletePromises.push(deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'patients', patientToDelete.id)));

      await Promise.race([
        Promise.all(deletePromises),
        timeout
      ]);

      setPatientToDelete(null);
    } catch (error) {
      console.error("Error deleting patient:", error);
      alert("Fehler beim Löschen des Patienten: " + error.message);
    } finally {
      setLoading(false);
      setShowPatientDeleteConfirm(false);
    }
    */
  };

  const handleExport = async () => {
    try {
      const plainText = JSON.stringify({ patients, wounds, entries });
      const encrypted = await encryptData(plainText, password);
      
      const success = await exportDatabase(encrypted);
      if (success) alert("Datenbank erfolgreich verschlüsselt exportiert!");
    } catch (err) {
      console.error(err);
      alert("Fehler beim Verschlüsseln der Exportdatei.");
    }
  };

  const handleImport = async () => {
    const result = await importDatabase();
    if (result && result.data) {
      const { data, handle } = result;

      if (confirm("Möchten Sie die aktuelle Datenbank mit der importierten Datei überschreiben?")) {
        let parsedData = data;
        
        if (data.ciphertext) {
          // Attempt to decrypt with current password first
          try {
            const decrypted = await decryptData(data, password);
            parsedData = JSON.parse(decrypted);
          } catch (err) {
            // If current password fails, prompt for backup password
            const backupPwd = window.prompt("Die importierte Datei ist verschlüsselt. Bitte geben Sie das Passwort der Sicherung ein:");
            if (!backupPwd) return; // User cancelled
            
            try {
              const decrypted = await decryptData(data, backupPwd);
              parsedData = JSON.parse(decrypted);
            } catch (err2) {
              alert("Fehler: Das angegebene Passwort für die importierte Datei ist unkorrekt.");
              return;
            }
          }
        }
        
        setPatients(parsedData.patients || []);
        setWounds(parsedData.wounds || []);
        setEntries(parsedData.entries || []);
        
        if (isLocalMode) {
          try {
            const encrypted = await encryptData(JSON.stringify(parsedData), password);
            saveToLocal(encrypted);
            if (fileHandle) {
              await saveToHandle(fileHandle, encrypted);
            }
          } catch (err) {
            console.error("Verschlüsselungsfehler nach Import:", err);
          }
          
          if (handle) {
            await storeFileHandle(handle);
            setFileHandle(handle);
            await verifyPermission(handle, true);
          }
        }
        alert("Datenbank erfolgreich importiert!");
      }
    }
  };

  // --- Derived State for Views ---
  
  const filteredWounds = (isLocalMode && selectedPatient) 
    ? wounds.filter(w => w.patientId === selectedPatient.id)
    : wounds;

  const filteredEntries = (isLocalMode && selectedWound)
    ? entries.filter(e => e.woundId === selectedWound.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    : entries;

  // --- Views ---

  if (!user) return <div className="flex items-center justify-center h-screen">Lade Anwendung...</div>;
  if (!isDataLoaded && showPasswordModal) {
    return (
      <PasswordModal 
        isOpen={showPasswordModal}
        mode={passwordModalMode}
        onSubmit={handlePasswordSubmit}
        error={passwordError}
        isLoading={cryptoLoading}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-100 text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-blue-700 text-white shadow-md px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Activity className="w-6 h-6" />
          <h1 className="text-lg font-bold tracking-wide">WundDoku Pro</h1>
          <span className={`text-xxs px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
            storageMode === 'synology' 
              ? 'bg-indigo-600 text-white border border-indigo-500' 
              : 'bg-orange-500 text-white'
          }`}>
            <Database size={11} /> 
            {storageMode === 'synology' ? 'SYNOLOGY LIVE' : 'LOKAL SECURE'}
          </span>
          {!('showSaveFilePicker' in window) && storageMode !== 'synology' && (
            <div className="group relative ml-1">
              <AlertTriangle className="text-orange-300 w-5 h-5 cursor-help" />
              <div className="absolute left-0 top-full mt-2 w-48 bg-slate-800 text-white text-xs p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                Lokaler Speicher aktiv. Daten sind nur auf diesem Gerät verfügbar.
              </div>
            </div>
          )}
        </div>
        
        
        <div className="flex items-center gap-3">
          {/* Mode Toggle & Actions */}
          {/* 
          <div className="flex items-center bg-blue-800 rounded-lg p-1">
             <button
               onClick={() => setIsLocalMode(!isLocalMode)}
               className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                 isLocalMode ? 'bg-orange-500 text-white' : 'hover:bg-blue-700 text-blue-100'
               }`}
               title={isLocalMode ? "Zu Cloud wechseln" : "Zu Lokal wechseln"}
             >
               {isLocalMode ? <CloudOff size={14} /> : <Cloud size={14} />}
               {isLocalMode ? "Lokal" : "Cloud"}
             </button>
          </div>
          */}
          <div className="text-xs opacity-80 bg-blue-800 px-2 py-1 rounded hidden md:block">
            {selectedPatient ? `Patient: ${selectedPatient.name}` : 'Übersicht'}
          </div>
             <div className="relative">
               <button 
                 onClick={() => setShowHeaderMenu(!showHeaderMenu)}
                 className="p-2 hover:bg-blue-600 rounded-lg text-blue-100 transition-colors"
                 title="Menü"
               >
                 <MoreVertical size={20} />
               </button>
               
               {showHeaderMenu && (
                 <>
                   <div 
                     className="fixed inset-0 z-40"
                     onClick={() => setShowHeaderMenu(false)}
                   />
                   <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                     <button 
                       onClick={() => { setShowHeaderMenu(false); setShowSettingsModal(true); }}
                       className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors border-b border-slate-100"
                     >
                       <Database size={16} className="text-blue-500" />
                       Speicher-Einstellungen
                     </button>
                     {storageMode === 'local' && (
                       <button 
                         onClick={() => { setShowHeaderMenu(false); setShowChangePasswordModal(true); }}
                         className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors border-b border-slate-100"
                       >
                         <Lock size={16} className="text-orange-500" />
                         Passwort ändern
                       </button>
                     )}
                     <button 
                       onClick={() => { setShowHeaderMenu(false); handleExport(); }}
                       className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors border-t border-slate-50"
                     >
                       <Upload size={16} className="text-slate-400" />
                       Datenbank exportieren
                     </button>
                     <button 
                       onClick={() => { setShowHeaderMenu(false); handleImport(); }}
                       className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                     >
                       <Download size={16} className="text-slate-400" />
                       Datenbank importieren
                     </button>
                     {'showSaveFilePicker' in window && (
                       <button 
                         onClick={() => { setShowHeaderMenu(false); handleLocalModeSetupConfirm(); }}
                         className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors border-t border-slate-50"
                       >
                         <Save size={16} className="text-slate-400" />
                         {fileHandle ? 'Speicherort ändern' : 'Lokale Datei verknüpfen'}
                       </button>
                     )}
                   </div>
                 </>
               )}
             </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        
        {/* VIEW: PATIENT LIST */}
        {currentView === 'PATIENT_LIST' && (
          <div className="h-full overflow-y-auto p-4 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Aktive Patienten</h2>
              <button 
                onClick={handleAddPatient}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow transition-all"
              >
                <Plus size={18} /> Neuer Patient
              </button>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {patients.map(patient => (
                <div 
                  key={patient.id}
                  onClick={() => {
                    setSelectedPatient(patient);
                    setCurrentView('PATIENT_DETAIL');
                  }}
                  className="bg-white p-5 rounded-xl shadow-sm hover:shadow-md cursor-pointer border border-slate-200 transition-all"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                      {patient.name.charAt(0)}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-400">{patient.mrn}</span>
                      <button 
                        onClick={(e) => handleDeletePatientRequest(e, patient)}
                        className="text-slate-400 hover:text-red-600 p-1 -mr-2 hover:bg-red-50 rounded transition-colors"
                        title="Patient löschen"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-semibold text-lg">{patient.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                    <Calendar size={14} />
                    <span>Geb.: {patient.dob}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-2">
                    Erstellt: {formatDate(patient.createdAt)}
                  </div>
                </div>
              ))}
              {patients.length === 0 && (
                <div className="col-span-full text-center py-12 text-slate-400">
                  Keine Patienten gefunden. Legen Sie einen an, um zu beginnen.
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW: PATIENT DETAIL (Dashboard) */}
        {currentView === 'PATIENT_DETAIL' && selectedPatient && (
          <div className="h-full flex flex-col md:flex-row">
            {/* Sidebar / Back Button */}
            <div className="md:w-16 bg-white border-r flex flex-col items-center py-4 gap-4">
              <button 
                onClick={() => { setSelectedPatient(null); setCurrentView('PATIENT_LIST'); }}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
                title="Zurück zur Liste"
              >
                <ArrowLeft size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              
              {/* Left: Body Map & Wound List */}
              <div className={`w-full md:w-1/2 lg:w-1/3 bg-white border-r p-4 overflow-y-auto flex-col gap-6 ${selectedWound ? 'hidden md:flex' : 'flex'}`}>
                <div>
                  <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <MapPin size={18} /> Körperkarte
                  </h3>
                  <BodyMap 
                    markers={filteredWounds} 
                    selectedMarkerId={selectedWound?.id}
                    onLocationSelect={handleMapClick} 
                  />
                </div>
                
                <div>
                  <h3 className="font-bold text-slate-700 mb-2">Wundliste</h3>
                  <div className="space-y-2">
                    {filteredWounds.map((w, idx) => (
                      <div 
                        key={w.id}
                        onClick={() => {
                          setSelectedWound(w);
                          setIsEditingWound(false);
                        }}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedWound?.id === w.id 
                            ? 'bg-blue-50 border-blue-300' 
                            : 'hover:bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-sm">#{idx+1} {w.locationName}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wide ${STATUS_COLORS[w.status] || 'bg-slate-100'}`}>
                            {STATUS_TRANSLATION[w.status] || w.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          Erfasst: {formatDate(w.createdAt)}
                        </div>
                      </div>
                    ))}
                    {filteredWounds.length === 0 && (
                      <div className="text-xs text-slate-400 italic text-center py-4">
                        Klicken Sie auf die Karte, um eine Wunde hinzuzufügen.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Master-Detail Content */}
              <div className={`flex-1 bg-slate-50 flex-col overflow-hidden ${!selectedWound ? 'hidden md:flex' : 'flex'}`}>
                {!selectedWound ? (
                  <div className="flex-1 flex items-center justify-center text-slate-400 text-center px-4">
                    Wählen Sie eine Wunde aus der Liste oder klicken Sie auf die Körperkarte, um eine neue zu dokumentieren.
                  </div>
                ) : isEditingWound ? (
                  <WoundAssessmentForm 
                    wound={selectedWound}
                    initialData={editingAssessment}
                    onCancel={() => {
                      setIsEditingWound(false);
                      setEditingAssessment(null);
                    }}
                    onSave={handleSaveAssessment}
                  />
                ) : (
                  <div className="h-full flex flex-col">
                     {/* Nav Bar */}
                     <div className="bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm z-10">
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => setSelectedWound(null)}
                            className="md:hidden p-2 -ml-2 text-slate-500 hover:text-blue-600 rounded-lg"
                          >
                            <ArrowLeft size={20} />
                          </button>
                          <h2 className="font-bold text-lg text-slate-800">{selectedWound.locationName} - Verlauf</h2>
                        </div>

                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => setShowWoundDeleteConfirm(true)}
                            className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                            title="Wunde und Verlauf löschen"
                          >
                            <Trash2 size={20} />
                          </button>
                          <div className="w-px h-6 bg-slate-200 mx-1"></div>
                          <button 
                            onClick={() => { 
                              setIsEditingWound(true); 
                              setEditingAssessment(null); // Clear editing state for new
                            }}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm hover:bg-blue-700 transition-colors"
                          >
                            <Plus size={16} /> Neue Beurteilung
                          </button>
                        </div>
                     </div>

                     <div className="flex-1 overflow-y-auto p-4 md:p-8 w-full max-w-4xl mx-auto">
                        {filteredEntries.map((entry) => (
                          <AssessmentCard 
                            key={entry.id} 
                            entry={entry} 
                            onDelete={handleDeleteAssessmentRequest}
                            onEdit={(entry) => {
                              setEditingAssessment(entry);
                              setIsEditingWound(true);
                            }}
                            patientName={selectedPatient?.name}
                            woundLocation={selectedWound?.locationName}
                          />
                        ))}
                        {filteredEntries.length === 0 && (
                          <div className="text-center py-20">
                            <div className="inline-block p-4 bg-white rounded-full shadow-sm mb-4">
                              <FileText size={40} className="text-slate-200" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-700">Noch keine Beurteilungen</h3>
                            <p className="text-slate-500 max-w-xs mx-auto mt-2 text-sm">Starten Sie die erste Dokumentation für diese Wunde, um einen Basisbericht zu erstellen.</p>
                          </div>
                        )}
                     </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MODAL: NEW PATIENT */}
        {showNewPatientModal && (
          <NewPatientModal 
            onCancel={() => setShowNewPatientModal(false)}
            onSave={handleSavePatient}
          />
        )}

        {/* MODAL: NEW WOUND */}
        {showNewWoundModal && (
          <NewWoundModal 
            initialValue={tempWoundData?.partName}
            onCancel={() => {
              setShowNewWoundModal(false);
              setTempWoundData(null);
            }}
            onSave={handleSaveWound}
          />
        )}

        {/* MODAL: LOCAL MODE SETUP */}
        <LocalModeSetupModal
          isOpen={showLocalModeSetupModal}
          onConfirm={handleLocalModeSetupConfirm}
          onContinueDefault={handleContinueWithDefault}
          isLoading={loading}
          isFileSystemSupported={'showSaveFilePicker' in window}
        />

        {/* MODAL: DELETE WOUND CONFIRMATION */}
        <ConfirmationModal
          isOpen={showWoundDeleteConfirm}
          title="Wunde löschen?"
          message={`Möchten Sie "${selectedWound?.locationName}" und alle zugehörigen Verlaufsdaten wirklich unwiderruflich löschen?`}
          onConfirm={handleDeleteWound}
          onCancel={() => setShowWoundDeleteConfirm(false)}
          isLoading={loading}
          confirmLabel="Löschen"
          variant="danger"
        />

        {/* MODAL: DELETE ASSESSMENT CONFIRMATION */}
        <ConfirmationModal
          isOpen={showAssessmentDeleteConfirm}
          title="Eintrag löschen?"
          message="Möchten Sie diese Wundbeurteilung wirklich löschen?"
          onConfirm={handleConfirmDeleteAssessment}
          onCancel={() => {
            setShowAssessmentDeleteConfirm(false);
            setAssessmentToDelete(null);
          }}
          isLoading={loading}
          confirmLabel="Löschen"
          variant="danger"
        />

        {/* MODAL: DELETE PATIENT CONFIRMATION */}
        <ConfirmationModal
          isOpen={showPatientDeleteConfirm}
          title="Patient. löschen?"
          message={`Möchten Sie "${patientToDelete?.name}" und alle zugehörigen Wunden und Verläufe wirklich unwiderruflich löschen?`}
          onConfirm={handleConfirmDeletePatient}
          onCancel={() => {
            setShowPatientDeleteConfirm(false);
            setPatientToDelete(null);
          }}
          isLoading={loading}
          confirmLabel="Löschen"
          variant="danger"
        />

        {/* MODAL: CONNECTION SETTINGS */}
        <ConnectionSettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          currentMode={storageMode}
          currentUrl={synologyUrl}
          onSave={handleSaveConnectionSettings}
        />

        {/* MODAL: CHANGE PASSWORD */}
        <ChangePasswordModal
          isOpen={showChangePasswordModal}
          onClose={() => setShowChangePasswordModal(false)}
          onSave={handleChangePassword}
        />

      </main>
    </div>
  );
}