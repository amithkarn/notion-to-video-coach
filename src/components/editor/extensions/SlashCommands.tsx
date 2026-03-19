import { Extension } from '@tiptap/core';
import { ReactRenderer } from '@tiptap/react';
import Suggestion, { SuggestionOptions } from '@tiptap/suggestion';
import tippy, { Instance as TippyInstance } from 'tippy.js';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';

interface CommandItem {
  title: string;
  icon: string;
  command: (props: { editor: any; range: any }) => void;
}

interface CommandListProps {
  items: CommandItem[];
  command: (item: CommandItem) => void;
}

export interface CommandListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

const CommandList = forwardRef<CommandListRef, CommandListProps>(({ items, command }, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((prev) => (prev + items.length - 1) % items.length);
        return true;
      }
      if (event.key === 'ArrowDown') {
        setSelectedIndex((prev) => (prev + 1) % items.length);
        return true;
      }
      if (event.key === 'Enter') {
        const item = items[selectedIndex];
        if (item) command(item);
        return true;
      }
      return false;
    },
  }));

  if (!items.length) {
    return (
      <div className="slash-menu px-2 py-1.5 text-sm text-muted-foreground">
        No results
      </div>
    );
  }

  return (
    <div className="slash-menu">
      {items.map((item, index) => (
        <button
          key={item.title}
          className={`slash-menu-item ${index === selectedIndex ? 'active' : ''}`}
          onClick={() => command(item)}
          onMouseEnter={() => setSelectedIndex(index)}
        >
          <span className="slash-menu-item-icon">{item.icon}</span>
          <span className="slash-menu-item-label">{item.title}</span>
        </button>
      ))}
    </div>
  );
});

CommandList.displayName = 'CommandList';

const getSuggestionItems = (query: string): CommandItem[] => {
  const items: CommandItem[] = [
    {
      title: 'Text',
      icon: 'T',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setParagraph().run();
      },
    },
    {
      title: 'Heading 1',
      icon: 'H1',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run();
      },
    },
    {
      title: 'Heading 2',
      icon: 'H2',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run();
      },
    },
    {
      title: 'Heading 3',
      icon: 'H3',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run();
      },
    },
    {
      title: 'Image',
      icon: '🖼',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).insertContent({ type: 'imageBlock' }).run();
      },
    },
    {
      title: 'Math',
      icon: 'Σ',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).insertContent({ type: 'mathBlock' }).run();
      },
    },
    {
      title: 'Bullet List',
      icon: '•',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBulletList().run();
      },
    },
    {
      title: 'Numbered List',
      icon: '1.',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleOrderedList().run();
      },
    },
  ];

  return items.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase())
  );
};

const renderItems = () => {
  let component: ReactRenderer<CommandListRef> | null = null;
  let popup: TippyInstance[] | null = null;

  return {
    onStart: (props: any) => {
      component = new ReactRenderer(CommandList, {
        props,
        editor: props.editor,
      });

      if (!props.clientRect) return;

      popup = tippy('body', {
        getReferenceClientRect: props.clientRect,
        appendTo: () => document.body,
        content: component.element,
        showOnCreate: true,
        interactive: true,
        trigger: 'manual',
        placement: 'bottom-start',
      });
    },
    onUpdate: (props: any) => {
      component?.updateProps(props);
      if (!props.clientRect || !popup) return;
      popup[0].setProps({ getReferenceClientRect: props.clientRect });
    },
    onKeyDown: (props: any) => {
      if (props.event.key === 'Escape') {
        popup?.[0].hide();
        return true;
      }
      return component?.ref?.onKeyDown(props) ?? false;
    },
    onExit: () => {
      popup?.[0].destroy();
      component?.destroy();
    },
  };
};

export const SlashCommands = Extension.create({
  name: 'slashCommands',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        command: ({ editor, range, props }: { editor: any; range: any; props: CommandItem }) => {
          props.command({ editor, range });
        },
      } as Partial<SuggestionOptions>,
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
        items: ({ query }: { query: string }) => getSuggestionItems(query),
        render: renderItems,
      }),
    ];
  },
});
