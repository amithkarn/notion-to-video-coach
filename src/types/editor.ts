export type BlockType = 'heading' | 'text' | 'image' | 'math';

export interface Block {
  id: string;
  type: BlockType;
  content: string;
}

export interface Slide {
  id: string;
  blocks: Block[];
  speech: string;
  sourceNodeIndices: number[];
}

export interface Presentation {
  slides: Slide[];
}

export type EditorMode = 'page' | 'slides' | 'playback';
