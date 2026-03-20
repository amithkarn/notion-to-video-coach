import React from 'react';
import { Slide, SpeechHighlight } from '@/types/editor';
import katex from 'katex';

interface SlideCanvasProps {
  slide: Slide;
  selectedBlockIds?: Set<string>;
  onBlockClick?: (blockId: string, event: React.MouseEvent) => void;
  activeHighlightWord?: string | null;
}

const layoutClasses: Record<string, string> = {
  default: 'justify-center items-start text-left',
  centered: 'justify-center items-center text-center',
  'title-top': 'justify-start items-start text-left pt-12',
};

/** Get highlight positions for a specific block (exact char ranges) */
function getBlockHighlightRanges(highlights: SpeechHighlight[], blockId: string): { start: number; end: number; word: string }[] {
  return highlights
    .filter(h => h.blockId === blockId && h.blockCharStart !== undefined && h.blockCharEnd !== undefined)
    .map(h => ({ start: h.blockCharStart!, end: h.blockCharEnd!, word: h.word }))
    .sort((a, b) => a.start - b.start);
}

/** Render text with highlights at specific character positions */
function renderTextWithHighlights(
  text: string,
  blockId: string,
  highlights: SpeechHighlight[],
  activeWord: string | null
): React.ReactNode {
  const ranges = getBlockHighlightRanges(highlights, blockId);
  if (ranges.length === 0) return text;

  const parts: React.ReactNode[] = [];
  let lastEnd = 0;

  for (const range of ranges) {
    if (range.start > lastEnd) {
      parts.push(text.slice(lastEnd, range.start));
    }
    const matchedText = text.slice(range.start, range.end);
    const isActive = activeWord && matchedText.toLowerCase() === activeWord.toLowerCase();
    parts.push(
      <mark
        key={`${range.start}-${matchedText}`}
        className={`bg-primary/20 text-inherit rounded-sm px-0.5 transition-all duration-300 ${
          isActive ? 'bg-primary/50 scale-105 inline-block' : ''
        }`}
      >
        {matchedText}
      </mark>
    );
    lastEnd = range.end;
  }

  if (lastEnd < text.length) {
    parts.push(text.slice(lastEnd));
  }

  return parts.length > 0 ? <>{parts}</> : text;
}

export const SlideCanvas: React.FC<SlideCanvasProps> = ({ slide, selectedBlockIds, onBlockClick, activeHighlightWord }) => {
  const layout = slide.layout || 'default';
  const isInteractive = !!onBlockClick;
  const highlights = slide.speechHighlights || [];
  const activeWord = activeHighlightWord ?? null;

  return (
    <div className={`aspect-video bg-slide-canvas rounded-xl border border-slide-border shadow-lg p-8 flex flex-col overflow-hidden ${layoutClasses[layout]}`}>
      {slide.blocks.map((block) => {
        const isSelected = selectedBlockIds?.has(block.id) ?? false;
        const wrapperClass = isInteractive
          ? `rounded-lg transition-all cursor-pointer ${
              isSelected
                ? 'ring-2 ring-primary bg-primary/5'
                : 'hover:ring-1 hover:ring-border'
            }`
          : '';

        const handleClick = (e: React.MouseEvent) => {
          e.stopPropagation();
          onBlockClick?.(block.id, e);
        };

        const blockHighlightedWords = getHighlightedWordsForBlock(highlights, block.id);

        if (block.type === 'heading') {
          return (
            <div key={block.id} className={`${wrapperClass} px-2 py-1`} onClick={handleClick}>
              <h2 className="text-3xl font-bold mb-4 text-foreground">
                {renderTextWithHighlights(block.content, blockHighlightedWords, activeWord)}
              </h2>
            </div>
          );
        }
        if (block.type === 'text') {
          return (
            <div key={block.id} className={`${wrapperClass} px-2 py-1`} onClick={handleClick}>
              <p className="text-lg leading-relaxed mb-3 text-foreground/80">
                {renderTextWithHighlights(block.content, blockHighlightedWords, activeWord)}
              </p>
            </div>
          );
        }
        if (block.type === 'image' && block.content) {
          return (
            <div key={block.id} className={`${wrapperClass} px-2 py-1`} onClick={handleClick}>
              <img
                src={block.content}
                alt=""
                className="max-h-48 rounded-lg object-contain mb-3"
              />
            </div>
          );
        }
        if (block.type === 'math') {
          try {
            return (
              <div
                key={block.id}
                className={`${wrapperClass} px-2 py-1 mb-3`}
                onClick={handleClick}
                dangerouslySetInnerHTML={{
                  __html: katex.renderToString(block.content || '', {
                    displayMode: true,
                    throwOnError: false,
                  }),
                }}
              />
            );
          } catch {
            return null;
          }
        }
        return null;
      })}
    </div>
  );
};
