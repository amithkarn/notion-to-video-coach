import React from 'react';
import { Slide } from '@/types/editor';
import katex from 'katex';

interface SlideCanvasProps {
  slide: Slide;
}

const layoutClasses: Record<string, string> = {
  default: 'justify-center items-start text-left',
  centered: 'justify-center items-center text-center',
  'title-top': 'justify-start items-start text-left pt-12',
};

export const SlideCanvas: React.FC<SlideCanvasProps> = ({ slide }) => {
  const layout = slide.layout || 'default';

  return (
    <div className={`aspect-video bg-slide-canvas rounded-xl border border-slide-border shadow-lg p-8 flex flex-col overflow-hidden ${layoutClasses[layout]}`}>
      {slide.blocks.map((block) => {
        if (block.type === 'heading') {
          return (
            <h2 key={block.id} className="text-3xl font-bold mb-4 text-foreground">
              {block.content}
            </h2>
          );
        }
        if (block.type === 'text') {
          return (
            <p key={block.id} className="text-lg leading-relaxed mb-3 text-foreground/80">
              {block.content}
            </p>
          );
        }
        if (block.type === 'image' && block.content) {
          return (
            <img
              key={block.id}
              src={block.content}
              alt=""
              className="max-h-48 rounded-lg object-contain mb-3"
            />
          );
        }
        if (block.type === 'math') {
          try {
            return (
              <div
                key={block.id}
                className="py-2 mb-3"
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
