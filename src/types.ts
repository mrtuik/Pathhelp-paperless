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
