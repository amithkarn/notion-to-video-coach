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

/** Get highlighted words for a specific block */
function getHighlightedWordsForBlock(highlights: SpeechHighlight[], blockId: string): string[] {
  const words = new Set(
    highlights
      .filter(h => h.blockId === blockId)
      .map(h => h.word.toLowerCase())
  );
  return Array.from(words);
}

/** Render text content with highlighted words wrapped in <mark> */
function renderTextWithHighlights(
  text: string,
  highlightedWords: string[],
  activeWord: string | null
): React.ReactNode {
  if (highlightedWords.length === 0) return text;

  // Build regex from highlighted words (case insensitive, whole word)
  const escaped = highlightedWords.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi');

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const matchedWord = match[0];
    const isActive = activeWord && matchedWord.toLowerCase() === activeWord.toLowerCase();
    parts.push(
      <mark
        key={`${match.index}-${matchedWord}`}
        className={`bg-primary/20 text-inherit rounded-sm px-0.5 transition-all duration-300 ${
          isActive ? 'bg-primary/50 scale-105 inline-block' : ''
        }`}
      >
        {matchedWord}
      </mark>
    );
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? <>{parts}</> : text;
}

export const SlideCanvas: React.FC<SlideCanvasProps> = ({ slide, selectedBlockIds, onBlockClick, activeHighlightWord }) => {
  const layout = slide.layout || 'default';
  const isInteractive = !!onBlockClick;
  const highlightedWords = getHighlightedWords(slide.speechHighlights || []);
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

        if (block.type === 'heading') {
          return (
            <div key={block.id} className={`${wrapperClass} px-2 py-1`} onClick={handleClick}>
              <h2 className="text-3xl font-bold mb-4 text-foreground">
                {renderTextWithHighlights(block.content, highlightedWords, activeWord)}
              </h2>
            </div>
          );
        }
        if (block.type === 'text') {
          return (
            <div key={block.id} className={`${wrapperClass} px-2 py-1`} onClick={handleClick}>
              <p className="text-lg leading-relaxed mb-3 text-foreground/80">
                {renderTextWithHighlights(block.content, highlightedWords, activeWord)}
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
