import { extname } from "path-browserify";

export interface IStringKeyMap<T> {
  [key: string]: T;
}

// Type for Node.js Readable stream (used in Electron environment)
interface ReadableStream {
  [Symbol.asyncIterator](): AsyncIterator<Buffer>;
}

export async function streamToString(stream: ReadableStream): Promise<string> {
  const chunks: Buffer[] = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- Buffer.concat accepts Buffer[] in Node.js/Electron environment
  return Buffer.concat(chunks).toString("utf-8");
}

const IMAGE_EXT_LIST = [
  ".png",
  ".jpg",
  ".jpeg",
  ".bmp",
  ".gif",
  ".svg",
  ".tiff",
  ".webp",
  ".avif",
];

export function isAnImage(ext: string): boolean {
  return IMAGE_EXT_LIST.includes(ext.toLowerCase());
}

export function isAssetTypeAnImage(path: string): boolean {
  return isAnImage(extname(path));
}

export function getUrlAsset(url: string) {
  return (url = url.substring(1 + url.lastIndexOf("/")).split("?")[0]).split(
    "#"
  )[0];
}

export function getLastImage(list: string[]) {
  const reversedList = list.reverse();
  let lastImage;
  reversedList.forEach(item => {
    if (item && item.startsWith("http")) {
      lastImage = item;
      return item;
    }
  });
  return lastImage;
}

export function arrayToObject<T>(
  arr: T[],
  key: string
): Record<string, T> {
  const obj: Record<string, T> = {};
  arr.forEach(element => {
    const keyValue = (element as Record<string, unknown>)[key] as string;
    obj[keyValue] = element;
  });
  return obj;
}

export function bufferToArrayBuffer(buffer: Buffer) {
  const arrayBuffer = new ArrayBuffer(buffer.length);
  const view = new Uint8Array(arrayBuffer);
  for (let i = 0; i < buffer.length; i++) {
    view[i] = buffer[i];
  }
  return arrayBuffer;
}

export function arrayBufferToBuffer(arrayBuffer: ArrayBuffer) {
  const buffer = Buffer.alloc(arrayBuffer.byteLength);
  const view = new Uint8Array(arrayBuffer);
  for (let i = 0; i < buffer.length; ++i) {
    buffer[i] = view[i];
  }
  return buffer;
}

export function uuid() {
  return Math.random().toString(36).slice(2);
}
