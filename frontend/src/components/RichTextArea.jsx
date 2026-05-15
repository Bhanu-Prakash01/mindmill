import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { useEffect, useCallback } from 'react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code,
  Heading2,
  Heading3,
  Undo2,
  Redo2,
} from 'lucide-react';

const ToolbarButton = ({ onClick, isActive, title, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${
      isActive ? 'bg-indigo-100 text-indigo-600' : 'text-gray-600'
    }`}
    title={title}
  >
    {children}
  </button>
);

const ToolbarDivider = () => (
  <div className="w-px h-5 bg-gray-200 mx-0.5 shrink-0" />
);

const RichTextArea = ({ value, onChange, rows = 4, placeholder, className = '', wordLimit }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Underline,
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm max-w-none focus:outline-none px-3 py-2 text-sm text-gray-900 min-h-[${rows * 1.5}rem]`,
        'data-placeholder': placeholder || '',
      },
    },
  });

  // Sync external value changes into editor
  useEffect(() => {
    if (editor && value !== undefined && editor.getHTML() !== value) {
      editor.commands.setContent(value || '');
    }
  }, [value, editor]);

  const apply = useCallback((command) => {
    if (!editor) return;
    editor.chain().focus()[command]().run();
  }, [editor]);

  const applyWithAttr = useCallback((command, attr) => {
    if (!editor) return;
    editor.chain().focus()[command](attr).run();
  }, [editor]);

  const wordCount = value?.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length || 0;
  const overLimit = wordLimit && wordCount > wordLimit;

  if (!editor) return null;

  return (
    <div className={`border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:ring-2 focus-within:ring-indigo-500 ${className}`}>
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-gray-100 bg-gray-50 flex-wrap">
        <ToolbarButton
          onClick={() => apply('toggleBold')}
          isActive={editor.isActive('bold')}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => apply('toggleItalic')}
          isActive={editor.isActive('italic')}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => apply('toggleUnderline')}
          isActive={editor.isActive('underline')}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => apply('toggleStrike')}
          isActive={editor.isActive('strike')}
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          onClick={() => applyWithAttr('toggleHeading', { level: 2 })}
          isActive={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => applyWithAttr('toggleHeading', { level: 3 })}
          isActive={editor.isActive('heading', { level: 3 })}
          title="Heading 3"
        >
          <Heading3 className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          onClick={() => apply('toggleBulletList')}
          isActive={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => apply('toggleOrderedList')}
          isActive={editor.isActive('orderedList')}
          title="Ordered List"
        >
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          onClick={() => apply('toggleBlockquote')}
          isActive={editor.isActive('blockquote')}
          title="Blockquote"
        >
          <Quote className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => apply('toggleCode')}
          isActive={editor.isActive('code')}
          title="Inline Code"
        >
          <Code className="w-4 h-4" />
        </ToolbarButton>

        <div className="flex-1" />

        <ToolbarDivider />

        <ToolbarButton
          onClick={() => apply('undo')}
          isActive={false}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => apply('redo')}
          isActive={false}
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 className="w-4 h-4" />
        </ToolbarButton>
      </div>

      <EditorContent editor={editor} />

      {placeholder && !value?.replace(/<[^>]*>/g, '').trim() && (
        <style>{`
          .ProseMirror p:first-child::before {
            content: attr(data-placeholder);
            color: #9ca3af;
            pointer-events: none;
            height: 0;
            float: left;
          }
          .ProseMirror p:first-child:empty::before {
            content: attr(data-placeholder);
            color: #9ca3af;
            pointer-events: none;
            height: 0;
            float: left;
          }
        `}</style>
      )}

      {wordLimit && (
        <div className={`px-3 py-1 text-xs font-medium border-t border-gray-100 ${overLimit ? 'bg-rose-50 text-rose-600' : 'bg-gray-50 text-indigo-600'}`}>
          {wordCount} / {wordLimit} words
        </div>
      )}
    </div>
  );
};

export default RichTextArea;
