export interface InitialValuesType {
  maxFileSizeInMB: number;
  quality: number;
  format?: 'keep' | 'image/jpeg' | 'image/png' | 'image/webp';
  maxWidthOrHeight?: number;
}

export interface CompressionExecution {
  signal?: AbortSignal;
  onProgress?: (percent: number) => void;
}
