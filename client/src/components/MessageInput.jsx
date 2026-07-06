import { useState, useRef, useCallback } from "react";


export default function MessageInput({ onSend, onTypingStart, onTypingStop, disabled }) {
  const [text, setText] = useState("");
  const isTypingRef = useRef(false);
  const typingTimerRef = useRef(null);

  // Debounced typing stop: fires 1200ms after the last keystroke
  const handleTypingStop = useCallback(() => {
    if (isTypingRef.current) {
      isTypingRef.current = false;
      onTypingStop?.();
    }
  }, [onTypingStop]);

  function handleChange(e) {
    const value = e.target.value;
    setText(value);

    if (value.trim()) {
      // Phase 2: Emit typing:start if not already marked as typing
      if (!isTypingRef.current) {
        isTypingRef.current = true;
        onTypingStart?.();
      }
      // Reset the stop-timer on every keystroke
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(handleTypingStop, 1200);
    } else {
      // Empty input → stop typing immediately
      clearTimeout(typingTimerRef.current);
      handleTypingStop();
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;

    // Phase 1: Emit the message to the server
    onSend(trimmed);
    setText("");

    // Clear typing state on send
    clearTimeout(typingTimerRef.current);
    if (isTypingRef.current) {
      isTypingRef.current = false;
      onTypingStop?.();
    }
  }

  function handleKeyDown(e) {
    // Send on Enter (without Shift)
    if (e.key === "Enter" && !e.shiftKey) {
      handleSubmit(e);
    }
  }

  return (
    <div className="input-bar">
      <form onSubmit={handleSubmit}>
        <div className="input-bar-inner">
          <input
            id="message-input"
            type="text"
            className="input-bar-input"
            placeholder={disabled ? "Connecting…" : "Type a message… (Enter to send)"}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            autoComplete="off"
            maxLength={500}
          />
          <button
            id="send-btn"
            type="submit"
            className="input-send-btn"
            disabled={!text.trim() || disabled}
            aria-label="Send message"
          >
            ➤
          </button>
        </div>
      </form>
    </div>
  );
}
