export type RendererMode = 'edit' | 'preview';

export interface OptionItem {
  label: string;
  value: string | number | boolean;
  children?: OptionItem[];
}

export interface TransferItem {
  key: string | number;
  label: string;
  disabled?: boolean;
}

export interface DraggableChangeEvent<T> {
  added?: {
    element: T;
  };
}
