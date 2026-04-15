import { requestUrl } from "obsidian";
import imageEnhancePlugin from "./main";
import type { UploadedImage } from "./setting";

interface DeleteResponse {
  success: boolean;
  msg?: string;
}

export class PicGoDeleter {
  plugin: imageEnhancePlugin;

  constructor(plugin: imageEnhancePlugin) {
    this.plugin = plugin;
  }

  async deleteImage(configMap: UploadedImage[]): Promise<DeleteResponse> {
    const response = await requestUrl({
      url: this.plugin.settings.deleteServer,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        list: configMap,
      }),
    });
    const data = response.json as DeleteResponse;
    return data;
  }
}
