import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { useState, useRef } from 'react';
import { ImageIcon, X } from 'lucide-react';

const ImageNodeView = ({ node, updateAttributes, deleteNode, selected, editor }: NodeViewProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditable = editor.isEditable;

  const src = (node.attrs.src as string) || '';
  const alt = (node.attrs.alt as string) || '';
  const width = node.attrs.width as number | undefined;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      updateAttributes({ src: event.target?.result as string });
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  if (!src) {
    if (!isEditable) {
      return (
        <NodeViewWrapper className="mpb-nodeview" style={{ maxWidth: '100%' }}>
          <div className="py-4 px-4 text-muted-foreground text-sm italic">No image uploaded</div>
        </NodeViewWrapper>
      );
    }

    return (
      <NodeViewWrapper className="mpb-nodeview group relative" style={{ maxWidth: '100%' }}>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        <div
          className={`flex items-center justify-center gap-3 py-4 px-4 cursor-pointer rounded-md transition-all border border-transparent hover:border-border hover:bg-muted/30 ${selected ? 'border-border bg-muted/20' : ''}`}
          contentEditable={false}
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="w-4 h-4 border-2 border-muted-foreground/40 border-t-muted-foreground rounded-full animate-spin" />
              <span className="text-sm">Uploading...</span>
            </div>
          ) : (
            <>
              <ImageIcon className="w-[18px] h-[18px] text-muted-foreground/60" strokeWidth={1.5} />
              <span className="text-sm text-muted-foreground">Click to upload an image</span>
            </>
          )}
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper
      className={`mpb-nodeview image-node-frame group relative transition-colors ${isEditable && selected ? 'ring-2 ring-primary rounded-md' : ''}`}
      style={{ width: 'fit-content', maxWidth: '100%', display: 'block' }}
      contentEditable={false}
    >
      <div className="relative overflow-hidden rounded-md" style={{ width: width ? `${width}px` : 'auto', maxWidth: '100%' }}>
        <img src={src} alt={alt || 'Image'} className="block select-none w-full h-auto" draggable={false} />
      </div>

      {isEditable && (
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={deleteNode} className="p-1.5 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/80" contentEditable={false}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </NodeViewWrapper>
  );
};

export const ImageNode = Node.create({
  name: 'imageBlock',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,
  defining: true,
  isolating: true,

  addAttributes() {
    return {
      src: { default: '' },
      alt: { default: '' },
      width: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="image-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'image-block' }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },
});
