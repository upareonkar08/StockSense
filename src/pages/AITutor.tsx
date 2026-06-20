import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, ArrowUp, User } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { useChat } from '../hooks/useChat';

const pageVariants = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, y: -16, transition: { duration: 0.25 } }
};

const suggestedQuestions = [
  "Why is my portfolio risky?",
  "Should I sell TSLA now?",
  "What is portfolio diversification?",
  "How do I reduce my risk score?",
  "Explain Sharpe Ratio",
  "What is a good P/E ratio?"
];

export const AITutor: React.FC = () => {
  const { messages, sendMessage, isLoading } = useChat();
  const [inputText, setInputText] = useState('');
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    document.title = "Analyst Chat — StockSense";
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;
    setInputText('');
    await sendMessage(text);
  };

  const handleQuestionClick = (q: string) => {
    setActiveQuestion(q);
    handleSend(q);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const renderMessageContent = (content: string, isUserMessage: boolean) => {
    return content.split('\n').map((line, lineIdx) => {
      const parts = line.split(/(\*\*.*?\*\*|`.*?`)/g);
      const elements = parts.map((part, partIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong 
              key={partIdx} 
              className={`font-black ${isUserMessage ? 'text-white' : 'text-textPrimary font-extrabold'}`}
            >
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code 
              key={partIdx} 
              className={`px-1 py-0.5 rounded font-mono text-[10px] border ${
                isUserMessage 
                  ? 'bg-white/15 border-white/20 text-white' 
                  : 'bg-slate-100 border-borderColor text-accent'
              }`}
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        return part;
      });

      return (
        <span key={lineIdx} className="block min-h-[0.5rem]">
          {elements}
        </span>
      );
    });
  };

  return (
    <DashboardLayout>
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="h-[calc(100vh-8rem)] min-h-[500px] flex flex-col md:flex-row gap-6 text-left overflow-hidden"
      >
        {/* LEFT PANEL: Suggested Questions (280px, fixed) */}
        <div className="w-full md:w-[280px] flex flex-col shrink-0">
          <Card className="flex-1 flex flex-col p-5 overflow-hidden">
            <h3 className="text-xs font-bold text-textPrimary uppercase tracking-wider mb-4">
              Suggested Questions
            </h3>
            <div className="space-y-2.5 flex-grow overflow-y-auto pr-1">
              {suggestedQuestions.map((q, index) => {
                const isActive = activeQuestion === q;
                return (
                  <motion.div
                    key={q}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.07, ease: "easeOut" }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => handleQuestionClick(q)}
                    className={`
                      p-3 rounded-lg border text-xs font-semibold cursor-pointer transition-all duration-200 text-left
                      ${isActive
                        ? 'bg-accent border-accent text-white shadow-md shadow-indigo-100'
                        : 'border-borderColor bg-white text-textPrimary hover:bg-slate-50 hover:shadow-sm'
                      }
                    `}
                  >
                    {q}
                  </motion.div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* RIGHT PANEL: Chat Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-white border border-borderColor rounded-xl shadow-sm overflow-hidden">
          {/* Top Bar */}
          <div className="px-6 py-4 border-b border-borderColor flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-accent">
                <MessageSquare size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-textPrimary">Portfolio Analyst</h3>
                <span className="text-[10px] font-bold text-success flex items-center gap-1 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                  Active
                </span>
              </div>
            </div>
            <Badge variant="accent">Portfolio Support</Badge>
          </div>

          {/* Messages List Area */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/20">
            <AnimatePresence>
              {messages.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col items-center justify-center text-center space-y-3 py-10"
                >
                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                    className="h-14 w-14 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-accent"
                  >
                    <MessageSquare size={30} />
                  </motion.div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-textPrimary">Ask about your portfolio</h4>
                    <p className="text-xs text-textSecondary max-w-sm leading-relaxed">
                      Connect with a Portfolio Analyst to review volatility, asset weightings, and rebalancing recommendations.
                    </p>
                  </div>
                </motion.div>
              ) : (
                messages.map((msg) => {
                  const isUser = msg.role === 'user';
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`flex gap-3 max-w-[75%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                    >
                      <div className={`
                        h-8 w-8 rounded-full flex items-center justify-center shrink-0 border text-xs font-bold
                        ${isUser
                          ? 'bg-slate-100 border-slate-200 text-textPrimary'
                          : 'bg-indigo-50 border-indigo-100 text-accent'
                        }
                      `}>
                        {isUser ? <User size={14} /> : <MessageSquare size={14} />}
                      </div>

                      {/* Bubble */}
                      <div className="space-y-1">
                        <div className={`
                          p-3.5 text-xs leading-relaxed
                          ${isUser
                            ? 'bg-accent text-white rounded-2xl rounded-tr-sm shadow-sm'
                            : 'bg-white text-textPrimary border border-borderColor rounded-2xl rounded-bl-sm shadow-sm'
                          }
                        `}>
                          {renderMessageContent(msg.content, isUser)}
                        </div>
                        <p className={`text-[9px] text-textSecondary font-semibold ${isUser ? 'text-right' : 'text-left'}`}>
                          {formatTime(msg.timestamp)}
                        </p>
                      </div>
                    </motion.div>
                  );
                })
              )}

              {/* Typing indicator */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex gap-3 mr-auto max-w-[75%]"
                >
                  <div className="h-8 w-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-accent shrink-0">
                    <MessageSquare size={14} />
                  </div>
                  <div className="bg-white border border-borderColor p-3 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-1.5 h-9">
                    {/* Bouncing dots */}
                    {[0, 0.15, 0.3].map((delay, index) => (
                      <motion.span
                        key={index}
                        animate={{ y: [0, -6, 0] }}
                        transition={{
                          repeat: Infinity,
                          duration: 0.6,
                          ease: "easeInOut",
                          delay
                        }}
                        className="h-1.5 w-1.5 bg-textSecondary rounded-full inline-block"
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={chatEndRef} />
          </div>

          {/* Input Bar */}
          <div className="p-4 border-t border-borderColor bg-white">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(inputText);
              }}
              className="flex gap-3"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isLoading}
                placeholder={isLoading ? "Analyst is typing..." : "Ask a question about your portfolio..."}
                className="flex-1 rounded-lg border border-borderColor bg-white py-2.5 px-4 text-xs text-textPrimary placeholder-textSecondary outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 disabled:bg-slate-50 disabled:cursor-not-allowed"
              />
              <Button
                type="submit"
                variant="primary"
                disabled={!inputText.trim() || isLoading}
                className="rounded-lg h-9 w-9 p-0 flex items-center justify-center shrink-0"
              >
                <ArrowUp size={16} />
              </Button>
            </form>
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};
export default AITutor;
