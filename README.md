[English](README-en.md)

# Obsidian 图片增强插件

这是一个 Obsidian 插件，支持通过 PicGo、PicList、PicGo-Core 将图片自动上传到图床。主要功能包括：

- **剪贴板自动上传** - 粘贴图片时自动上传并替换为图床链接
- **批量上传** - 一键上传当前文件中的所有图片
- **批量下载** - 将当前文件中的网络图片下载到本地
- **图片清理** - 清理库中未被引用的无用图片
- **删除失效链接** - 删除指向不存在图片的链接
- **多种上传方式** - 支持右键菜单、拖拽上传
- **灵活配置** - 支持 frontmatter 控制单个文件的上传行为

**更新插件后记得重启 Obsidian**

**未在 Mac 进行测试**

---

# 快速开始

1. 安装 [PicGo](https://github.com/Molunerfinn/PicGo) 工具并进行配置
2. 开启 PicGo 的 Server 服务，并记住端口号
3. 安装本插件
4. 打开插件设置，设置为 `http://127.0.0.1:{{PicGo设置的端口号}}/upload`（例如：`http://127.0.0.1:36677/upload`）
5. 尝试粘贴图片，测试上传是否成功

## 设置图床和配置名

如果你使用的是 PicList（version >= 2.5.3），可以通过 URL 参数设置图床和配置名。

例如：`http://127.0.0.1:36677/upload?picbed=smms&configName=piclist`

这将会上传图片到 `smms` 图床，并使用配置名为 `piclist` 的图床设置。使用这个功能，你可以在不同的 Obsidian vault 中上传到不同的图床。

---

# 功能特性

## 剪贴板上传

粘贴图片到 Obsidian 时，插件会自动上传图片。

支持的图片格式：`.png`、`.jpg`、`.jpeg`、`.bmp`、`.gif`、`.svg`、`.tiff`、`.webp`、`.avif`

可以通过 frontmatter 控制单个文件是否自动上传（默认为 `true`）：

```yaml
---
image-enhance: true
---
```

> 注意：该功能在 PicGo 2.3.0-beta7 版本中存在 bug，请使用其他版本。

## 批量上传当前文件的所有图片

按 `Ctrl+P`（Mac 为 `Cmd+P`）呼出命令面板，输入 `Upload all images`，按回车即可自动上传当前文件中的所有图片。

路径解析优先级：
1. 绝对路径（基于库的绝对路径）
2. 相对路径（以 `./` 或 `../` 开头）
3. 尽可能简短的形式

## 上传整个库的图片

按 `Ctrl+P` 呼出命令面板，输入 `Upload all images in vault`，按回车即可扫描整个库并上传所有 Markdown 文件中的图片。

## 批量下载网络图片

按 `Ctrl+P` 呼出命令面板，输入 `Download all images`，按回车即可将当前文件中的所有网络图片下载到本地。

## 清理无用图片

按 `Ctrl+P` 呼出命令面板，输入 `Clean unused images`，按回车即可扫描并删除库中未被任何 Markdown 文件引用的图片文件（移至回收站）。

## 删除失效图片链接

按 `Ctrl+P` 呼出命令面板，输入 `Delete broken image links`，按回车即可删除所有笔记中指向不存在图片的链接内容。

## 右键菜单上传

在编辑模式下，可以右键点击文件列表中的图片进行上传。

支持标准 Markdown 语法和 Wiki 链接语法，支持相对路径和绝对路径。

## 拖拽上传

支持拖拽图片文件到编辑器进行上传（仅在使用 PicGo 或 PicList 客户端时生效）。

## 支持 PicGo-Core

### 安装

参考 [官方文档：全局安装](https://picgo.github.io/PicGo-Core-Doc/zh/guide/getting-started.html#%E5%85%A8%E5%B1%80%E5%AE%89%E8%A3%85)

### 配置

参考 [官方文档：配置](https://picgo.github.io/PicGo-Core-Doc/zh/guide/config.html#%E9%BB%98%E8%AE%A4%E9%85%8D%E7%BD%AE%E6%96%87%E4%BB%B6)

### 插件配置

1. `Default uploader` 选择 `PicGo-Core`
2. 设置路径，默认为空（使用环境变量），也可设置自定义路径

## 远程服务器模式

你可以将 [PicList](https://github.com/Kuingsmile/PicList/releases) 或 [PicList-Core](https://github.com/Kuingsmile/PicList-Core) 部署在服务器上并启用 server 模式来实现图片上传。

支持 [PicList](https://github.com/Kuingsmile/PicList/releases) 2.6.3 及以上版本或 [PicList-Core](https://github.com/Kuingsmile/PicList-Core) 1.3.0 及以上版本。

> 注意：该模式下不支持上传网络图片。如果粘贴时上传图片失败，也可以尝试启用该模式。

---

# 常见问题

### macOS 下无法上传

参考 [#160](https://github.com/wheesys/obsidian-image-enhance-plugin/issues/160)、[#20](https://github.com/wheesys/obsidian-image-enhance-plugin/issues/20)

---

# 开发计划

- [x] 支持批量上传
- [x] 支持 YAML 设置是否开启上传
- [x] 支持 PicGo-Core
- [x] 支持复制系统图片文件
- [x] 支持网络图片
- [x] 扫描整个库上传图片
- [x] 清理无用图片
- [x] 删除失效图片链接
- [ ] 支持手机端
- [ ] 支持更多图床适配器

---

# 开发

## 安装依赖

```bash
pnpm install
```

## 开发模式

```bash
pnpm run dev
```

## 构建

```bash
pnpm run build
```

---

# 致谢

[obsidian-imgur-plugin](https://github.com/gavvvr/obsidian-imgur-plugin)
[obsidian-image-auto-upload-plugin](https://github.com/renmu123/obsidian-image-auto-upload-plugin)
