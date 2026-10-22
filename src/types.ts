export interface Item {
  id: string;
  done: boolean;
}
export interface RackData {
  rack: number;
  items: Item[];
}
export interface Lot {
  id: number;
  start: number;
  racks: RackData[];
}
export interface OcrResult {
  rack: number | null;
  ids: string[];
  raw: string;
}
export interface SaveResult {
  lot: number;
  rack: number;
  added: number;
  updated: number;
}

/** A rack photo that has been taken/picked and is waiting to be confirmed. */
export interface Draft {
  key: number;
  /** Small JPEG data URL used for previews. */
  thumb: string;
  rack: string;
  idsText: string;
  newLot: boolean;
  reading: boolean;
  noPt: boolean;
  error: string | null;
}

export interface ChatUserMsg {
  id: string;
  role: 'user';
  thumb: string;
  rack: number;
  count: number;
}

export interface ChatAssistantMsg {
  id: string;
  role: 'assistant';
  status: 'pending' | 'ok' | 'error';
  rack: number;
  ids: string[];
  newLot: boolean;
  result?: SaveResult;
  error?: string;
}

export type ChatMsg = ChatUserMsg | ChatAssistantMsg;
