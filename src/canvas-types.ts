export type CanvasElementType = "pencil" | "rect" | "circle" | "text" | "image";

export interface CanvasElement {
  id: string;
  type: CanvasElementType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  points?: number[];
  stroke?: string;
  strokeWidth?: number;
  fill?: string;
  text?: string;
  src?: string;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
}

export interface CanvasState {
  elements: CanvasElement[];
}
