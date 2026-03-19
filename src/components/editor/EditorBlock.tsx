import React, { useRef, useEffect, useCallback, KeyboardEvent } from 'react';
import { Block } from '@/types/editor';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Image, X } from 'lucide-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface EditorBlockProps {
  block: Block;
  isFocused: boolean;
  onUpdate: (content: string) => void;
  onKeyDown: (e: KeyboardEvent<HTMLElement>) => void;
  onFocus: () => void;
  onSlashCommand: (rect: DOMRect) => void;
  onDelete: () => void;
}

export const EditorBlock: React.FC<EditorBlockProps> = ({
  block,
  isFocused,
  onUpdate,
  onKeyDown,
  onFocus,
  onSlashCommand,
  onDelete,
}) => {
  const editableRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Set initial content only once (not on every render)
  useEffect(() => {
    if (editableRef.current && !isInitializedRef.current) {
      editableRef.current.textContent = block.content;
      isInitializedRef.current = true;
    }
  }, []);

  // Sync content from parent only when block.id changes (new block)
  useEffect(() => {
    isInitializedRef.current = false;
    if (editableRef.current) {
      editableRef.current.textContent = block.content;
      isInitializedRef.current = true;
    }
  }, [block.id]);

  useEffect(() => {
    if (isFocused && editableRef.current && block.type !== 'image') {
      editableRef.current.focus();
      const range = document.createRange();
      const sel = window.getSelection();
      if (editableRef.current.childNodes.length > 0) {
        range.selectNodeContents(editableRef.current);
        range.collapse(false);
      }
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [isFocused, block.type]);

  const handleInput = useCallback(() => {
    if (editableRef.current) {
      const text = editableRef.current.textContent || '';
      onUpdate(text);
    }
  }, [onUpdate]);

  const handleKeyDownInternal = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    const text = editableRef.current?.textContent || '';

    if (e.key === '/' && text === '') {
      e.preventDefault();
      const rect = editableRef.current!.getBoundingClientRect();
      onSlashCommand(rect);
      return;
    }

    onKeyDown(e);
  }, [onKeyDown, onSlashCommand]);

  const handleImageUpload = () => {
    const url = prompt('Enter image URL:');
    if (url) onUpdate(url);
  };

  const renderMath = () => {
    try {
      return (
        <div
          className="py-3"
          dangerouslySetInnerHTML={{
            __html: katex.renderToString(block.content || '\\text{Type LaTeX here}', {
              displayMode: true,
              throwOnError: false,
            }),
          }}
        />
      );
    } catch {
      return <div className="text-destructive text-sm">Invalid LaTeX</div>;
    }
  };

  const placeholder = block.type === 'heading'
    ? 'Heading'
    : block.type === 'text'
    ? "Type '/' for commands..."
    : block.type === 'math'
    ? 'LaTeX expression...'
    : '';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group flex items-start gap-1 py-1 rounded-lg relative"
    >
      <div
        {...attributes}
        {...listeners}
        className="mt-1 p-1 opacity-0 group-hover:opacity-40 hover:!opacity-100 cursor-grab rounded transition-opacity"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="block-content flex-1 min-w-0">
        {block.type === 'image' ? (
          <div className="py-2">
            {block.content ? (
              <div className="relative group/img">
                <img
                  src={block.content}
                  alt=""
                  className="max-w-full rounded-lg border border-border"
                />
                <button
                  onClick={() => onUpdate('')}
                  className="absolute top-2 right-2 p-1 rounded-md bg-background/80 opacity-0 group-hover/img:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleImageUpload}
                className="w-full py-8 border-2 border-dashed border-border rounded-lg flex items-center justify-center gap-2 text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
              >
                <Image className="h-5 w-5" />
                <span>Add image</span>
              </button>
            )}
          </div>
        ) : block.type === 'math' ? (
          <div className="py-1">
            {renderMath()}
            <div
              ref={editableRef}
              contentEditable
              suppressContentEditableWarning
              data-placeholder={placeholder}
              className="font-mono text-sm px-3 py-2 rounded-md bg-secondary/50 mt-2 outline-none"
              onInput={handleInput}
              onKeyDown={handleKeyDownInternal}
              onFocus={onFocus}
            />
          </div>
        ) : (
          <div
            ref={editableRef}
            contentEditable
            suppressContentEditableWarning
            data-placeholder={placeholder}
            className={`outline-none py-1 px-1 rounded ${
              block.type === 'heading'
                ? 'text-2xl font-semibold'
                : 'text-base leading-relaxed'
            }`}
            onInput={handleInput}
            onKeyDown={handleKeyDownInternal}
            onFocus={onFocus}
          />
        )}
      </div>

      <button
        onClick={onDelete}
        className="mt-1 p-1 opacity-0 group-hover:opacity-40 hover:!opacity-100 text-destructive rounded transition-opacity"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
};
