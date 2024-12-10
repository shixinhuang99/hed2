export interface Group {
  name: string;
  text: string;
  list: Item[];
  system: boolean;
  enabled: boolean;
}

export interface Item {
  ip: string;
  hosts: Host[];
  group: string;
}

export interface Host {
  content: string;
  enabled: boolean;
}
