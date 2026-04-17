/**
 * Electron environment helper module.
 * This module provides safe access to Node.js modules that are only available in desktop app.
 */

let electronModulesAvailable: boolean | null = null;

/**
 * Check if Electron modules are available (desktop app environment).
 */
export function isElectronAvailable(): boolean {
  if (electronModulesAvailable !== null) {
    return electronModulesAvailable;
  }

  // Check if we're in an Electron environment by testing for require
  electronModulesAvailable = typeof require !== "undefined";
  return electronModulesAvailable;
}

/**
 * Get the fs module if available.
 * @throws Error if not in Electron environment
 *
 * Note: This module is only available in desktop Electron environment.
 * Using require() is necessary here because these are Node.js modules
 * that are not available through ES imports in Obsidian's build system.
 */
export function getFs() {
  if (!isElectronAvailable()) {
    throw new Error("fs module is only available in desktop app");
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires -- Node.js module only available in Electron
  return require("fs");
}

/**
 * Get the child_process module if available.
 * @throws Error if not in Electron environment
 *
 * Note: This module is required for PicGo-Core CLI integration.
 * Using require() is necessary here because these are Node.js modules
 * that are not available through ES imports in Obsidian's build system.
 */
export function getChildProcess() {
  if (!isElectronAvailable()) {
    throw new Error("child_process module is only available in desktop app");
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires -- Node.js module only available in Electron
  return require("child_process");
}

/**
 * Get the electron module if available.
 * @throws Error if not in Electron environment
 *
 * Note: This module provides Electron-specific APIs.
 * Using require() is necessary here because these are Node.js modules
 * that are not available through ES imports in Obsidian's build system.
 */
export function getElectron() {
  if (!isElectronAvailable()) {
    throw new Error("electron module is only available in desktop app");
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires -- Node.js module only available in Electron
  return require("electron");
}
