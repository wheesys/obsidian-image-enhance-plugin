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
 */
export function getFs() {
  if (!isElectronAvailable()) {
    throw new Error("fs module is only available in desktop app");
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require("fs");
}

/**
 * Get the child_process module if available.
 * @throws Error if not in Electron environment
 */
export function getChildProcess() {
  if (!isElectronAvailable()) {
    throw new Error("child_process module is only available in desktop app");
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require("child_process");
}

/**
 * Get the electron module if available.
 * @throws Error if not in Electron environment
 */
export function getElectron() {
  if (!isElectronAvailable()) {
    throw new Error("electron module is only available in desktop app");
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require("electron");
}
