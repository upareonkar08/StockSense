import { useState, useCallback } from 'react';
import type { ChatMessage } from '../types';
import * as chatService from '../services/chatService';

export const useChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const userMessage: ChatMessage = {
      id: `m_user_${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date()
    };

    // Append user message immediately
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const responseText = await chatService.sendMessage(content);
      const aiMessage: ChatMessage = {
        id: `m_ai_${Date.now()}`,
        role: 'ai',
        content: responseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      console.error("Failed to send message:", err);
      const errorMessage: ChatMessage = {
        id: `m_ai_err_${Date.now()}`,
        role: 'ai',
        content: "Sorry, I'm having trouble connecting right now. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    messages,
    sendMessage,
    isLoading
  };
};
export default useChat;
