export class App {
  workspace = {
    getActiveFile: () => ({ path: "mock/path" }),
    getActiveViewOfType: () => ({
      editor: {
        getValue: () => "",
        setValue: (_value: string) => {},
        getScrollInfo: () => ({ left: 0, top: 0 }),
        scrollTo: (_left: number, _top: number) => {},
        getCursor: () => ({ line: 0, ch: 0 }),
        setCursor: (_pos: { line: number; ch: number }) => {},
      },
    }),
  };
  metadataCache = {
    getCache: (_path: string) => ({
      frontmatter: {
        key: "value",
      },
    }),
  };
}

export class MarkdownView {}
