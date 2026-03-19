import { Block, Slide } from '@/types/editor';
import { generateId } from './generateId';

/**
 * Smart slide generation from blocks.
 * Rules:
 * - A heading starts a new slide
 * - Text blocks under a heading group into same slide
 * - Images group with nearby text
 * - Long slides get split
 */
const MAX_TEXT_LENGTH_PER_SLIDE = 600;

export function generateSlidesFromBlocks(blocks: Block[]): Slide[] {
  if (blocks.length === 0) return [];

  const slides: Slide[] = [];
  let currentBlocks: Block[] = [];
  let currentTextLength = 0;

  const flushSlide = () => {
    if (currentBlocks.length > 0) {
      slides.push({
        id: generateId(),
        blocks: [...currentBlocks],
        speech: generateSpeech(currentBlocks),
      });
      currentBlocks = [];
      currentTextLength = 0;
    }
  };

  for (const block of blocks) {
    if (block.type === 'heading') {
      flushSlide();
      currentBlocks.push(block);
      currentTextLength += block.content.length;
    } else if (block.type === 'text') {
      if (currentTextLength + block.content.length > MAX_TEXT_LENGTH_PER_SLIDE && currentBlocks.length > 0) {
        flushSlide();
      }
      currentBlocks.push(block);
      currentTextLength += block.content.length;
    } else {
      // image or math — attach to current slide
      currentBlocks.push(block);
    }
  }

  flushSlide();
  return slides;
}

function generateSpeech(blocks: Block[]): string {
  // Simple speech generation — in production this would be AI-powered
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
