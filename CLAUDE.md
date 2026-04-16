# Obsidian Image Enhance Plugin - Claude AI 上下文

## 项目概述

Obsidian 图片增强插件，支持通过 PicGo/PicList 上传剪贴板或本地图片。

## 技术栈

- TypeScript
- Obsidian API
- Rollup (打包)
- Vitest (测试)
- pnpm (包管理)

## 开发规范

> **重要：** 提交代码前请阅读 [代码规范文档](doc/CODING_STANDARDS.md)，确保符合 Obsidian 插件扫描要求。

### 版本管理规范

**版本修改必须同时更新以下文件中的版本号：**

1. **manifest.json** - `version` 字段
2. **package.json** - `version` 字段

### 版本号格式

遵循语义化版本 (Semantic Versioning) 格式：`MAJOR.MINOR.PATCH`

- **MAJOR** - 不兼容的 API 修改
- **MINOR** - 向下兼容的功能性新增
- **PATCH** - 向下兼容的问题修正

### 版本发布流程

1. 更新 `manifest.json` 和 `package.json` 中的版本号
2. 更新 `CHANGELOG.md` 记录变更内容
3. 运行 `npm run build` 构建项目
4. 提交代码并创建 Git Tag

### 当前版本

- **1.0.0** (2025-02-25)

## 代码结构

```
src/
├── main.ts          # 插件主入口，命令注册
├── helper.ts        # 辅助类，图片链接解析
├── utils.ts         # 工具函数
├── uploader/        # 上传器实现
├── deleter.ts       # 图片删除功能
├── download.ts      # 图片下载功能
├── setting.ts       # 设置页面
└── lang/
    ├── helpers.ts   # 国际化帮助函数
    └── locale/      # 语言文件 (en, zh-cn, etc.)
```

## 现有命令

| ID | 名称 | 说明 |
|---|---|---|
| `Upload all images` | 上传所有图片 | 上传当前文件中的所有图片 |
| `Upload all images in vault` | 上传库中所有图片 | 扫描整个库并上传所有图片 |
| `Download all images` | 下载所有图片 | 下载当前文件中的所有网络图片 |
| `Clean unused images` | 清理无用图片 | 删除库中未被引用的图片文件 |
| `Delete broken image links` | 删除失效图片链接 | 删除指向不存在图片的链接 |

## 添加新命令的步骤

1. 在 `src/main.ts` 的 `onload()` 方法中注册命令：
```typescript
this.addCommand({
  id: "command-id",
  name: "Command Name",
  callback: () => {
    this.commandMethod();
  },
});
```

2. 实现命令方法（参考现有方法如 `cleanUnusedImages()`）

3. 在 `src/lang/locale/en.ts` 添加英文翻译

4. 在 `src/lang/locale/zh-cn.ts` 添加中文翻译

5. 运行 `npm run build` 验证构建

## 图片链接解析

插件支持以下图片链接格式：
- 标准 Markdown: `![alt](path.png)`
- 带引号的描述: `![alt](path.png "desc")`
- 尖括号包裹: `![](<path with spaces.png>)`
- Wiki 链接: `![[image.png]]` 或 `![[image.png\|alt]]`

## 代码原则

- **KISS**: 保持代码简单
- **DRY**: 复用现有方法（如 `helper.getImageLink()`, `isAssetTypeAnImage()`, `arrayToObject()`）
- **单一职责**: 每个方法只做一件事
- 文件超过 1000 行时考虑拆分
