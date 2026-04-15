import { App, PluginSettingTab, Setting, Notice } from "obsidian";
import imageEnhancePlugin from "./main";
import { t } from "./lang/helpers";

export interface PluginSettings {
  uploadByClipSwitch: boolean;
  uploadServer: string;
  deleteServer: string;
  imageSizeSuffix: string;
  uploader: string;
  picgoCorePath: string;
  workOnNetWork: boolean;
  newWorkBlackDomains: string;
  applyImage: boolean;
  deleteSource: boolean;
  imageDesc: "origin" | "none" | "removeDefault";
  remoteServerMode: boolean;
  debugMode: boolean;
  uploadedImages?: UploadedImage[];
}

export interface UploadedImage {
  imgUrl: string;
  [key: string]: string | number | boolean | null | undefined;
}

export const DEFAULT_SETTINGS: PluginSettings = {
  uploadByClipSwitch: true,
  uploader: "PicGo",
  uploadServer: "http://127.0.0.1:36677/upload",
  deleteServer: "http://127.0.0.1:36677/delete",
  imageSizeSuffix: "",
  picgoCorePath: "",
  workOnNetWork: false,
  applyImage: true,
  newWorkBlackDomains: "",
  deleteSource: false,
  imageDesc: "origin",
  remoteServerMode: false,
  debugMode: false,
};

export class SettingTab extends PluginSettingTab {
  plugin: imageEnhancePlugin;

  constructor(app: App, plugin: imageEnhancePlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    let { containerEl } = this;

    containerEl.empty();
    new Setting(containerEl)
      .setName(t("Plugin Settings"))
      .setHeading();
    new Setting(containerEl)
      .setName(t("Auto pasted upload"))
      .setDesc(
        t(
          "If you set this value true, when you paste image, it will be auto uploaded(you should set the picGo server rightly)"
        )
      )
      .addToggle(toggle =>
        toggle
          .setValue(this.plugin.settings.uploadByClipSwitch)
          .onChange(value => {
            this.plugin.settings.uploadByClipSwitch = value;
            void this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(t("Default uploader"))
      .setDesc(t("Default uploader"))
      .addDropdown(cb =>
        cb
          .addOption("PicGo", "PicGo(app)")
          .addOption("PicGo-Core", "PicGo-Core")
          .setValue(this.plugin.settings.uploader)
          .onChange(value => {
            this.plugin.settings.uploader = value;
            this.display();
            void this.plugin.saveSettings();
          })
      );

    if (this.plugin.settings.uploader === "PicGo") {
      new Setting(containerEl)
        .setName(t("PicGo server"))
        .setDesc(t("PicGo server desc"))
        .addText(text =>
          text
            .setPlaceholder(t("Please input PicGo server"))
            .setValue(this.plugin.settings.uploadServer)
            .onChange(key => {
              this.plugin.settings.uploadServer = key;
              void this.plugin.saveSettings();
            })
        );

      new Setting(containerEl)
        .setName(t("PicGo delete server"))
        .setDesc(t("PicList desc"))
        .addText(text =>
          text
            .setPlaceholder(t("Please input PicGo delete server"))
            .setValue(this.plugin.settings.deleteServer)
            .onChange(key => {
              this.plugin.settings.deleteServer = key;
              void this.plugin.saveSettings();
            })
        );
    }

    new Setting(containerEl)
      .setName(t("Remote server mode"))
      .setDesc(t("Remote server mode desc"))
      .addToggle(toggle =>
        toggle
          .setValue(this.plugin.settings.remoteServerMode)
          .onChange(value => {
            this.plugin.settings.remoteServerMode = value;
            if (value) {
              this.plugin.settings.workOnNetWork = false;
            }
            this.display();
            void this.plugin.saveSettings();
          })
      );

    if (this.plugin.settings.uploader === "PicGo-Core") {
      new Setting(containerEl)
        .setName(t("PicGo-Core path"))
        .setDesc(
          t("Please input PicGo-Core path, default using environment variables")
        )
        .addText(text =>
          text
            .setPlaceholder("")
            .setValue(this.plugin.settings.picgoCorePath)
            .onChange(value => {
              this.plugin.settings.picgoCorePath = value;
              void this.plugin.saveSettings();
            })
        );
    }

    // image desc setting
    new Setting(containerEl)
      .setName(t("Image desc"))
      .setDesc(t("Image desc"))
      .addDropdown(cb =>
        cb
          .addOption("origin", t("reserve")) // 保留全部
          .addOption("none", t("remove all")) // 移除全部
          .addOption("removeDefault", t("remove default")) // 只移除默认即 image.png
          .setValue(this.plugin.settings.imageDesc)
          .onChange((value: "origin" | "none" | "removeDefault") => {
            this.plugin.settings.imageDesc = value;
            this.display();
            void this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(t("Image size suffix"))
      .setDesc(t("Image size suffix Description"))
      .addText(text =>
        text
          .setPlaceholder(t("Please input image size suffix"))
          .setValue(this.plugin.settings.imageSizeSuffix)
          .onChange(key => {
            this.plugin.settings.imageSizeSuffix = key;
            void this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(t("Work on network"))
      .setDesc(t("Work on network Description"))
      .addToggle(toggle =>
        toggle
          .setValue(this.plugin.settings.workOnNetWork)
          .onChange(value => {
            if (this.plugin.settings.remoteServerMode) {
              new Notice("Can only work when remote server mode is off.");
              this.plugin.settings.workOnNetWork = false;
            } else {
              this.plugin.settings.workOnNetWork = value;
            }
            this.display();
            void this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(t("Network Domain Black List"))
      .setDesc(t("Network Domain Black List Description"))
      .addTextArea(textArea =>
        textArea
          .setValue(this.plugin.settings.newWorkBlackDomains)
          .onChange(value => {
            this.plugin.settings.newWorkBlackDomains = value;
            void this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(t("Upload when clipboard has image and text together"))
      .setDesc(
        t(
          "When you copy, some application like Excel will image and text to clipboard, you can upload or not."
        )
      )
      .addToggle(toggle =>
        toggle
          .setValue(this.plugin.settings.applyImage)
          .onChange(value => {
            this.plugin.settings.applyImage = value;
            this.display();
            void this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(t("Delete source file after you upload file"))
      .setDesc(t("Delete source file in ob assets after you upload file."))
      .addToggle(toggle =>
        toggle
          .setValue(this.plugin.settings.deleteSource)
          .onChange(value => {
            this.plugin.settings.deleteSource = value;
            void this.plugin.saveSettings();
          })
      );
  }
}
