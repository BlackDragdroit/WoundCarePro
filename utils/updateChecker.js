// Utility for handling application updates via Tauri Updater or GitHub Releases REST API

export const APP_VERSION = '0.1.2';
export const GITHUB_REPO = 'BlackDragdroit/WoundCarePro';

/**
 * Checks whether the application is currently running inside Tauri.
 */
export const isTauriEnv = () => {
  return typeof window !== 'undefined' && (window.__TAURI__ !== undefined || window.__TAURI_IPC__ !== undefined);
};

/**
 * Helper to compare semantic version strings (e.g., "0.2.0" > "0.1.0").
 */
export const isNewerVersion = (latestVer, currentVer) => {
  const clean = (v) => v ? v.replace(/^v/i, '').trim() : '0.0.0';
  const latestParts = clean(latestVer).split('.').map(n => parseInt(n, 10) || 0);
  const currentParts = clean(currentVer).split('.').map(n => parseInt(n, 10) || 0);

  for (let i = 0; i < Math.max(latestParts.length, currentParts.length); i++) {
    const latestPart = latestParts[i] || 0;
    const currentPart = currentParts[i] || 0;
    if (latestPart > currentPart) return true;
    if (latestPart < currentPart) return false;
  }
  return false;
};

/**
 * Checks for updates across Tauri API and GitHub Releases API.
 */
export const checkForUpdates = async (currentVersion = APP_VERSION) => {
  let isTauri = isTauriEnv();

  // Try Tauri Updater API first if running in desktop app
  if (isTauri) {
    try {
      const { checkUpdate } = await import('@tauri-apps/api/updater');
      const updateResult = await checkUpdate();
      if (updateResult && updateResult.shouldUpdate) {
        return {
          shouldUpdate: true,
          version: updateResult.manifest?.version || 'Neu',
          currentVersion,
          body: updateResult.manifest?.body || 'Keine Release-Notes vorhanden.',
          date: updateResult.manifest?.date || '',
          isTauri: true,
          rawTauri: updateResult
        };
      }
    } catch (tauriErr) {
      console.warn('Tauri updater check skipped or failed, falling back to GitHub API:', tauriErr);
    }
  }

  // Fallback / Standalone: Query GitHub Releases API
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
      headers: { 'Accept': 'application/vnd.github.v3+json' }
    });
    
    if (!res.ok) {
      if (res.status === 404) {
        return {
          shouldUpdate: false,
          currentVersion,
          message: 'Noch keine Releases auf GitHub veröffentlicht.'
        };
      }
      throw new Error(`GitHub API HTTP ${res.status}`);
    }

    const releaseData = await res.json();
    const latestTag = releaseData.tag_name || releaseData.name || '';
    const shouldUpdate = isNewerVersion(latestTag, currentVersion);

    // Find Windows installer asset (.msi or .exe) if present
    const msiAsset = releaseData.assets?.find(a => a.name?.endsWith('.msi') || a.name?.endsWith('.exe'));

    return {
      shouldUpdate,
      version: latestTag,
      currentVersion,
      body: releaseData.body || 'Keine Beschreibung verfügbar.',
      publishedAt: releaseData.published_at,
      htmlUrl: releaseData.html_url,
      downloadUrl: msiAsset ? msiAsset.browser_download_url : releaseData.html_url,
      isTauri: false
    };
  } catch (err) {
    console.error('Failed to check GitHub releases:', err);
    return {
      shouldUpdate: false,
      error: 'Fehler beim Abrufen der Release-Informationen von GitHub.',
      currentVersion
    };
  }
};

/**
 * Triggers native Tauri update download & install process.
 */
export const installTauriUpdate = async (onStatusChange) => {
  if (!isTauriEnv()) {
    throw new Error('Native installation is only available in Tauri desktop application.');
  }

  try {
    const { installUpdate } = await import('@tauri-apps/api/updater');
    const { relaunch } = await import('@tauri-apps/api/process');

    if (onStatusChange) onStatusChange('downloading', 'Update wird heruntergeladen...');
    await installUpdate();

    if (onStatusChange) onStatusChange('relaunching', 'Installation abgeschlossen. App wird neu gestartet...');
    await relaunch();
  } catch (err) {
    console.error('Error installing Tauri update:', err);
    throw err;
  }
};
