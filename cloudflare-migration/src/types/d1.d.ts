// Cloudflare D1データベースの型定義
export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  name?: string;
  id?: string;
  toString(): string;
}

export interface D1PreparedStatement {
  bind(...params: any[]): {
    all<T>(): Promise<D1Result<T>>;
    run(): Promise<{
      success: boolean;
      lastRowId?: number;
      changes?: number;
    }>;
  };
}

export interface D1Result<T> {
  results: T[];
  success: boolean;
  lastRowId?: number;
  changes?: number;
}

// Cloudflare Workersの実行コンテキスト
declare global {
  interface ExecutionContext {
    waitUntil(promise: Promise<any>): void;
  }
}

// グローバルスコープにCrypto APIの型定義を追加
interface SubtleCrypto {
  importKey(
    format: 'raw',
    keyData: BufferSource,
    algorithm: HmacImportParams | AesKeyGenParams | HmacKeyGenParams,
    extractable: boolean,
    keyUsages: KeyUsage[]
  ): Promise<CryptoKey>;

  sign(
    algorithm: AlgorithmIdentifier,
    key: CryptoKey,
    data: BufferSource
  ): Promise<ArrayBuffer>;
} 