import { Slide } from '@/types/editor';
import { generateId } from './generateId';

/**
 * Smart slide generation from TipTap JSON content.
 */
const MAX_TEXT_LENGTH_PER_SLIDE = 600;

interface TiptapNode {
  type: string;
  attrs?: Record<string, any>;
  content?: TiptapNode[];
  text?: string;
}

function extractText(node: TiptapNode): string {
  if (node.text) return node.text;
  if (!node.content) return '';
  return node.content.map(extractText).join('');
}

interface SlideBlock {
  type: 'heading' | 'text' | 'image' | 'math';
  content: string;
}

export function tiptapToBlocks(doc: TiptapNode): SlideBlock[] {
  const blocks: SlideBlock[] = [];
  if (!doc.content) return blocks;

  for (const node of doc.content) {
    if (node.type === 'heading') {
      blocks.push({ type: 'heading', content: extractText(node) });
    } else if (node.type === 'paragraph') {
      const text = extractText(node);
      if (text.trim()) blocks.push({ type: 'text', content: text });
    } else if (node.type === 'bulletList' || node.type === 'orderedList') {
      const items = (node.content || []).map(li => '• ' + extractText(li)).join('\n');
      if (items.trim()) blocks.push({ type: 'text', content: items });
    } else if (node.type === 'imageBlock') {
      blocks.push({ type: 'image', content: node.attrs?.src || '' });
    } else if (node.type === 'mathBlock') {
      blocks.push({ type: 'math', content: node.attrs?.latex || '' });
    }
  }
  return blocks;
}

export function generateSlidesFromContent(jsonContent: string): Slide[] {
  let doc: TiptapNode;
  try {
    doc = JSON.parse(jsonContent);
  } catch {
    return [];
  }

  const blocks = tiptapToBlocks(doc);
  if (blocks.length === 0) return [];

  const slides: Slide[] = [];
  let currentBlocks: (SlideBlock & { sourceIndex: number })[] = [];
  let currentTextLength = 0;

  const flushSlide = () => {
    if (currentBlocks.length > 0) {
      slides.push({
        id: generateId(),
        blocks: currentBlocks.map(b => ({ id: generateId(), type: b.type, content: b.content })),
        speech: generateSpeech(currentBlocks),
        sourceNodeIndices: currentBlocks.map(b => b.sourceIndex),
      });
      currentBlocks = [];
      currentTextLength = 0;
    }
  };

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (block.type === 'heading') {
      flushSlide();
      currentBlocks.push({ ...block, sourceIndex: i });
      currentTextLength += block.content.length;
    } else if (block.type === 'text') {
      if (currentTextLength + block.content.length > MAX_TEXT_LENGTH_PER_SLIDE && currentBlocks.length > 0) {
        flushSlide();
      }
      currentBlocks.push({ ...block, sourceIndex: i });
      currentTextLength += block.content.length;
    } else {
      currentBlocks.push({ ...block, sourceIndex: i });
    }
  }

  flushSlide();
  return slides;
}

function generateSpeech(blocks: SlideBlock[]): string {
  const parts: string[] = [];
  for (const block of blocks) {
    if (block.type === 'heading') {
      parts.push(`Let's talk about ${block.content}.`);
    } else if (block.type === 'text') {
      parts.push(block.content);
    } else if (block.type === 'math') {
      parts.push(`Here we have the mathematical expression: ${block.content}.`);
    } else if (block.type === 'image') {
      parts.push('As you can see in this illustration.');
    }
  }
  return parts.join(' ');
}
