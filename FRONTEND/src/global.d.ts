interface ImportMeta {
  readonly env: {
    readonly VITE_BACKEND_URL: string;
    readonly VITE_PUBLIC_TOKEN: string;
  };
}

interface ImportMetaEnv extends ImportMeta {
  readonly env: ImportMeta['env'];
}
