import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { useEffect, useRef, useState } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const MathNodeView = ({ node, selected, editor, getPos }: NodeViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const latex = (node.attrs.latex as string) || '';
  const isEditable = editor.isEditable;

  useEffect(() => {
    if (containerRef.current && latex) {
      try {
        katex.render(latex, containerRef.current, {
          throwOnError: false,
          displayMode: true,
        });
        setError(null);
      } catch (e) {
        setError((e as Error).message);
      }
    }
  }, [latex]);

  const hasContent = latex && latex.trim().length > 0;

  const blockClasses = isEditable
    ? `my-3 cursor-pointer rounded-md border border-border bg-card px-4 py-6 text-center transition-colors hover:border-primary/50 ${selected ? 'ring-2 ring-primary' : ''}`
    : 'my-3 rounded-md bg-card px-4 py-6 text-center';

  return (
    <NodeViewWrapper className="mpb-nodeview group relative">
      <div className={blockClasses} contentEditable={false}>
        {hasContent ? (
          error ? (
            <div className="text-destructive text-sm">{error}</div>
          ) : (
            <div ref={containerRef} className="math-rendered" />
          )
        ) : (
          isEditable && (
            <div className="text-muted-foreground italic text-sm">
              Click to add a LaTeX equation...
            </div>
          )
        )}
      </div>
    </NodeViewWrapper>
  );
};

export const MathNode = Node.create({
  name: 'mathBlock',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,
  defining: true,
  isolating: true,

  addAttributes() {
    return {
      latex: { default: '' },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="math-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'math-block' }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathNodeView);
  },
});
