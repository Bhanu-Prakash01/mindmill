import { useState, useRef, useEffect } from 'react';
import { Bold, List } from 'lucide-react';

const RichTextArea = ({ value, onChange, rows = 4, placeholder, className = '', wordLimit }) => {
  const editorRef = useRef(null);
  const [activeFormats, setActiveFormats] = useState({ bold: false, list: false });

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, []);

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateActiveFormats();
  };

  const toggleBold = () => {
    execCommand('bold');
  };

  const toggleList = () => {
    execCommand('insertUnorderedList');
  };

  const updateActiveFormats = () => {
    setActiveFormats({
      bold: document.queryCommandState('bold'),
      list: document.queryCommandState('insertUnorderedList'),
    });
  };

  const handleInput = () => {
    const html = editorRef.current.innerHTML;
    onChange(html);
    updateActiveFormats();
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault();
      toggleBold();
    }
  };

  const wordCount = value?.trim().split(/\s+/).filter(Boolean).length || 0;
  const overLimit = wordLimit && wordCount > wordLimit;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:ring-2 focus-within:ring-indigo-500">
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-gray-100 bg-gray-50">
        <button
          type="button"
          onClick={toggleBold}
          className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${activeFormats.bold ? 'bg-indigo-100 text-indigo-600' : 'text-gray-600'}`}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={toggleList}
          className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${activeFormats.list ? 'bg-indigo-100 text-indigo-600' : 'text-gray-600'}`}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
      </div>

      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onMouseUp={updateActiveFormats}
        onKeyUp={updateActiveFormats}
        data-placeholder={placeholder}
        rows={rows}
        className={`min-h-[${rows * 1.5}rem] px-3 py-2 text-sm text-gray-900 outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 ${className}`}
        suppressContentEditableWarning
      />

      {wordLimit && (
        <div className={`px-3 py-1 text-xs font-medium border-t border-gray-100 ${overLimit ? 'bg-rose-50 text-rose-600' : 'bg-gray-50 text-indigo-600'}`}>
          {wordCount} / {wordLimit} words
        </div>
      )}
    </div>
  );
};

export default RichTextArea;
