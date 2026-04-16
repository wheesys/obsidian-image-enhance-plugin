import type { TFile } from "obsidian";

// Local interface for file objects with additional fullPath property
// This is used in main.ts when creating virtual file objects for upload purposes
export interface FileWithFullPath {
  path: string;
  name: string;
  extension: string;
  fullPath: string;
}

export interface Image {
  path: string;
  name: string;
  source: string;
  file?: TFile | FileWithFullPath | null;
}
