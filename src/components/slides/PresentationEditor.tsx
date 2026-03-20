import React, { useState, useMemo, useCallback } from 'react';
import { Slide, SlideLayout, SpeechHighlight } from '@/types/editor';
import { SlideCanvas } from './SlideCanvas';
import { SpeechEditor } from './SpeechEditor';
import { BlockToolbar } from './BlockToolbar';
import { ChevronLeft, ChevronRight, AlignLeft, AlignCenter, AlignVerticalJustifyStart } from 'lucide-react';
import { tiptapToBlocks } from '@/lib/slideGenerator';
import { generateId } from '@/lib/generateId';
import katex from 'katex';

interface PresentationEditorProps {
  slides: Slide[];
  onSlidesChange: (slides: Slide[]) => void;
  pageContent?: string;
}

export const PresentationEditor: React.FC<PresentationEditorProps> = ({ slides, onSlidesChange, pageContent }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sidebarView, setSidebarView] = useState<'slides' | 'page'>('slides');
  const [selectedBlockIds, setSelectedBlockIds] = useState<Set<string>>(new Set());

  const pageBlocks = useMemo(() => {
    if (!pageContent) return [];
    try {
      const doc = JSON.parse(pageContent);
      return tiptapToBlocks(doc);
    } catch {
      return [];
    }
  }, [pageContent]);

  if (slides.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No slides yet. Write content in Page mode, then click "Generate Video".
      </div>
    );
  }

  const currentSlide = slides[currentIndex];
  const highlightedIndices = new Set(currentSlide.sourceNodeIndices || []);

  const handleBlockClick = (blockId: string, event: React.MouseEvent) => {
    if (event.shiftKey || event.metaKey || event.ctrlKey) {
      setSelectedBlockIds(prev => {
        const next = new Set(prev);
        if (next.has(blockId)) next.delete(blockId);
        else next.add(blockId);
        return next;
      });
    } else {
      setSelectedBlockIds(prev =>
        prev.size === 1 && prev.has(blockId) ? new Set() : new Set([blockId])
      );
    }
  };

  const handleCanvasClick = () => {
    setSelectedBlockIds(new Set());
  };

  // Determine which block indices (within the slide) are selected
  const selectedIndices = currentSlide.blocks
    .map((b, i) => (selectedBlockIds.has(b.id) ? i : -1))
    .filter(i => i >= 0)
    .sort((a, b) => a - b);

  // Check if selected blocks are contiguous from top or bottom
  const isContiguousFromTop = selectedIndices.length > 0 &&
    selectedIndices[0] === 0 &&
    selectedIndices.every((val, i) => val === i);

  const isContiguousFromBottom = selectedIndices.length > 0 &&
    selectedIndices[selectedIndices.length - 1] === currentSlide.blocks.length - 1 &&
    selectedIndices.every((val, i) => val === selectedIndices[0] + i);

  const hasPrevSlide = currentIndex > 0;
  const hasNextSlide = currentIndex < slides.length - 1;
  const hasRemainingBlocks = selectedIndices.length < currentSlide.blocks.length;

  const canMoveToPrev = selectedIndices.length > 0 && isContiguousFromTop && hasPrevSlide;
  const canMoveToNext = selectedIndices.length > 0 && isContiguousFromBottom && hasNextSlide;
  const canMoveToNew = selectedIndices.length > 0 && isContiguousFromBottom && hasRemainingBlocks;

  const moveBlocksToPrev = () => {
    if (!canMoveToPrev) return;
    const blocksToMove = selectedIndices.map(i => currentSlide.blocks[i]);
    const sourceToMove = selectedIndices.map(i => currentSlide.sourceNodeIndices[i]);
    const remainingBlocks = currentSlide.blocks.filter((_, i) => !selectedIndices.includes(i));
    const remainingSource = currentSlide.sourceNodeIndices.filter((_, i) => !selectedIndices.includes(i));

    const prevSlide = slides[currentIndex - 1];
    const updated = slides.map((s, i) => {
      if (i === currentIndex - 1) {
        return {
          ...s,
          blocks: [...s.blocks, ...blocksToMove],
          sourceNodeIndices: [...s.sourceNodeIndices, ...sourceToMove],
          speech: s.speech,
        };
      }
      if (i === currentIndex) {
        if (remainingBlocks.length === 0) return null;
        return { ...s, blocks: remainingBlocks, sourceNodeIndices: remainingSource };
      }
      return s;
    }).filter(Boolean) as Slide[];

    onSlidesChange(updated);
    if (remainingBlocks.length === 0) {
      setCurrentIndex(Math.max(0, currentIndex - 1));
    }
    setSelectedBlockIds(new Set());
  };

  const moveBlocksToNext = () => {
    if (!canMoveToNext) return;
    const blocksToMove = selectedIndices.map(i => currentSlide.blocks[i]);
    const sourceToMove = selectedIndices.map(i => currentSlide.sourceNodeIndices[i]);
    const remainingBlocks = currentSlide.blocks.filter((_, i) => !selectedIndices.includes(i));
    const remainingSource = currentSlide.sourceNodeIndices.filter((_, i) => !selectedIndices.includes(i));

    const updated = slides.map((s, i) => {
      if (i === currentIndex) {
        if (remainingBlocks.length === 0) return null;
        return { ...s, blocks: remainingBlocks, sourceNodeIndices: remainingSource };
      }
      if (i === currentIndex + 1) {
        return {
          ...s,
          blocks: [...blocksToMove, ...s.blocks],
          sourceNodeIndices: [...sourceToMove, ...s.sourceNodeIndices],
        };
      }
      return s;
    }).filter(Boolean) as Slide[];

    onSlidesChange(updated);
    if (remainingBlocks.length === 0) {
      // Stay at same index (which is now the next slide)
    }
    setSelectedBlockIds(new Set());
  };

  const moveBlocksToNew = () => {
    if (!canMoveToNew) return;
    const blocksToMove = selectedIndices.map(i => currentSlide.blocks[i]);
    const sourceToMove = selectedIndices.map(i => currentSlide.sourceNodeIndices[i]);
    const remainingBlocks = currentSlide.blocks.filter((_, i) => !selectedIndices.includes(i));
    const remainingSource = currentSlide.sourceNodeIndices.filter((_, i) => !selectedIndices.includes(i));

    const newSlide: Slide = {
      id: generateId(),
      blocks: blocksToMove,
      speech: '',
      sourceNodeIndices: sourceToMove,
      layout: 'default',
      speechHighlights: [],
    };

    const updated = [...slides];
    updated[currentIndex] = { ...currentSlide, blocks: remainingBlocks, sourceNodeIndices: remainingSource };
    updated.splice(currentIndex + 1, 0, newSlide);

    onSlidesChange(updated);
    setCurrentIndex(currentIndex + 1);
    setSelectedBlockIds(new Set());
  };

  const updateSpeech = (speech: string) => {
    const updated = slides.map((s, i) => (i === currentIndex ? { ...s, speech } : s));
    onSlidesChange(updated);
  };

  const updateHighlights = (speechHighlights: SpeechHighlight[]) => {
    const updated = slides.map((s, i) => (i === currentIndex ? { ...s, speechHighlights } : s));
    onSlidesChange(updated);
  };

  const updateLayout = (layout: SlideLayout) => {
    const updated = slides.map((s, i) => (i === currentIndex ? { ...s, layout } : s));
    onSlidesChange(updated);
  };

  const layouts: { value: SlideLayout; icon: React.ReactNode; label: string }[] = [
    { value: 'default', icon: <AlignLeft className="h-3.5 w-3.5" />, label: 'Left' },
    { value: 'centered', icon: <AlignCenter className="h-3.5 w-3.5" />, label: 'Center' },
    { value: 'title-top', icon: <AlignVerticalJustifyStart className="h-3.5 w-3.5" />, label: 'Top' },
  ];

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-64 border-r border-border flex flex-col bg-surface-sunken shrink-0">
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {sidebarView === 'slides' ? (
            slides.map((slide, i) => (
              <button
                key={slide.id}
                onClick={() => { setCurrentIndex(i); setSelectedBlockIds(new Set()); }}
                className={`w-full p-2 rounded-lg text-left text-xs transition-colors ${
                  i === currentIndex
                    ? 'bg-primary/10 border border-primary/30'
                    : 'bg-surface-elevated border border-transparent hover:border-border'
                }`}
              >
                <div className="text-muted-foreground mb-1">Slide {i + 1}</div>
                <div className="truncate text-foreground">
                  {slide.blocks[0]?.content || 'Empty slide'}
                </div>
              </button>
            ))
          ) : (
            <div className="text-xs space-y-1 p-1">
              {pageBlocks.map((block, i) => {
                const isHighlighted = highlightedIndices.has(i);
                const baseClass = `rounded px-2 py-1.5 transition-colors ${
                  isHighlighted
                    ? 'bg-primary/15 border-l-2 border-primary'
                    : 'opacity-50'
                }`;

                if (block.type === 'heading') {
                  return (
                    <div key={i} className={baseClass}>
                      <p className="font-bold text-foreground text-sm">{block.content}</p>
                    </div>
                  );
                }
                if (block.type === 'text') {
                  return (
                    <div key={i} className={baseClass}>
                      <p className="text-foreground/80 leading-snug">{block.content}</p>
                    </div>
                  );
                }
                if (block.type === 'math') {
                  try {
                    return (
                      <div
                        key={i}
                        className={baseClass}
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
                if (block.type === 'image' && block.content) {
                  return (
                    <div key={i} className={baseClass}>
                      <img src={block.content} alt="" className="max-h-16 rounded object-contain" />
                    </div>
                  );
                }
                return null;
              })}
            </div>
          )}
        </div>

        {/* Toggle at bottom */}
        <div className="border-t border-border p-2">
          <div className="flex bg-secondary rounded-lg p-0.5">
            <button
              onClick={() => setSidebarView('slides')}
              className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                sidebarView === 'slides'
                  ? 'bg-surface-elevated shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Slides
            </button>
            <button
              onClick={() => setSidebarView('page')}
              className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                sidebarView === 'page'
                  ? 'bg-surface-elevated shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Page
            </button>
          </div>
        </div>
      </div>

      {/* Right content area */}
      <div className="flex-1 flex flex-col min-h-0" onClick={handleCanvasClick}>
        {/* Layout picker + block toolbar */}
        <div className="flex items-center justify-between px-8 pt-4">
          <div className="min-h-[36px]">
            {selectedIndices.length > 0 && (
              <BlockToolbar
                canMoveToPrev={canMoveToPrev}
                canMoveToNext={canMoveToNext}
                canMoveToNew={canMoveToNew}
                onMoveToPrev={moveBlocksToPrev}
                onMoveToNext={moveBlocksToNext}
                onMoveToNew={moveBlocksToNew}
                selectedCount={selectedIndices.length}
              />
            )}
          </div>
          <div className="flex items-center gap-1 bg-secondary rounded-lg p-0.5">
            {layouts.map((l) => (
              <button
                key={l.value}
                onClick={() => updateLayout(l.value)}
                title={l.label}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  currentSlide.layout === l.value
                    ? 'bg-surface-elevated shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {l.icon}
              </button>
            ))}
          </div>
        </div>

        {/* Main canvas */}
        <div className="flex-1 flex items-center justify-center bg-secondary/30 px-8 pb-8 pt-4">
          <div className="w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <SlideCanvas
              slide={currentSlide}
              selectedBlockIds={selectedBlockIds}
              onBlockClick={handleBlockClick}
            />
          </div>
        </div>

        {/* Speech editor */}
        <div className="border-t border-border p-4 bg-speech-bg">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                Speech — Slide {currentIndex + 1}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => { setCurrentIndex(Math.max(0, currentIndex - 1)); setSelectedBlockIds(new Set()); }}
                  disabled={currentIndex === 0}
                  className="p-1 rounded hover:bg-accent disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => { setCurrentIndex(Math.min(slides.length - 1, currentIndex + 1)); setSelectedBlockIds(new Set()); }}
                  disabled={currentIndex === slides.length - 1}
                  className="p-1 rounded hover:bg-accent disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
            <textarea
              value={currentSlide.speech}
              onChange={(e) => updateSpeech(e.target.value)}
              rows={3}
              className="w-full bg-surface-elevated border border-speech-border rounded-lg p-3 text-sm resize-none outline-none focus:ring-2 focus:ring-ring/20"
              placeholder="Speech narration for this slide..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};
