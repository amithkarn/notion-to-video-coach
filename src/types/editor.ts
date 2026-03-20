export type BlockType = 'heading' | 'text' | 'image' | 'math';

export type SlideLayout = 'default' | 'centered' | 'title-top';

export interface SpeechHighlight {
  id: string;
  startIndex: number;
  endIndex: number;
  word: string;
  blockId?: string;
  /** Character offset of this specific word occurrence within the block's content */
  blockCharStart?: number;
  blockCharEnd?: number;
}

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
  layout: SlideLayout;
  speechHighlights: SpeechHighlight[];
}

export interface Presentation {
  slides: Slide[];
}

export type EditorMode = 'page' | 'slides' | 'playback';
