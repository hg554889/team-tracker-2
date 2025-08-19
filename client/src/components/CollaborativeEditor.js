import { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import './CollaborativeEditor.css';

const CollaborativeEditor = ({ reportId, initialContent = '', onChange, disabled = false }) => {
  const [content, setContent] = useState(initialContent);
  const [collaborators, setCollaborators] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [cursors, setCursors] = useState({});
  const [version, setVersion] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  
  const textareaRef = useRef(null);
  const { socket } = useSocket();
  const { user } = useAuth();
  const lastContentRef = useRef(initialContent);
  const lastCursorRef = useRef(0);

  useEffect(() => {
    if (socket && reportId && !disabled) {
      socket.emit('join-collaboration', reportId);

      socket.on('collaboration-initialized', (data) => {
        setContent(data.content);
        setVersion(data.version);
        setCollaborators(data.collaborators || []);
        setIsConnected(true);
        lastContentRef.current = data.content;
        if (onChange) {
          onChange(data.content);
        }
      });

      socket.on('operation-applied', (data) => {
        if (data.userId !== user?._id) {
          setContent(data.content);
          setVersion(data.version);
          lastContentRef.current = data.content;
          if (onChange) {
            onChange(data.content);
          }
        }
      });

      socket.on('collaborator-joined', (data) => {
        setCollaborators(prev => {
          const exists = prev.some(c => c.userId === data.userId);
          if (!exists) {
            return [...prev, { userId: data.userId, username: data.username }];
          }
          return prev;
        });
      });

      socket.on('collaborator-left', (data) => {
        setCollaborators(prev => prev.filter(c => c.userId !== data.userId));
        setCursors(prev => {
          const newCursors = { ...prev };
          delete newCursors[data.userId];
          return newCursors;
        });
      });

      socket.on('cursor-update', (data) => {
        if (data.userId !== user?._id) {
          setCursors(prev => ({
            ...prev,
            [data.userId]: data.cursor
          }));
        }
      });

      socket.on('report-saved', () => {
        setIsSaving(false);
      });

      return () => {
        socket.off('collaboration-initialized');
        socket.off('operation-applied');
        socket.off('collaborator-joined');
        socket.off('collaborator-left');
        socket.off('cursor-update');
        socket.off('report-saved');
      };
    }
  }, [socket, reportId, disabled, user?._id, onChange]);

  const applyOperation = useCallback((operation) => {
    if (!socket || !isConnected) return;

    socket.emit('apply-operation', { operation });
  }, [socket, isConnected]);

  const handleChange = useCallback((e) => {
    if (disabled) return;
    
    const newContent = e.target.value;
    const oldContent = lastContentRef.current;
    
    if (newContent === oldContent) return;

    const operation = generateOperation(oldContent, newContent);
    if (operation) {
      applyOperation(operation);
    }

    setContent(newContent);
    lastContentRef.current = newContent;
    
    if (onChange) {
      onChange(newContent);
    }
  }, [disabled, applyOperation, onChange]);

  const handleCursorChange = useCallback(() => {
    if (!socket || disabled) return;
    
    const textarea = textareaRef.current;
    if (textarea) {
      const cursor = textarea.selectionStart;
      if (cursor !== lastCursorRef.current) {
        lastCursorRef.current = cursor;
        socket.emit('cursor-update', { cursor });
      }
    }
  }, [socket, disabled]);

  const generateOperation = (oldContent, newContent) => {
    if (oldContent.length === newContent.length) return null;
    
    let i = 0;
    while (i < Math.min(oldContent.length, newContent.length) && oldContent[i] === newContent[i]) {
      i++;
    }

    if (newContent.length > oldContent.length) {
      return {
        type: 'insert',
        position: i,
        content: newContent.slice(i, i + (newContent.length - oldContent.length))
      };
    } else {
      return {
        type: 'delete',
        position: i,
        length: oldContent.length - newContent.length
      };
    }
  };

  const handleSave = async () => {
    if (!socket || isSaving) return;
    
    setIsSaving(true);
    socket.emit('save-report');
  };

  return (
    <div className="collaborative-editor">
      <div className="editor-header">
        <div className="collaborators-info">
          <span className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? '연결됨' : '연결 안됨'}
          </span>
          {collaborators.length > 0 && (
            <div className="collaborators-list">
              <span>협업자:</span>
              {collaborators.map(collab => (
                <span key={collab.userId} className="collaborator-name">
                  {collab.username}
                </span>
              ))}
            </div>
          )}
        </div>
        
        {!disabled && (
          <button 
            className={`save-btn ${isSaving ? 'saving' : ''}`}
            onClick={handleSave}
            disabled={isSaving || !isConnected}
          >
            {isSaving ? '저장 중...' : '저장'}
          </button>
        )}
      </div>

      <div className="editor-container">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onSelect={handleCursorChange}
          onKeyUp={handleCursorChange}
          onClick={handleCursorChange}
          disabled={disabled || !isConnected}
          placeholder="보고서 내용을 입력하세요... (실시간 협업 지원)"
          className="collaborative-textarea"
        />
        
        {Object.entries(cursors).map(([userId, cursor]) => {
          const collaborator = collaborators.find(c => c.userId === userId);
          return (
            <div
              key={userId}
              className="cursor-indicator"
              style={{
                position: 'absolute',
                // 간단한 커서 위치 계산 (실제로는 더 정확한 계산 필요)
                left: `${Math.min(cursor * 0.5, 90)}%`,
                top: `${Math.floor(cursor / 50) * 1.5}em`
              }}
              title={collaborator?.username}
            />
          );
        })}
      </div>

      <div className="editor-footer">
        <small>
          버전: {version} | 실시간 협업 편집 활성화
          {Object.keys(cursors).length > 0 && ` | ${Object.keys(cursors).length}명이 편집 중`}
        </small>
      </div>
    </div>
  );
};

export default CollaborativeEditor;