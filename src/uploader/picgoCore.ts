import { join } from "path-browserify";

import { streamToString, getLastImage } from "../utils";
import { normalizePath, FileSystemAdapter } from "obsidian";
import { getChildProcess } from "../electronHelper";

import type imageEnhancePlugin from "../main";
import type { Image } from "../types";
import type { PluginSettings } from "../setting";
import type { Uploader } from "./types";

export default class PicGoCoreUploader implements Uploader {
  settings: PluginSettings;
  plugin: imageEnhancePlugin;

  constructor(plugin: imageEnhancePlugin) {
    this.settings = plugin.settings;
    this.plugin = plugin;
  }

  private async uploadFiles(fileList: Array<Image> | Array<string> | Array<File>) {
    const basePath = (
      this.plugin.app.vault.adapter as FileSystemAdapter
    ).getBasePath();

    const list: string[] = [];
    for (const item of fileList) {
      if (typeof item === "string") {
        list.push(item);
      } else if (item instanceof File) {
        // File objects from drag-drop don't have accessible paths without electron module
        // Skip these files as PicGo-Core requires file paths for command line execution
        continue;
      } else {
        list.push(normalizePath(join(basePath, item.path)));
      }
    }

    if (list.length === 0) {
      return {
        success: false,
        msg: "No valid files to upload. PicGo-Core uploader requires vault files with paths.",
        result: [] as string[],
      };
    }

    const length = list.length;
    const cli = this.settings.picgoCorePath || "picgo";
    const command = `${cli} upload ${list.map(item => `"${item}"`).join(" ")}`;

    const res = await this.exec(command);
    const splitList = res.split("\n");
    const splitListLength = splitList.length;

    const data = splitList.splice(splitListLength - 1 - length, length);

    if (res.includes("PicGo ERROR")) {
      console.debug(command, res);

      return {
        success: false,
        msg: "失败",
        result: [] as string[],
      };
    } else {
      return {
        success: true,
        result: data,
      };
    }
  }

  // PicGo-Core 上传处理
  private async uploadFileByClipboard() {
    const res = await this.uploadByClip();
    const splitList = res.split("\n");
    const lastImage = getLastImage(splitList);

    if (lastImage) {
      return {
        success: true,
        msg: "success",
        result: [lastImage],
      };
    } else {
      console.debug(splitList);

      return {
        success: false,
        msg: `"Please check PicGo-Core config"\n${res}`,
        result: [],
      };
    }
  }

  // PicGo-Core的剪切上传反馈
  private async uploadByClip() {
    let command;
    if (this.settings.picgoCorePath) {
      command = `${this.settings.picgoCorePath} upload`;
    } else {
      command = `picgo upload`;
    }
    const res = await this.exec(command);

    return res;
  }

  private async exec(command: string): Promise<string> {
    const { exec } = getChildProcess() as { exec: (cmd: string, callback: (error: Error | null, stdout: { [Symbol.asyncIterator](): AsyncIterator<Buffer> }) => void) => void };
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout) => {
        if (error) {
          reject(error);
        } else {
          void streamToString(stdout).then(res => resolve(res));
        }
      });
    });
  }

  async upload(fileList: Array<Image> | Array<string> | Array<File>) {
    return this.uploadFiles(fileList);
  }
  async uploadByClipboard(fileList?: FileList) {
    console.debug("uploadByClipboard", fileList);
    return this.uploadFileByClipboard();
  }
}
