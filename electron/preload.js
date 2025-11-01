// Preload script
// This script runs before the web page is loaded
// It can access both Node.js APIs and the web page's DOM

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Add any APIs you want to expose to the renderer process here
  platform: process.platform,
  version: process.versions.electron
});
