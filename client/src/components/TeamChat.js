import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import './TeamChat.css';

const TeamChat = ({ teamId, isOpen, onToggle }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState('');
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();

  // 팀 채팅방에 입장하고 소켓 이벤트 설정
  useEffect(() => {
    if (socket && teamId) {
      socket.emit('join-team', teamId);

      socket.on('recent-messages', (recentMessages) => {
        setMessages(recentMessages);
      });

      socket.on('new-message', (message) => {
        setMessages(prev => [...prev, message]);
      });

      socket.on('message-updated', (updatedMessage) => {
        setMessages(prev => prev.map(msg => 
          msg._id === updatedMessage._id ? updatedMessage : msg
        ));
      });

      socket.on('message-deleted', (messageId) => {
        setMessages(prev => prev.filter(msg => msg._id !== messageId));
      });

      socket.on('user-joined', (data) => {
        setMessages(prev => [...prev, {
          _id: Date.now().toString(),
          messageType: 'system',
          message: `${data.username}님이 입장했습니다.`,
          createdAt: data.timestamp
        }]);
      });

      socket.on('user-left', (data) => {
        setMessages(prev => [...prev, {
          _id: Date.now().toString(),
          messageType: 'system',
          message: `${data.username}님이 퇴장했습니다.`,
          createdAt: data.timestamp
        }]);
      });

      socket.on('user-typing', (data) => {
        if (data.isTyping) {
          setTypingUsers(prev => {
            if (!prev.includes(data.username)) {
              return [...prev, data.username];
            }
            return prev;
          });
        } else {
          setTypingUsers(prev => prev.filter(name => name !== data.username));
        }
      });

      socket.on('error', (data) => {
        if (data.message === 'Access denied to team chat') {
          window.dispatchEvent(new CustomEvent('toast', { 
            detail: { type: 'error', msg: '이 팀 채팅에 참여할 권한이 없습니다.' } 
          }));
          onToggle(); // 채팅창 닫기
        } else {
          window.dispatchEvent(new CustomEvent('toast', { 
            detail: { type: 'error', msg: data.message || '채팅 오류가 발생했습니다.' } 
          }));
        }
      });

      return () => {
        socket.off('recent-messages');
        socket.off('new-message');
        socket.off('message-updated');
        socket.off('message-deleted');
        socket.off('user-joined');
        socket.off('user-left');
        socket.off('user-typing');
        socket.off('error');
      };
    }
  }, [socket, teamId, onToggle]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() && socket) {
      socket.emit('send-message', {
        message: newMessage.trim(),
        messageType: 'text'
      });
      setNewMessage('');
      handleStopTyping();
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    if (!isTyping && socket) {
      setIsTyping(true);
      socket.emit('typing-start');
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(handleStopTyping, 1000);
  };

  const handleStopTyping = () => {
    if (isTyping && socket) {
      setIsTyping(false);
      socket.emit('typing-stop');
    }
    clearTimeout(typingTimeoutRef.current);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleEditMessage = (message) => {
    setEditingMessage(message._id);
    setEditText(message.message);
  };

  const handleSaveEdit = (messageId) => {
    if (editText.trim() && socket) {
      socket.emit('edit-message', {
        messageId,
        newMessage: editText.trim()
      });
      setEditingMessage(null);
      setEditText('');
    }
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
    setEditText('');
  };

  const handleDeleteMessage = (messageId) => {
    if (window.confirm('이 메시지를 삭제하시겠습니까?')) {
      if (socket) {
        socket.emit('delete-message', { messageId });
      }
    }
  };

  if (!isOpen) {
    return (
      <div className="chat-toggle">
        <button className="chat-toggle-btn" onClick={onToggle}>
          💬 팀 채팅
        </button>
      </div>
    );
  }

  return (
    <div className="team-chat">
      <div className="chat-header">
        <h4>팀 채팅</h4>
        <div className="chat-status">
          <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
          <span>{isConnected ? '연결됨' : '연결 안됨'}</span>
        </div>
        <button className="chat-close" onClick={onToggle}>✕</button>
      </div>
      
      <div className="chat-messages">
        {messages.map((message) => (
          <div 
            key={message._id} 
            className={`message ${message.messageType === 'system' ? 'system' : ''} ${
              message.userId?._id === user?._id ? 'own' : ''
            }`}
          >
            {message.messageType === 'system' ? (
              <div className="system-message">
                {message.message}
                <span className="timestamp">{formatTime(message.createdAt)}</span>
              </div>
            ) : (
              <>
                <div className="message-header">
                  <span className="username">{message.userId?.username}</span>
                  <span className="timestamp">{formatTime(message.createdAt)}</span>
                  {message.isEdited && <span className="edited">(수정됨)</span>}
                  {message.userId?._id === user?._id && (
                    <div className="message-actions">
                      <button 
                        className="message-action-btn edit-btn"
                        onClick={() => handleEditMessage(message)}
                        title="수정"
                      >
                        ✏️
                      </button>
                      <button 
                        className="message-action-btn delete-btn"
                        onClick={() => handleDeleteMessage(message._id)}
                        title="삭제"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
                {editingMessage === message._id ? (
                  <div className="message-edit">
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveEdit(message._id);
                        } else if (e.key === 'Escape') {
                          handleCancelEdit();
                        }
                      }}
                      className="edit-input"
                      autoFocus
                    />
                    <div className="edit-actions">
                      <button 
                        className="edit-save-btn"
                        onClick={() => handleSaveEdit(message._id)}
                      >
                        저장
                      </button>
                      <button 
                        className="edit-cancel-btn"
                        onClick={handleCancelEdit}
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="message-content">{message.message}</div>
                )}
              </>
            )}
          </div>
        ))}
        
        {typingUsers.length > 0 && (
          <div className="typing-indicator">
            {typingUsers.join(', ')}님이 입력 중...
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <form className="chat-input" onSubmit={handleSendMessage}>
        <input
          type="text"
          value={newMessage}
          onChange={handleTyping}
          placeholder="메시지를 입력하세요..."
          disabled={!isConnected}
          maxLength={1000}
        />
        <button type="submit" disabled={!newMessage.trim() || !isConnected}>
          전송
        </button>
      </form>
    </div>
  );
};

export default TeamChat;