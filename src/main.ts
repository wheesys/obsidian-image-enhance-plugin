import {
  MarkdownView,
  Plugin,
  Editor,
  Menu,
  MenuItem,
  TFile,
  normalizePath,
  Notice,
  addIcon,
  MarkdownFileInfo,
} from "obsidian";
import { resolve, basename, dirname } from "path-browserify";

import { isAssetTypeAnImage, arrayToObject } from "./utils";
import { downloadAllImageFiles } from "./download";
import { UploaderManager } from "./uploader/index";
import { PicGoDeleter } from "./deleter";
import Helper from "./helper";
import { t } from "./lang/helpers";
import { SettingTab, PluginSettings, DEFAULT_SETTINGS } from "./setting";

import type { Image } from "./types";

export default class imageEnhancePlugin extends Plugin {
  settings: PluginSettings;
  helper: Helper;
  editor: Editor;
  picGoDeleter: PicGoDeleter;

  async loadSettings() {
    this.settings = { ...DEFAULT_SETTINGS, ...(await this.loadData()) };
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  onunload() {}

  async onload() {
    await this.loadSettings();

    this.helper = new Helper(this.app);
    this.picGoDeleter = new PicGoDeleter(this);

    addIcon(
      "upload",
      `<svg t="1636630783429" class="icon" viewBox="0 0 100 100" version="1.1" p-id="4649" xmlns="http://www.w3.org/2000/svg">
      <path d="M 71.638 35.336 L 79.408 35.336 C 83.7 35.336 87.178 38.662 87.178 42.765 L 87.178 84.864 C 87.178 88.969 83.7 92.295 79.408 92.295 L 17.249 92.295 C 12.957 92.295 9.479 88.969 9.479 84.864 L 9.479 42.765 C 9.479 38.662 12.957 35.336 17.249 35.336 L 25.019 35.336 L 25.019 42.765 L 17.249 42.765 L 17.249 84.864 L 79.408 84.864 L 79.408 42.765 L 71.638 42.765 L 71.638 35.336 Z M 49.014 10.179 L 67.326 27.688 L 61.835 32.942 L 52.849 24.352 L 52.849 59.731 L 45.078 59.731 L 45.078 24.455 L 36.194 32.947 L 30.702 27.692 L 49.012 10.181 Z" p-id="4650" fill="#8a8a8a"></path>
    </svg>`
    );

    this.addSettingTab(new SettingTab(this.app, this));

    this.addCommand({
      id: "upload-all-images",
      name: "Upload all images",
      checkCallback: (checking: boolean) => {
        let leaf = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (leaf) {
          if (!checking) {
            void this.uploadAllFile();
          }
          return true;
        }
        return false;
      },
    });
    this.addCommand({
      id: "upload-all-images-in-vault",
      name: "Upload all images in vault",
      callback: () => {
        void this.scanAndUploadAllImagesInVault();
      },
    });
    this.addCommand({
      id: "download-all-images",
      name: "Download all images",
      checkCallback: (checking: boolean) => {
        let leaf = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (leaf) {
          if (!checking) {
            void downloadAllImageFiles(this);
          }
          return true;
        }
        return false;
      },
    });
    this.addCommand({
      id: "clean-unused-images",
      name: "Clean unused images",
      callback: () => {
        void this.cleanUnusedImages();
      },
    });
    this.addCommand({
      id: "delete-broken-image-links",
      name: "Delete broken image links",
      callback: () => {
        void this.deleteBrokenImageLinks();
      },
    });
    this.setupPasteHandler();
    this.registerFileMenu();
    this.registerSelection();
  }

  /**
   * 获取当前使用的上传器
   */
  getUploader() {
    const uploader = new UploaderManager(this.settings.uploader, this);

    return uploader;
  }

  /**
   * 上传图片
   */
  upload(images: Image[] | string[]) {
    let uploader = this.getUploader();
    return uploader.upload(images);
  }

  /**
   * 通过剪贴板上传图片
   */
  uploadByClipboard(fileList?: FileList) {
    let uploader = this.getUploader();
    return uploader.uploadByClipboard(fileList);
  }

  registerSelection() {
    this.registerEvent(
      this.app.workspace.on(
        "editor-menu",
        (menu: Menu, editor: Editor, info: MarkdownView | MarkdownFileInfo) => {
          if (this.app.workspace.getLeavesOfType("markdown").length === 0) {
            return;
          }
          const selection = editor.getSelection();
          if (selection) {
            const markdownRegex = /!\[.*\]\((.*)\)/g;
            const markdownMatch = markdownRegex.exec(selection);
            if (markdownMatch && markdownMatch.length > 1) {
              const markdownUrl = markdownMatch[1];
              if (
                this.settings.uploadedImages.find(
                  (item: { imgUrl: string }) => item.imgUrl === markdownUrl
                )
              ) {
                this.addRemoveMenu(menu, markdownUrl, editor);
              }
            }
          }
        }
      )
    );
  }

  addRemoveMenu = (menu: Menu, imgPath: string, editor: Editor) => {
    menu.addItem((item: MenuItem) =>
      item
        .setIcon("trash-2")
        .setTitle(t("Delete image using PicList"))
        .onClick(async () => {
          try {
            const selectedItem = this.settings.uploadedImages.find(
              (item: { imgUrl: string }) => item.imgUrl === imgPath
            );
            if (selectedItem) {
              const res = await this.picGoDeleter.deleteImage([selectedItem]);
              if (res.success) {
                new Notice(t("Delete successfully"));
                const selection = editor.getSelection();
                if (selection) {
                  editor.replaceSelection("");
                }
                this.settings.uploadedImages =
                  this.settings.uploadedImages.filter(
                    (item: { imgUrl: string }) => item.imgUrl !== imgPath
                  );
                this.saveSettings();
              } else {
                new Notice(t("Delete failed"));
              }
            }
          } catch {
            new Notice(t("Error, could not delete"));
          }
        })
    );
  };

  registerFileMenu() {
    this.registerEvent(
      this.app.workspace.on(
        "file-menu",
        (menu: Menu, file: TFile, source: string, leaf) => {
          if (source === "canvas-menu") return false;
          if (!isAssetTypeAnImage(file.path)) return false;

          menu.addItem((item: MenuItem) => {
            item
              .setTitle(t("upload"))
              .setIcon("upload")
              .onClick(() => {
                if (!(file instanceof TFile)) {
                  return false;
                }
                this.fileMenuUpload(file);
              });
          });
        }
      )
    );
  }

  fileMenuUpload(file: TFile) {
    let imageList: Image[] = [];
    const fileArray = this.helper.getAllFiles();

    for (const match of fileArray) {
      const imageName = match.name;
      const encodedUri = match.path;

      const fileName = basename(decodeURI(encodedUri));

      if (file && file.name === fileName) {
        if (isAssetTypeAnImage(file.path)) {
          imageList.push({
            path: file.path,
            name: imageName,
            source: match.source,
            file: file,
          });
        }
      }
    }

    if (imageList.length === 0) {
      new Notice(t("Can not find image file"));
      return;
    }

    this.upload(imageList).then(res => {
      if (!res.success) {
        new Notice("Upload error");
        return;
      }

      let uploadUrlList = res.result;
      this.replaceImage(imageList, uploadUrlList);
    });
  }

  filterFile(fileArray: Image[]) {
    const imageList: Image[] = [];

    for (const match of fileArray) {
      // 过滤掉 path 为空或 undefined 的无效数据
      if (!match.path) {
        continue;
      }

      if (match.path.startsWith("http")) {
        if (this.settings.workOnNetWork) {
          if (
            !this.helper.hasBlackDomain(
              match.path,
              this.settings.newWorkBlackDomains
            )
          ) {
            imageList.push({
              path: match.path,
              name: match.name,
              source: match.source,
            });
          }
        }
      } else {
        imageList.push({
          path: match.path,
          name: match.name,
          source: match.source,
        });
      }
    }

    return imageList;
  }

  /**
   * 替换上传的图片
   */
  replaceImage(imageList: Image[], uploadUrlList: string[]) {
    let content = this.helper.getValue();

    imageList.forEach(item => {
      const uploadImage = uploadUrlList.shift();

      let name = this.handleName(item.name);
      content = content.replaceAll(item.source, `![${name}](${uploadImage})`);
    });

    this.helper.setValue(content);

    if (this.settings.deleteSource) {
      imageList.forEach(image => {
        if (image.file && !image.path.startsWith("http")) {
          this.app.fileManager.trashFile(image.file);
        }
      });
    }
  }

  /**
   * 上传所有图片
   */
  uploadAllFile() {
    const activeFile = this.app.workspace.getActiveFile();
    const fileMap = arrayToObject(this.app.vault.getFiles(), "name");
    const filePathMap = arrayToObject(this.app.vault.getFiles(), "path");
    let imageList: (Image & { file: TFile | null })[] = [];
    const fileArray = this.filterFile(this.helper.getAllFiles());

    for (const match of fileArray) {
      const imageName = match.name;
      const uri = decodeURI(match.path);

      if (uri.startsWith("http")) {
        imageList.push({
          path: match.path,
          name: imageName,
          source: match.source,
          file: null,
        });
      } else {
        const fileName = basename(uri);
        let file: TFile | undefined | null;
        // 优先匹配绝对路径
        if (filePathMap[uri]) {
          file = filePathMap[uri];
        }

        // 相对路径
        if ((!file && uri.startsWith("./")) || uri.startsWith("../")) {
          const filePath = normalizePath(
            resolve(dirname(activeFile.path), uri)
          );

          file = filePathMap[filePath];
        }

        // 尽可能短路径
        if (!file) {
          file = fileMap[fileName];
        }

        if (file) {
          if (isAssetTypeAnImage(file.path)) {
            imageList.push({
              path: normalizePath(file.path),
              name: imageName,
              source: match.source,
              file: file,
            });
          }
        }
      }
    }

    if (imageList.length === 0) {
      new Notice(t("Can not find image file"));
      return;
    } else {
      new Notice(`Have found ${imageList.length} images`);
    }

    this.upload(imageList).then(res => {
      let uploadUrlList = res.result;
      if (imageList.length !== uploadUrlList.length) {
        new Notice(
          t("Warning: upload files is different of reciver files from api")
        );
        return;
      }
      const currentFile = this.app.workspace.getActiveFile();
      if (activeFile.path !== currentFile.path) {
        new Notice(t("File has been changedd, upload failure"));
        return;
      }

      this.replaceImage(imageList, uploadUrlList);
    });
  }

  /**
   * 扫描整个库并上传所有图片
   */
  async scanAndUploadAllImagesInVault() {
    const allFiles = this.app.vault.getFiles();
    const markdownFiles = allFiles.filter(file => file.extension === "md");

    if (markdownFiles.length === 0) {
      new Notice(t("No markdown files found in vault"));
      return;
    }

    new Notice(t("Scanning markdown files, please wait") + ` (${markdownFiles.length} ${t("files")})`);

    const fileMap = arrayToObject(this.app.vault.getFiles(), "name");
    const filePathMap = arrayToObject(this.app.vault.getFiles(), "path");
    const filesWithImages: Array<{
      file: TFile;
      images: (Image & { file: TFile | null })[];
    }> = [];
    let totalImages = 0;

    for (const mdFile of markdownFiles) {
      const content = await this.app.vault.read(mdFile);
      const imageLinks = this.helper.getImageLink(content);
      const filteredImages = this.filterFile(imageLinks);

      if (filteredImages.length > 0) {
        const imageList: (Image & { file: TFile | null })[] = [];

        for (const match of filteredImages) {
          const imageName = match.name;
          const uri = decodeURI(match.path);

          if (uri.startsWith("http")) {
            imageList.push({
              path: match.path,
              name: imageName,
              source: match.source,
              file: null,
            });
          } else {
            const fileName = basename(uri);
            let file: TFile | undefined | null;

            // 优先匹配绝对路径
            if (filePathMap[uri]) {
              file = filePathMap[uri];
            }

            // 相对路径
            if ((!file && uri.startsWith("./")) || uri.startsWith("../")) {
              const filePath = normalizePath(
                resolve(dirname(mdFile.path), uri)
              );
              file = filePathMap[filePath];
            }

            // 尽可能短路径
            if (!file) {
              file = fileMap[fileName];
            }

            if (file) {
              if (isAssetTypeAnImage(file.path)) {
                imageList.push({
                  path: normalizePath(file.path),
                  name: imageName,
                  source: match.source,
                  file: file,
                });
              }
            }
          }
        }

        if (imageList.length > 0) {
          filesWithImages.push({
            file: mdFile,
            images: imageList,
          });
          totalImages += imageList.length;
        }
      }
    }

    if (filesWithImages.length === 0) {
      new Notice(t("Can not find image file"));
      return;
    }

    new Notice(t("Found files with images") + `: ${filesWithImages.length}, ` + t("Total images") + `: ${totalImages}`);

    // 处理每个文件的图片上传
    let processedCount = 0;
    let failedCount = 0;

    for (const { file: mdFile, images: imageList } of filesWithImages) {
      try {
        const res = await this.upload(imageList);
        let uploadUrlList = res.result;

        if (imageList.length !== uploadUrlList.length) {
          new Notice(
            `${mdFile.name}: ` + t("Warning: upload files is different of reciver files from api")
          );
          failedCount++;
          continue;
        }

        // 更新文件内容
        let content = await this.app.vault.read(mdFile);
        imageList.forEach(item => {
          const uploadImage = uploadUrlList.shift();
          let name = this.handleName(item.name);
          content = content.replaceAll(item.source, `![${name}](${uploadImage})`);
        });
        await this.app.vault.modify(mdFile, content);

        // 删除源文件
        if (this.settings.deleteSource) {
          imageList.forEach(image => {
            if (image.file && !image.path.startsWith("http")) {
              this.app.fileManager.trashFile(image.file);
            }
          });
        }

        processedCount++;
      } catch (error) {
        console.error(`Failed to process ${mdFile.name}:`, error);
        failedCount++;
      }
    }

    new Notice(
      t("Scan complete") + `: ${processedCount}/${filesWithImages.length} ` + t("files processed") +
      (failedCount > 0 ? `, ${failedCount} ` + t("failed") : "")
    );
  }

  /**
   * 清理仓库中未被引用的无用图片
   */
  async cleanUnusedImages() {
    const allFiles = this.app.vault.getFiles();
    const allImageFiles = allFiles.filter(file => isAssetTypeAnImage(file.path));
    const markdownFiles = allFiles.filter(file => file.extension === "md");

    if (allImageFiles.length === 0) {
      new Notice(t("No image files found in vault"));
      return;
    }

    new Notice(t("Scanning for unused images") + ` (${allImageFiles.length} ${t("Total images")})`);

    // 收集所有被引用的图片路径
    const referencedImages = new Set<string>();

    for (const mdFile of markdownFiles) {
      const content = await this.app.vault.read(mdFile);
      const imageLinks = this.helper.getImageLink(content);

      for (const image of imageLinks) {
        const imagePath = decodeURI(image.path);
        // 网络图片不计入
        if (imagePath.startsWith("http")) {
          continue;
        }

        // 尝试解析引用的图片文件
        const fileMap = arrayToObject(this.app.vault.getFiles(), "name");
        const filePathMap = arrayToObject(this.app.vault.getFiles(), "path");
        const fileName = basename(imagePath);
        let referencedFile: TFile | undefined | null;

        // 优先匹配绝对路径
        if (filePathMap[imagePath]) {
          referencedFile = filePathMap[imagePath];
        }

        // 相对路径
        if (!referencedFile && (imagePath.startsWith("./") || imagePath.startsWith("../"))) {
          const filePath = normalizePath(
            resolve(dirname(mdFile.path), imagePath)
          );
          referencedFile = filePathMap[filePath];
        }

        // 尽可能短路径
        if (!referencedFile) {
          referencedFile = fileMap[fileName];
        }

        if (referencedFile) {
          referencedImages.add(referencedFile.path);
        }
      }
    }

    // 找出未被引用的图片
    const unusedImages = allImageFiles.filter(
      file => !referencedImages.has(file.path)
    );

    if (unusedImages.length === 0) {
      new Notice(t("No unused images found"));
      return;
    }

    // 显示扫描结果并直接执行删除
    new Notice(t("Found unused images") + `: ${unusedImages.length}, ` + t("Moving to trash") + "...");

    // 直接执行删除，将文件移动到回收站
    let deletedCount = 0;
    for (const imageFile of unusedImages) {
      try {
        this.app.fileManager.trashFile(imageFile);
        deletedCount++;
      } catch (error) {
        console.error(`Failed to delete ${imageFile.path}:`, error);
      }
    }

    new Notice(
      t("Cleanup complete") + `: ${deletedCount}/${unusedImages.length} ` + t("images moved to trash")
    );
  }

  /**
   * 删除所有笔记中引用的不存在的图片链接
   */
  async deleteBrokenImageLinks() {
    const allFiles = this.app.vault.getFiles();
    const markdownFiles = allFiles.filter(file => file.extension === "md");

    if (markdownFiles.length === 0) {
      new Notice(t("No markdown files found in vault"));
      return;
    }

    new Notice(t("Scanning for broken image links") + ` (${markdownFiles.length} ${t("files")})`);

    const fileMap = arrayToObject(this.app.vault.getFiles(), "name");
    const filePathMap = arrayToObject(this.app.vault.getFiles(), "path");
    let totalBrokenLinks = 0;
    let processedFiles = 0;

    for (const mdFile of markdownFiles) {
      let content = await this.app.vault.read(mdFile);
      const imageLinks = this.helper.getImageLink(content);
      let modifiedContent = content;

      for (const image of imageLinks) {
        const imagePath = decodeURI(image.path);

        // 跳过网络图片
        if (imagePath.startsWith("http")) {
          continue;
        }

        // 检查引用的图片文件是否存在
        const fileName = basename(imagePath);
        let fileExists = false;

        // 优先匹配绝对路径
        if (filePathMap[imagePath]) {
          fileExists = true;
        }

        // 相对路径
        if (!fileExists && (imagePath.startsWith("./") || imagePath.startsWith("../"))) {
          const filePath = normalizePath(
            resolve(dirname(mdFile.path), imagePath)
          );
          if (filePathMap[filePath]) {
            fileExists = true;
          }
        }

        // 尽可能短路径
        if (!fileExists && fileMap[fileName]) {
          fileExists = true;
        }

        // 如果文件不存在，删除这个图片链接
        if (!fileExists) {
          modifiedContent = modifiedContent.replace(image.source, "");
          totalBrokenLinks++;
        }
      }

      // 只有当内容确实发生变化时才写入文件
      if (modifiedContent !== content) {
        await this.app.vault.modify(mdFile, modifiedContent);
        processedFiles++;
      }
    }

    if (totalBrokenLinks === 0) {
      new Notice(t("No broken image links found"));
    } else {
      new Notice(
        t("Broken links cleanup complete") + `: ${processedFiles} ` + t("files processed") +
        `, ${totalBrokenLinks} ` + t("links removed")
      );
    }
  }

  setupPasteHandler() {
    this.registerEvent(
      this.app.workspace.on(
        "editor-paste",
        (evt: ClipboardEvent, editor: Editor, markdownView: MarkdownView) => {
          const allowUpload = this.helper.getFrontmatterValue(
            "image-enhance",
            this.settings.uploadByClipSwitch
          );

          let files = evt.clipboardData.files;
          if (!allowUpload) {
            return;
          }

          // 剪贴板内容有md格式的图片时
          if (this.settings.workOnNetWork) {
            const clipboardValue = evt.clipboardData.getData("text/plain");
            const imageList = this.helper
              .getImageLink(clipboardValue)
              .filter(image => image.path.startsWith("http"))
              .filter(
                image =>
                  !this.helper.hasBlackDomain(
                    image.path,
                    this.settings.newWorkBlackDomains
                  )
              );

            if (imageList.length !== 0) {
              this.upload(imageList).then(res => {
                let uploadUrlList = res.result;
                this.replaceImage(imageList, uploadUrlList);
              });
            }
          }

          // 剪贴板中是图片时进行上传
          if (this.canUpload(evt.clipboardData)) {
            this.uploadFileAndEmbedImgurImage(
              editor,
              async (editor: Editor, pasteId: string) => {
                let res: any;
                res = await this.uploadByClipboard(evt.clipboardData.files);

                if (!res.success) {
                  this.handleFailedUpload(editor, pasteId, res.msg);
                  return;
                }
                const url = res.result[0];

                return url;
              },
              evt.clipboardData
            ).catch();
            evt.preventDefault();
          }
        }
      )
    );
    this.registerEvent(
      this.app.workspace.on(
        "editor-drop",
        async (evt: DragEvent, editor: Editor, markdownView: MarkdownView) => {
          // when ctrl key is pressed, do not upload image, because it is used to set local file
          if (evt.ctrlKey) {
            return;
          }
          const allowUpload = this.helper.getFrontmatterValue(
            "image-enhance",
            this.settings.uploadByClipSwitch
          );

          if (!allowUpload) {
            return;
          }

          let files = evt.dataTransfer.files;
          if (files.length !== 0 && files[0].type.startsWith("image")) {
            let sendFiles: Array<string> = [];
            let files = evt.dataTransfer.files;
            Array.from(files).forEach((item, index) => {
              if (item.path) {
                sendFiles.push(item.path);
              } else {
                const { webUtils } = require("electron");
                const path = webUtils.getPathForFile(item);
                sendFiles.push(path);
              }
            });
            evt.preventDefault();

            const data = await this.upload(sendFiles);

            if (data.success) {
              data.result.map((value: string) => {
                let pasteId = (Math.random() + 1).toString(36).substring(2, 7);
                this.insertTemporaryText(editor, pasteId);
                this.embedMarkDownImage(editor, pasteId, value, files[0].name);
              });
            } else {
              new Notice("Upload error");
            }
          }
        }
      )
    );
  }

  canUpload(clipboardData: DataTransfer) {
    const files = clipboardData.files;
    const text = clipboardData.getData("text");

    const hasImageFile =
      files.length !== 0 && files[0].type.startsWith("image");
    if (hasImageFile) {
      if (text.length > 0) {
        return this.settings.applyImage;
      } else {
        return true;
      }
    } else {
      return false;
    }
  }

  async uploadFileAndEmbedImgurImage(
    editor: Editor,
    callback: (editor: Editor, pasteId: string) => Promise<string>,
    clipboardData: DataTransfer
  ) {
    let pasteId = (Math.random() + 1).toString(36).substr(2, 5);
    this.insertTemporaryText(editor, pasteId);
    const name = clipboardData.files[0].name;

    try {
      const url = await callback(editor, pasteId);
      this.embedMarkDownImage(editor, pasteId, url, name);
    } catch (e) {
      this.handleFailedUpload(editor, pasteId, e);
    }
  }

  insertTemporaryText(editor: Editor, pasteId: string) {
    let progressText = imageEnhancePlugin.progressTextFor(pasteId);
    editor.replaceSelection(progressText + "\n");
  }

  private static progressTextFor(id: string) {
    return `![Uploading file...${id}]()`;
  }

  embedMarkDownImage(
    editor: Editor,
    pasteId: string,
    imageUrl: string,
    name: string = ""
  ) {
    let progressText = imageEnhancePlugin.progressTextFor(pasteId);
    name = this.handleName(name);

    let markDownImage = `![${name}](${imageUrl})`;

    imageEnhancePlugin.replaceFirstOccurrence(
      editor,
      progressText,
      markDownImage
    );
  }

  handleFailedUpload(editor: Editor, pasteId: string, reason: string | Error) {
    const message = typeof reason === "string" ? reason : reason.message;
    new Notice(message);
    console.error("Failed request: ", reason);
    let progressText = imageEnhancePlugin.progressTextFor(pasteId);
    imageEnhancePlugin.replaceFirstOccurrence(
      editor,
      progressText,
      "⚠️upload failed, check dev console"
    );
  }

  handleName(name: string) {
    const imageSizeSuffix = this.settings.imageSizeSuffix || "";

    if (this.settings.imageDesc === "origin") {
      return `${name}${imageSizeSuffix}`;
    } else if (this.settings.imageDesc === "none") {
      return "";
    } else if (this.settings.imageDesc === "removeDefault") {
      if (name === "image.png") {
        return "";
      } else {
        return `${name}${imageSizeSuffix}`;
      }
    } else {
      return `${name}${imageSizeSuffix}`;
    }
  }

  static replaceFirstOccurrence(
    editor: Editor,
    target: string,
    replacement: string
  ) {
    let lines = editor.getValue().split("\n");
    for (let i = 0; i < lines.length; i++) {
      let ch = lines[i].indexOf(target);
      if (ch != -1) {
        let from = { line: i, ch: ch };
        let to = { line: i, ch: ch + target.length };
        editor.replaceRange(replacement, from, to);
        break;
      }
    }
  }
}
