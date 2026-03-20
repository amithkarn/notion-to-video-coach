import React from 'react';
import { Slide } from '@/types/editor';
import katex from 'katex';

interface SlideCanvasProps {
  slide: Slide;
  selectedBlockIds?: Set<string>;
  onBlockClick?: (blockId: string, event: React.MouseEvent) => void;
}

const layoutClasses: Record<string, string> = {
  default: 'justify-center items-start text-left',
  centered: 'justify-center items-center text-center',
  'title-top': 'justify-start items-start text-left pt-12',
};

export const SlideCanvas: React.FC<SlideCanvasProps> = ({ slide, selectedBlockIds, onBlockClick }) => {
  const layout = slide.layout || 'default';
  const isInteractive = !!onBlockClick;

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
                {block.content}
              </h2>
            </div>
          );
        }
        if (block.type === 'text') {
          return (
            <div key={block.id} className={`${wrapperClass} px-2 py-1`} onClick={handleClick}>
              <p className="text-lg leading-relaxed mb-3 text-foreground/80">
                {block.content}
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
