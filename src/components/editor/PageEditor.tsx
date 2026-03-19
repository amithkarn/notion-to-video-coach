import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useState, useCallback, useRef } from 'react';
import { GripVertical } from 'lucide-react';
import { SlashCommands } from './extensions/SlashCommands';
import { MathNode } from './extensions/MathNode';
import { ImageNode } from './extensions/ImageNode';

interface PageEditorProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  placeholder?: string;
}

export const PageEditor = ({ value, onChange, readOnly = false, placeholder = "Type '/' for commands..." }: PageEditorProps) => {
  const [dragHandlePos, setDragHandlePos] = useState<{ top: number; visible: boolean }>({ top: 0, visible: false });
  const editorWrapperRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);

  // Refs for drag-and-drop reordering
  const hoveredBlockRef = useRef<{ fromPos: number; nodeSize: number } | null>(null);
  const isDraggingRef = useRef(false);

  // Code panel state for math blocks
  const [selectedMathBlock, setSelectedMathBlock] = useState<{ pos: number; latex: string } | null>(null);
  const mathInputRef = useRef<HTMLTextAreaElement>(null);

  let initialContent: any = null;
  try {
    if (value) initialContent = JSON.parse(value);
  } catch {
    if (value && value.trim()) {
      initialContent = {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: value }] }],
      };
    }
  }

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Placeholder.configure({ placeholder, showOnlyWhenEditable: true, showOnlyCurrent: true }),
      SlashCommands,
      MathNode,
      ImageNode,
    ],
    content: initialContent,
    editable: !readOnly,
    editorProps: {
      attributes: {
        class: `tiptap-editor focus:outline-none min-h-[400px] pl-12`,
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (const item of Array.from(items)) {
          if (item.type.startsWith('image/')) {
            event.preventDefault();
            const file = item.getAsFile();
            if (!file) return true;
            const reader = new FileReader();
            reader.onload = (e) => {
              const src = e.target?.result as string;
              if (src) {
                const node = view.state.schema.nodes.imageBlock;
                if (node) {
                  const imageNode = node.create({ src });
                  const tr = view.state.tr.replaceSelectionWith(imageNode);
                  view.dispatch(tr);
                }
              }
            };
            reader.readAsDataURL(file);
            return true;
          }
        }
        return false;
      },
      handleClick: (view, pos) => {
        const { state } = view;
        const { doc } = state;
        let node = doc.nodeAt(pos);
        let nodePos = pos;
        const resolvedPos = doc.resolve(pos);
        for (let d = resolvedPos.depth; d >= 0; d--) {
          const n = resolvedPos.node(d);
          if (n.type.name === 'mathBlock') {
            node = n;
            nodePos = resolvedPos.before(d);
            break;
          }
        }
        if (node?.type.name === 'mathBlock') {
          setSelectedMathBlock({ pos: nodePos, latex: (node.attrs.latex as string) || '' });
          return true;
        }
        setSelectedMathBlock(null);
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      if (!readOnly) {
        onChange(JSON.stringify(editor.getJSON()));
      }
    },
    onSelectionUpdate: ({ editor }) => {
      const { selection } = editor.state;
      const node = editor.state.doc.nodeAt(selection.from);
      if (node?.type.name === 'mathBlock') {
        setSelectedMathBlock({ pos: selection.from, latex: (node.attrs.latex as string) || '' });
      }
    },
  });

  // Drag handle logic
  useEffect(() => {
    const wrapper = editorWrapperRef.current;
    if (!wrapper || !editor || readOnly) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current) return;
      const handle = dragHandleRef.current;
      const target = e.target as HTMLElement;
      if (handle && handle.contains(target)) return;

      const editorElement = wrapper.querySelector('.ProseMirror') as HTMLElement | null;
      if (!editorElement) return;

      const editorRect = editorElement.getBoundingClientRect();
      const wrapperRect = wrapper.getBoundingClientRect();
      const probeY = Math.min(editorRect.bottom - 4, Math.max(editorRect.top + 4, e.clientY));
      const computedStyle = getComputedStyle(editorElement);
      const paddingLeft = parseFloat(computedStyle.paddingLeft) || 40;
      const probeX = editorRect.left + paddingLeft + 16;

      let blockEl: HTMLElement | null = null;
      let fromPos: number | null = null;
      let nodeSize = 0;

      const coords = editor.view.posAtCoords({ left: probeX, top: probeY });
      if (coords) {
        try {
          const domAt = editor.view.domAtPos(coords.pos);
          const domNode = domAt.node as Node;
          const baseEl = (domNode instanceof HTMLElement ? domNode : domNode.parentElement) as HTMLElement | null;
          blockEl = baseEl?.closest('p, h1, h2, h3, h4, h5, h6, li, blockquote, pre, [data-type], .custom-block, [data-node-view-wrapper]') as HTMLElement | null;
          if (blockEl && editorElement.contains(blockEl)) {
            try {
              const posEl = (blockEl.closest('[data-node-view-wrapper]') as HTMLElement | null) ?? blockEl;
              const innerPos = editor.view.posAtDOM(posEl, 0);
              const $pos = editor.state.doc.resolve(innerPos);
              for (let d = $pos.depth; d > 0; d--) {
                const n = $pos.node(d);
                if (n.isBlock) {
                  fromPos = $pos.before(d);
                  nodeSize = n.nodeSize;
                  break;
                }
              }
            } catch { /* ignore */ }
          }
        } catch { /* ignore */ }
      }

      if (!blockEl || fromPos === null) {
        const probedEl = document.elementFromPoint(probeX, probeY) as HTMLElement | null;
        if (probedEl && editorElement.contains(probedEl)) {
          blockEl = probedEl.closest('p, h1, h2, h3, h4, h5, h6, li, blockquote, pre, [data-type], .custom-block, [data-node-view-wrapper]') as HTMLElement | null;
          if (blockEl) {
            try {
              const posEl = (blockEl.closest('[data-node-view-wrapper]') as HTMLElement | null) ?? blockEl;
              const innerPos = editor.view.posAtDOM(posEl, 0);
              const $pos = editor.state.doc.resolve(innerPos);
              for (let d = $pos.depth; d > 0; d--) {
                const n = $pos.node(d);
                if (n.isBlock) {
                  fromPos = $pos.before(d);
                  nodeSize = n.nodeSize;
                  break;
                }
              }
            } catch { /* ignore */ }
          }
        }
      }

      if (!blockEl || fromPos === null) {
        hoveredBlockRef.current = null;
        setDragHandlePos((prev) => ({ ...prev, visible: false }));
        return;
      }

      const rect = blockEl.getBoundingClientRect();
      const handleTop = rect.top - wrapperRect.top + Math.min(14, rect.height / 2);
      const clampedTop = Math.max(12, Math.min(handleTop, wrapperRect.height - 12));

      hoveredBlockRef.current = { fromPos, nodeSize };
      setDragHandlePos({ top: clampedTop, visible: true });
    };

    const handleMouseLeave = (e: MouseEvent) => {
      const relatedTarget = e.relatedTarget as HTMLElement | null;
      if (isDraggingRef.current) return;
      if (relatedTarget && wrapper.contains(relatedTarget)) return;
      hoveredBlockRef.current = null;
      setDragHandlePos((prev) => ({ ...prev, visible: false }));
    };

    wrapper.addEventListener('mousemove', handleMouseMove);
    wrapper.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      wrapper.removeEventListener('mousemove', handleMouseMove);
      wrapper.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [editor, readOnly]);

  const handleDragStart = useCallback((e: React.DragEvent) => {
    if (!editor) return;
    const hovered = hoveredBlockRef.current;
    if (!hovered) return;
    isDraggingRef.current = true;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', '');
    e.dataTransfer.setData('application/x-lovable-block', JSON.stringify(hovered));
    try {
      const img = document.createElement('div');
      img.style.width = '1px';
      img.style.height = '1px';
      document.body.appendChild(img);
      e.dataTransfer.setDragImage(img, 0, 0);
      setTimeout(() => img.remove(), 0);
    } catch { /* ignore */ }
  }, [editor]);

  const handleDragEnd = useCallback(() => { isDraggingRef.current = false; }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (Array.from(e.dataTransfer.types).includes('application/x-lovable-block')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    if (!editor) return;
    const data = e.dataTransfer.getData('application/x-lovable-block');
    if (!data) return;
    e.preventDefault();
    isDraggingRef.current = false;
    const payload = JSON.parse(data) as { fromPos: number; nodeSize: number };
    const { state, view } = editor;
    const coords = { left: e.clientX, top: e.clientY };
    const drop = view.posAtCoords(coords);
    if (!drop) return;
    const $to = state.doc.resolve(drop.pos);
    let toPos = drop.pos;
    for (let d = $to.depth; d > 0; d--) {
      const n = $to.node(d);
      if (n.isBlock) { toPos = $to.before(d); break; }
    }
    const fromPos = payload.fromPos;
    const fromNode = state.doc.nodeAt(fromPos);
    if (!fromNode) return;
    if (Math.abs(fromPos - toPos) <= 1) return;
    const tr = state.tr;
    tr.delete(fromPos, fromPos + fromNode.nodeSize);
    let insertPos = toPos;
    if (toPos > fromPos) insertPos = Math.max(0, toPos - fromNode.nodeSize);
    tr.insert(insertPos, fromNode);
    view.dispatch(tr);
    editor.commands.focus();
  }, [editor]);

  // Math code change
  const handleMathCodeChange = useCallback((code: string) => {
    if (!editor || !selectedMathBlock) return;
    const node = editor.state.doc.nodeAt(selectedMathBlock.pos);
    if (!node || node.type.name !== 'mathBlock') return;
    const tr = editor.state.tr.setNodeMarkup(selectedMathBlock.pos, undefined, { ...node.attrs, latex: code });
    editor.view.dispatch(tr);
    setSelectedMathBlock((prev) => prev ? { ...prev, latex: code } : null);
  }, [editor, selectedMathBlock]);

  // Sync content from parent
  useEffect(() => {
    if (editor && value) {
      try {
        const parsed = JSON.parse(value);
        const currentContent = JSON.stringify(editor.getJSON());
        if (value !== currentContent) {
          editor.commands.setContent(parsed);
        }
      } catch { /* ignore */ }
    }
  }, [editor, value]);

  if (!editor) return null;

  return (
    <div className="shared-magic-editor edit-mode">
      <div className="flex">
        <div
          ref={editorWrapperRef}
          className="editor-wrapper relative flex-1"
          onDragOver={!readOnly ? handleDragOver : undefined}
          onDrop={!readOnly ? handleDrop : undefined}
        >
          {/* Drag Handle */}
          {!readOnly && (
            <div
              ref={dragHandleRef}
              className="drag-handle"
              draggable
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              style={{
                top: dragHandlePos.top,
                opacity: dragHandlePos.visible ? 1 : 0,
                pointerEvents: dragHandlePos.visible ? 'auto' : 'none',
              }}
            >
              <GripVertical className="w-4 h-4" />
            </div>
          )}

          <EditorContent editor={editor} className="editor-content" />
        </div>

        {/* Math code panel */}
        {selectedMathBlock && !readOnly && (
          <div className="w-[360px] border-l border-border bg-card p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">LaTeX Equation</span>
              <button
                onClick={() => setSelectedMathBlock(null)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Close
              </button>
            </div>
            <textarea
              ref={mathInputRef}
              value={selectedMathBlock.latex}
              onChange={(e) => handleMathCodeChange(e.target.value)}
              placeholder="Write LaTeX here... (e.g., x^2 + y^2 = z^2)"
              className="w-full min-h-[120px] p-3 bg-background border border-border rounded font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="text-xs text-muted-foreground">
              Changes update in real-time
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
