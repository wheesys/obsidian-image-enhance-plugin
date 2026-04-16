# 代码规范 - Obsidian 插件扫描要求

本文档记录了 Obsidian 插件扫描工具要求的代码规范，后续开发中必须遵守。

## ESLint 代码规范

### 变量声明

**规则：** 使用 `const` 而不是 `let`，除非变量需要重新赋值。

```typescript
// ❌ 错误
let value = getValue();
let list = [];

// ✅ 正确
const value = getValue();
const list = [];
```

### 未使用的参数

**规则：** 未使用的函数参数必须使用 `_` 前缀标记。

```typescript
// ❌ 错误
function handleClick(event, info) {
  console.log(event);
}

// ✅ 正确
function handleClick(event, _info) {
  console.log(event);
}
```

### Promise 处理

**规则：** Promise 必须被正确处理：
- 添加 `void` 标记（当不需要等待结果时）
- 使用 `await`（当需要等待结果时）
- 添加 `.catch()` 处理错误

```typescript
// ❌ 错误
this.uploadAllFile();
this.app.fileManager.trashFile(file);

// ✅ 正确
void this.uploadAllFile();
void this.app.fileManager.trashFile(file);

// ✅ 正确（需要等待结果）
const result = await this.uploadAllFile();
```

### 在 forEach 中调用异步方法

**规则：** 避免在 `forEach` 中调用返回 Promise 的函数，使用 `for...of` 循环。

```typescript
// ❌ 错误
imageList.forEach(image => {
  this.app.fileManager.trashFile(image.file); // 返回 Promise 但未处理
});

// ✅ 正确
for (const image of imageList) {
  void this.app.fileManager.trashFile(image.file);
}
```

## UI 文本规范

### Sentence Case

**规则：** UI 文本使用 sentence case（句首大写），而非 title case。

```typescript
// ❌ 错误
"Plugin Settings"
"Network Domain Black List"
"Moving to trash"

// ✅ 正确
"Plugin settings"
"Network domain blacklist"
"Moving to system trash"
```

### 描述文本

**规则：** 描述文本应该是完整的句子，首字母大写，使用正确的标点符号。

```typescript
// ❌ 错误
"upload route, use PicList will be able to set picbed and config through query"
"like |300 for resize image in ob."

// ✅ 正确
"Upload route. Use PicList to set picbed and config through query."
"Like |300 for resize image in Obsidian."
```

### 专有名词

**规则：** 保持专有名词的正确大小写。

- `PicGo` (不是 picgo 或 PICGO)
- `GitHub` (不是 Github 或 GITHUB)
- `Obsidian` (不是 obsidian 或 ob.)

## Node.js 模块导入规范

**规则：** 避免直接使用 `require()` 导入 Node.js 内置模块。

如果必须在 Electron 桌面端使用 Node.js 模块：

1. 添加 `typeof require === "undefined"` 检查
2. 添加注释说明模块只在桌面端可用
3. 确保移动端不会执行这些代码路径

```typescript
// ✅ 正确模式
if (typeof require === "undefined") {
  throw new Error("fs module is only available in desktop app");
}
// Electron environment: fs module is only available in desktop app
const fs = require("fs");
```

## 禁止的模块导入

以下 Node.js 内置模块在 Obsidian 插件扫描中被标记为禁止：

- `fs` - 文件系统模块
- `child_process` - 子进程模块

**替代方案：** 使用 Obsidian API 或在 Electron 环境中添加条件检查。

## ESLint 配置

项目已关闭以下规则（因为 Electron 环境需要）：

```json
{
  "@typescript-eslint/no-var-requires": "off",
  "@typescript-eslint/no-unsafe-argument": "off"
}
```

## 检查清单

提交代码前，请确保：

- [ ] 运行 `pnpm run lint` 无错误
- [ ] 运行 `npx tsc --noEmit` 无类型错误
- [ ] 所有 `let` 变量检查是否应为 `const`
- [ ] 所有未使用的参数已添加 `_` 前缀
- [ ] 所有 Promise 调用已正确处理
- [ ] UI 文本使用 sentence case
- [ ] 专有名词大小写正确
- [ ] Node.js 模块导入已添加检查
