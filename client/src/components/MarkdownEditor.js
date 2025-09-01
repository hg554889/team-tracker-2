import React, { useRef, useEffect, useCallback } from 'react';
import './MarkdownEditor.css';

export default function MarkdownEditor({ value, onChange, placeholder, className }) {
  const editorRef = useRef(null);
  const isUpdatingRef = useRef(false);

  const handleInput = useCallback((e) => {
    if (isUpdatingRef.current) return;
    
    const text = e.target.innerText || '';
    onChange(text);
  }, [onChange]);

  const handleKeyDown = (e) => {
    // Handle tab for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      document.execCommand('insertText', false, '  ');
    }
  };

  // Apply markdown styling as the user types
  const applyMarkdownStyling = useCallback((text) => {
    if (!text) return '';
    
    return text
      // Escape HTML first
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // Apply markdown styling with spans that preserve the original text
      .replace(/^### (.*)$/gm, '<div class="md-h3">### $1</div>')
      .replace(/^## (.*)$/gm, '<div class="md-h2">## $1</div>')
      .replace(/^# (.*)$/gm, '<div class="md-h1"># $1</div>')
      .replace(/\*\*([^*]+)\*\*/g, '<span class="md-bold">**$1**</span>')
      .replace(/__([^_]+)__/g, '<span class="md-bold">__$1__</span>')
      .replace(/\*([^*]+)\*/g, '<span class="md-italic">*$1*</span>')
      .replace(/_([^_]+)_/g, '<span class="md-italic">_$1_</span>')
      .replace(/`([^`]+)`/g, '<span class="md-code">`$1`</span>')
      .replace(/```([^`]*)```/g, '<div class="md-codeblock">```$1```</div>')
      .replace(/^[\*\-\+] (.*)$/gm, '<div class="md-list">• $1</div>')
      .replace(/^\d+\. (.*)$/gm, '<div class="md-list">$&</div>')
      // Replace remaining newlines with br tags for single line breaks
      .replace(/\n/g, '<br>');
  }, []);

  useEffect(() => {
    if (editorRef.current && value !== undefined) {
      isUpdatingRef.current = true;
      
      const currentText = editorRef.current.innerText || '';
      
      // Only update if the content actually changed
      if (currentText !== value) {
        // Save cursor position
        const selection = window.getSelection();
        const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
        let caretOffset = 0;
        
        if (range && editorRef.current.contains(range.startContainer)) {
          // Calculate text offset
          const walker = document.createTreeWalker(
            editorRef.current,
            NodeFilter.SHOW_TEXT,
            null,
            false
          );
          
          let node;
          let textOffset = 0;
          while (node = walker.nextNode()) {
            if (node === range.startContainer) {
              caretOffset = textOffset + range.startOffset;
              break;
            }
            textOffset += node.textContent.length;
          }
        }
        
        // Update content
        editorRef.current.innerHTML = applyMarkdownStyling(value);
        
        // Restore cursor position
        setTimeout(() => {
          try {
            if (editorRef.current) {
              const walker = document.createTreeWalker(
                editorRef.current,
                NodeFilter.SHOW_TEXT,
                null,
                false
              );
              
              let node;
              let textOffset = 0;
              
              while (node = walker.nextNode()) {
                const nodeLength = node.textContent.length;
                if (textOffset + nodeLength >= caretOffset) {
                  const range = document.createRange();
                  const selection = window.getSelection();
                  range.setStart(node, Math.min(caretOffset - textOffset, nodeLength));
                  range.collapse(true);
                  selection.removeAllRanges();
                  selection.addRange(range);
                  break;
                }
                textOffset += nodeLength;
              }
            }
          } catch (e) {
            // Ignore cursor positioning errors
          }
          
          isUpdatingRef.current = false;
        }, 0);
      } else {
        isUpdatingRef.current = false;
      }
    }
  }, [value, applyMarkdownStyling]);

  // Initialize content on first render
  useEffect(() => {
    if (editorRef.current && !editorRef.current.innerHTML && value) {
      editorRef.current.innerHTML = applyMarkdownStyling(value);
    }
  }, [applyMarkdownStyling, value]);

  return (
    <div className={`markdown-editor-live ${className || ''}`}>
      <div 
        ref={editorRef}
        className="markdown-live-editor"
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />
      
      <div className="markdown-help">
        <small>
          💡 실시간 마크다운: <strong>**굵게**</strong>, <em>*기울임*</em>, <code>`코드`</code>, 
          # 제목, • 목록, ```코드블럭```
        </small>
      </div>
    </div>
  );
}