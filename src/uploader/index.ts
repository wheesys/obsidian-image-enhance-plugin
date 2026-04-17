import { Platform, Notice } from "obsidian";

import PicGoUploader from "./picgo";
import PicGoCoreUploader from "./picgoCore";

import type ImageEnhancePlugin from "../main";
import type { Image } from "../types";

export function getUploader(uploader: string) {
  switch (uploader) {
    case "PicGo":
      return PicGoUploader;
    case "PicGo-Core":
      return PicGoCoreUploader;
    default:
      throw new Error("Invalid uploader");
  }
}

export class UploaderManager {
  uploader: PicGoUploader | PicGoCoreUploader;
  plugin: ImageEnhancePlugin;

  constructor(uploader: string, plugin: ImageEnhancePlugin) {
    this.plugin = plugin;
    const Uploader = getUploader(uploader);
    this.uploader = new Uploader(this.plugin);
  }

  async upload(fileList: Array<string> | Array<Image> | Array<File>) {
    if (Platform.isMobileApp && !this.plugin.settings.remoteServerMode) {
      new Notice("Mobile App must use remote server mode.");
      throw new Error("Mobile App must use remote server mode.");
    }

    const res = await this.uploader.upload(fileList);
    if (!res.success) {
      new Notice(res.msg || "Upload Failed");
      throw new Error(res.msg || "Upload Failed");
    }

    return res;
  }
  async uploadByClipboard(fileList?: FileList) {
    if (Platform.isMobileApp && !this.plugin.settings.remoteServerMode) {
      new Notice("Mobile App must use remote server mode.");
      throw new Error("Mobile App must use remote server mode.");
    }

    const res = await this.uploader.uploadByClipboard(fileList);
    if (!res.success) {
      new Notice(res.msg || "Upload Failed");
      throw new Error(res.msg || "Upload Failed");
    }

    return res;
  }
}

export type Uploader = PicGoUploader | PicGoCoreUploader;
export { PicGoUploader, PicGoCoreUploader };
