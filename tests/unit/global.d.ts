import "@types/jest";

declare global {
  namespace NodeJS {
    interface Global {
      fetch: typeof fetch;
    }
  }
}

// テスト関連の型を拡張
declare namespace jest {
  interface Matchers<R> {
    toHaveBeenCalledWith: (...args: any[]) => R;
  }
}

export {};
