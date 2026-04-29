import { extname } from "path-browserify";
import { requestUrl, normalizePath, TFile } from "obsidian";

import { payloadGenerator } from "../payloadGenerator";

import type imageEnhancePlugin from "../main";
import type { Image, FileWithFullPath } from "../types";
import type { Response, Uploader } from "./types";
import type { PluginSettings, UploadedImage } from "../setting";

interface PicGoResponse {
  success?: boolean;
  message?: string;
  msg?: string;
  result: string[] | string;
  fullResult?: UploadedImage[];
}

export default class PicGoUploader implements Uploader {
  settings: PluginSettings;
  plugin: imageEnhancePlugin;

  constructor(plugin: imageEnhancePlugin) {
    this.settings = plugin.settings;
    this.plugin = plugin;
  }

  private async uploadFiles(fileList: Array<Image | string | File>) {
    let response: Awaited<ReturnType<typeof requestUrl>>;

    if (this.settings.remoteServerMode) {
      const files: File[] = [];
      for (const item of fileList) {
        if (item instanceof File) {
          // Direct File object (from drag-drop)
          files.push(item);
        } else if (typeof item === "string") {
          // String path - skip as we cannot read arbitrary paths without fs module
          continue;
        } else {
          // Image object from vault
          const timestamp = Date.now();
          const image: Image = item;

          if (!image.file) continue;
          // 直接使用 TFile 对象读取，无需关心路径格式
          const arrayBuffer = await this.plugin.app.vault.readBinary(image.file as TFile);

          files.push(
            new File([arrayBuffer], timestamp + extname(image.file.name))
          );
        }
      }
      response = await this.uploadFileByData(files);
    } else {
      const list = fileList.map(item => {
        if (typeof item === "string") {
          return item;
        } else if (item instanceof File) {
          // File objects not supported in local server mode
          return "";
        } else {
          // fullPath is available on FileWithFullPath objects for upload purposes
          const imagePath = (item.file as FileWithFullPath)?.fullPath || item.path;
          return normalizePath(imagePath);
        }
      }).filter(p => p.length > 0);

      if (list.length === 0) {
        return {
          success: false,
          msg: "No valid files to upload",
          result: [],
        };
      }

      response = await requestUrl({
        url: this.settings.uploadServer,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ list: list }),
      });
    }

    return this.handleResponse(response);
  }

  private async uploadFileByData(fileList: FileList | File[]) {
    const payload_data: {
      [key: string]: (string | Blob | ArrayBuffer | File)[];
    } = {
      list: [],
    };

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      payload_data["list"].push(file);
    }

    const [request_body, boundary_string] = await payloadGenerator(
      payload_data
    );

    const options = {
      method: "POST",
      url: this.settings.uploadServer,
      contentType: `multipart/form-data; boundary=----${boundary_string}`,
      body: request_body,
    };
    const response = await requestUrl(options);

    return response;
  }

  private async uploadFileByClipboard(fileList?: FileList): Promise<Response> {
    let res: Awaited<ReturnType<typeof requestUrl>>;

    if (this.settings.remoteServerMode) {
      const files: File[] = [];
      if (fileList) {
        for (let i = 0; i < fileList.length; i++) {
          const timestamp = Date.now();

          const file = fileList[i];
          const arrayBuffer = await file.arrayBuffer();
          files.push(new File([arrayBuffer], timestamp + ".png"));
        }
      }
      res = await this.uploadFileByData(files);
    } else {
      res = await requestUrl({
        url: this.settings.uploadServer,
        method: "POST",
      });
    }
    return this.handleResponse(res);
  }

  /**
   * 处理返回值
   */
  private async handleResponse(
    response: Awaited<ReturnType<typeof requestUrl>>
  ): Promise<Response> {
    const data = (await response.json) as PicGoResponse;

    if (response.status !== 200) {
      console.error(response, data);
      return {
        success: false,
        msg: data.msg || data.message,
        result: [],
      };
    }
    if (data.success === false) {
      console.error(response, data);
      return {
        success: false,
        msg: data.msg || data.message,
        result: [],
      };
    }

    // piclist
    if (data.fullResult) {
      const uploadUrlFullResultList = data.fullResult || [];
      this.settings.uploadedImages = [
        ...(this.settings.uploadedImages || []),
        ...uploadUrlFullResultList,
      ];
      void this.plugin.saveSettings();
    }

    return {
      success: true,
      msg: "success",
      result: typeof data.result == "string" ? [data.result] : data.result,
    };
  }

  async upload(fileList: Array<Image> | Array<string> | Array<File>) {
    return this.uploadFiles(fileList);
  }
  async uploadByClipboard(fileList?: FileList) {
    return this.uploadFileByClipboard(fileList);
  }
}
