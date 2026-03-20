import React, { useRef, useState, useCallback, useEffect } from 'react';
import { SpeechHighlight } from '@/types/editor';
import { generateId } from '@/lib/generateId';
import { Highlighter, X } from 'lucide-react';

interface SpeechEditorProps {
  speech: string;
  highlights: SpeechHighlight[];
  onSpeechChange: (speech: string) => void;
  onHighlightsChange: (highlights: SpeechHighlight[]) => void;
  slideIndex: number;
  slideCount: number;
}

export const SpeechEditor: React.FC<SpeechEditorProps> = ({
  speech,
  highlights,
  onSpeechChange,
  onHighlightsChange,
  slideIndex,
  slideCount,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState<{ start: number; end: number; word: string } | null>(null);
  const [showButton, setShowButton] = useState(false);
  const [buttonPos, setButtonPos] = useState({ top: 0, left: 0 });

  const handleSelect = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    if (start === end) {
      setShowButton(false);
      setSelection(null);
      return;
    }

    const word = speech.slice(start, end).trim();
    if (!word || word.includes('\n')) {
      setShowButton(false);
      setSelection(null);
      return;
    }

    // Adjust selection to trimmed word
    const trimStart = start + (speech.slice(start, end).length - speech.slice(start, end).trimStart().length);
    const trimEnd = end - (speech.slice(start, end).length - speech.slice(start, end).trimEnd().length);

    setSelection({ start: trimStart, end: trimEnd, word });

    // Position button above selection using textarea's bounding rect
    const rect = textarea.getBoundingClientRect();
    // Approximate position: we'll put it above the textarea, centered
    setButtonPos({
      top: -36,
      left: rect.width / 2 - 50,
    });
    setShowButton(true);
  }, [speech]);

  const handleAddHighlight = () => {
    if (!selection) return;
    const newHighlight: SpeechHighlight = {
      id: generateId(),
      startIndex: selection.start,
      endIndex: selection.end,
      word: selection.word,
    };
    onHighlightsChange([...highlights, newHighlight]);
    setShowButton(false);
    setSelection(null);
    if (textareaRef.current) {
      textareaRef.current.selectionStart = textareaRef.current.selectionEnd;
    }
  };

  const handleRemoveHighlight = (id: string) => {
    onHighlightsChange(highlights.filter(h => h.id !== id));
  };

  const handleSpeechChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newSpeech = e.target.value;
    const oldLen = speech.length;
    const newLen = newSpeech.length;
    const diff = newLen - oldLen;

    // Find where the edit happened
    const cursor = e.target.selectionStart;
    const editPos = cursor - Math.max(0, diff);

    // Update highlight positions or remove invalid ones
    const updatedHighlights = highlights
      .map(h => {
        let { startIndex, endIndex } = h;
        if (editPos <= startIndex) {
          startIndex += diff;
          endIndex += diff;
        } else if (editPos < endIndex) {
          // Edit is inside the highlight — remove it
          return null;
        }
        if (startIndex < 0 || endIndex > newLen || startIndex >= endIndex) return null;
        const newWord = newSpeech.slice(startIndex, endIndex);
        return { ...h, startIndex, endIndex, word: newWord };
      })
      .filter(Boolean) as SpeechHighlight[];

    onSpeechChange(newSpeech);
    onHighlightsChange(updatedHighlights);
  };

  // Sync scroll between textarea and overlay
  const handleScroll = () => {
    if (overlayRef.current && textareaRef.current) {
      overlayRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Build rendered segments with highlights
  const renderOverlay = () => {
    if (!speech) return null;

    const sorted = [...highlights].sort((a, b) => a.startIndex - b.startIndex);
    const segments: React.ReactNode[] = [];
    let lastEnd = 0;

    sorted.forEach((h) => {
      if (h.startIndex > lastEnd) {
        segments.push(
          <span key={`t-${lastEnd}`} className="invisible">
            {speech.slice(lastEnd, h.startIndex)}
          </span>
        );
      }
      segments.push(
        <mark
          key={h.id}
          className="bg-primary/25 text-transparent rounded-sm px-0"
        >
          {speech.slice(h.startIndex, h.endIndex)}
        </mark>
      );
      lastEnd = h.endIndex;
    });

    if (lastEnd < speech.length) {
      segments.push(
        <span key={`t-${lastEnd}`} className="invisible">
          {speech.slice(lastEnd)}
        </span>
      );
    }

    return segments;
  };

  // Check if current selection overlaps existing highlight
  const isSelectionHighlighted = selection && highlights.some(
    h => selection.start < h.endIndex && selection.end > h.startIndex
  );

  const overlappingHighlight = selection
    ? highlights.find(h => selection.start < h.endIndex && selection.end > h.startIndex)
    : null;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-muted-foreground">
          Speech — Slide {slideIndex + 1}
        </span>
      </div>

      {/* Highlight chips */}
      {highlights.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {highlights.map(h => (
            <span
              key={h.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-primary/15 text-primary border border-primary/20"
            >
              <Highlighter className="h-3 w-3" />
              {h.word}
              <button
                onClick={() => handleRemoveHighlight(h.id)}
                className="ml-0.5 hover:text-destructive transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Text area with highlight overlay */}
      <div className="relative">
        {/* Highlight overlay */}
        <div
          ref={overlayRef}
          className="absolute inset-0 p-3 text-sm whitespace-pre-wrap break-words overflow-hidden pointer-events-none rounded-lg"
          aria-hidden
        >
          {renderOverlay()}
        </div>

        {/* Actual textarea */}
        <textarea
          ref={textareaRef}
          value={speech}
          onChange={handleSpeechChange}
          onSelect={handleSelect}
          onScroll={handleScroll}
          rows={3}
          className="w-full bg-surface-elevated border border-speech-border rounded-lg p-3 text-sm resize-none outline-none focus:ring-2 focus:ring-ring/20 relative"
          placeholder="Speech narration for this slide..."
        />

        {/* Highlight button */}
        {showButton && selection && (
          <div
            className="absolute z-10 flex gap-1"
            style={{ top: buttonPos.top, left: buttonPos.left }}
          >
            {overlappingHighlight ? (
              <button
                onMouseDown={(e) => { e.preventDefault(); handleRemoveHighlight(overlappingHighlight.id); setShowButton(false); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-xs font-medium shadow-md hover:bg-destructive/90 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                Remove highlight
              </button>
            ) : (
              <button
                onMouseDown={(e) => { e.preventDefault(); handleAddHighlight(); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium shadow-md hover:bg-primary/90 transition-colors"
              >
                <Highlighter className="h-3.5 w-3.5" />
                Highlight
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
