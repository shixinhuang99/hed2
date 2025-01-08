import { Ipc } from './abstract';

export class ElectronIpc extends Ipc {
  async readSystemHosts(): Promise<string> {
    const result = await window.electronAPI.readSystemHosts();
    if (result.error) {
      throw new Error(result.error);
    }
    return result.data;
  }

  async writeSystemHosts(content: string): Promise<void> {
    const result = await window.electronAPI.writeSystemHosts(content);
    if (result.error) {
      throw new Error(result.error);
    }
  }

  async viewGitHub(): Promise<void> {
    window.electronAPI.viewGithub();
  }

  async openHostsDir(): Promise<void> {
    window.electronAPI.openHostsDir();
  }

  async setTheme(theme: string): Promise<void> {
    window.electronAPI.setTheme(theme);
  }
}
