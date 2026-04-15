import { join } from "path-browserify";

import { streamToString, getLastImage } from "../utils";
import { normalizePath, FileSystemAdapter } from "obsidian";

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

  private async uploadFiles(fileList: Array<Image> | Array<string>) {
    const basePath = (
      this.plugin.app.vault.adapter as FileSystemAdapter
    ).getBasePath();

    const list = fileList.map(item => {
      if (typeof item === "string") {
        return item;
      } else {
        return normalizePath(join(basePath, item.path));
      }
    });

    const length = list.length;
    let cli = this.settings.picgoCorePath || "picgo";
    let command = `${cli} upload ${list.map(item => `"${item}"`).join(" ")}`;

    const res = await this.exec(command);
    const splitList = res.split("\n");
    const splitListLength = splitList.length;

    const data = splitList.splice(splitListLength - 1 - length, length);

    if (res.includes("PicGo ERROR")) {
      console.error(command, res);

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
      console.error(splitList);

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
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { exec } = require("child_process") as { exec: (cmd: string, callback: (error: Error | null, stdout: { [Symbol.asyncIterator](): AsyncIterator<Buffer> }) => void) => void };
    return new Promise((resolve, reject) => {
      exec(command, async (error, stdout) => {
        if (error) {
          reject(error);
        } else {
          const res = await streamToString(stdout);
          resolve(res);
        }
      });
    });
  }

  async upload(fileList: Array<Image> | Array<string>) {
    return this.uploadFiles(fileList);
  }
  async uploadByClipboard(fileList?: FileList) {
    console.debug("uploadByClipboard", fileList);
    return this.uploadFileByClipboard();
  }
}
