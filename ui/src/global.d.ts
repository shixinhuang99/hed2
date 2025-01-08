declare const PKG_NAME: string;
declare const PKG_VERSION: string;

interface IpcResult<T> {
  data: T;
  error?: string;
}

interface Window {
  electronAPI: {
    readSystemHosts: () => Promise<IpcResult<string>>;
    writeSystemHosts: (content: string) => Promise<IpcResult<undefined>>;
    viewGithub: () => void;
    openHostsDir: () => void;
    setTheme: (theme: string) => void;
  };
}
