import React, { useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { QUICK_CHAT_PRESETS } from '../../types/bowling';

export default function QuickChat({ messages = [], onSendMessage }) {
  const [isOpen, setIsOpen] = useState(false);
  const [customText, setCustomText] = useState('');

  const handleSendPreset = (text) => {
    if (onSendMessage) {
      onSendMessage(text);
    }
  };

  const handleSendCustom = (e) => {
    e.preventDefault();
    if (!customText.trim()) return;
    if (onSendMessage) {
      onSendMessage(customText.trim());
    }
    setCustomText('');
  };

  return (
    <div className="quick-chat-container">
      {/* Recent Chat Floating Toasts */}
      <div className="chat-bubbles-stack">
        {messages.slice(-3).map((msg, idx) => (
          <div key={msg.id || idx} className="chat-bubble-toast">
            <span className="chat-sender">{msg.sender}:</span>
            <span className="chat-text">{msg.text}</span>
          </div>
        ))}
      </div>

      {/* Chat Toggle Button */}
      <button
        className={`chat-toggle-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Buka Chat Tongkrongan"
      >
        <MessageSquare size={18} />
        <span className="hidden sm:inline">Chat</span>
      </button>

      {/* Chat Panel Modal */}
      {isOpen && (
        <div className="quick-chat-panel">
          <div className="chat-panel-header">
            <span>CHAT TONGKRONGAN DISCO</span>
            <button className="close-panel-btn" onClick={() => setIsOpen(false)}>✕</button>
          </div>

          <div className="chat-presets-list">
            <span className="preset-label">Quick Trash-talk:</span>
            <div className="presets-grid">
              {QUICK_CHAT_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  className="preset-chip-btn"
                  onClick={() => handleSendPreset(preset)}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSendCustom} className="chat-input-row">
            <input
              type="text"
              placeholder="Tulis pesan..."
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              className="chat-input-field"
              maxLength={60}
            />
            <button type="submit" className="chat-send-btn" disabled={!customText.trim()}>
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
