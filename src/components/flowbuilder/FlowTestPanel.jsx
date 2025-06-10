import React, { useState, useEffect, useRef } from 'react';
import { X, Send } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const FlowTestPanel = ({ flowId, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [isFlowEnded, setIsFlowEnded] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    setSessionId(uuidv4());
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Initial load - start the flow conversation
  useEffect(() => {
    if (sessionId && flowId) {
      startConversation();
    }
  }, [sessionId, flowId]);

  const startConversation = async () => {
    setIsLoading(true);
    try {
      const response = await sendMessage('');
      
      if (response) {
        setMessages([
          { 
            sender: 'bot', 
            text: response.text,
            rawOptions: response.rawOptions,
            isEnd: response.isEnd
          }
        ]);
        
        setIsFlowEnded(response.isEnd);
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      setMessages([
        { 
          sender: 'bot', 
          text: 'There was an error starting the conversation. Please try again.'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (text) => {
    const formData = new FormData();
    formData.append('phoneNumber', '+25470207787');
    formData.append('sessionId', sessionId);
    formData.append('text', text);
    formData.append('serviceCode', '206-692-7938');
    formData.append('networkCode', '99999');

    try {
      const response = await fetch(`https://flowbot-1048592730476.europe-west4.run.app/public/flow/navigate/${flowId}`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Failed to navigate flow: ${response.statusText}`);
      }

      const htmlResponse = await response.text();
      console.log('Flow navigation response:', htmlResponse);
      
      const processedResponse = processHtmlResponse(htmlResponse);
      return processedResponse;
    } catch (error) {
      console.error('Error navigating flow:', error);
      throw error;
    }
  };

  const processHtmlResponse = (htmlResponse) => {
    if (!htmlResponse) return { text: "No response received", isEnd: false };

    // Check if response starts with 'END' or 'CON'
    const isEnd = htmlResponse.trim().startsWith('END');
    
    // Remove the prefix (END or CON)
    let text = htmlResponse.trim();
    if (text.startsWith('END ')) {
      text = text.substring(4);
    } else if (text.startsWith('CON ')) {
      text = text.substring(4);
    }
    
    // Try to extract options if the message contains numbered items
    const options = [];
    const rawOptions = [];
    const lines = text.split('\n');
    
    let mainMessage = text;
    
    if (lines.length > 1) {
      mainMessage = lines[0];
      const optionLines = lines.slice(1);
      
      // Check for options in format "1. Option text"
      const optionRegex = /^\s*(\d+)\.\s+(.+)$/;
      
      optionLines.forEach(line => {
        const match = line.match(optionRegex);
        if (match) {
          const optionNumber = match[1];
          const optionText = match[2].trim();
          options.push(optionText);
          rawOptions.push({
            number: optionNumber,
            text: optionText,
            rawText: line.trim()
          });
        }
      });
    }
    
    return { 
      text: mainMessage, 
      options: options.length > 0 ? options : null,
      rawOptions: rawOptions.length > 0 ? rawOptions : null,
      isEnd 
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (inputText.trim() === '' || isFlowEnded) return;
    
    // Add user message to chat
    const userMessage = { sender: 'user', text: inputText };
    setMessages(prev => [...prev, userMessage]);
    
    setInputText('');
    setIsLoading(true);
    
    try {
      const response = await sendMessage(inputText);
      
      if (response) {
        setMessages(prev => [
          ...prev,
          { 
            sender: 'bot', 
            text: response.text,
            rawOptions: response.rawOptions,
            isEnd: response.isEnd
          }
        ]);
        
        setIsFlowEnded(response.isEnd);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [
        ...prev,
        { 
          sender: 'bot', 
          text: 'There was an error processing your message. Please try again.'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptionClick = async (option) => {
    if (isFlowEnded) return;
    
    // Add user selection to chat - use the option number
    const userMessage = { sender: 'user', text: option.number };
    setMessages(prev => [...prev, userMessage]);
    
    setIsLoading(true);
    
    try {
      const response = await sendMessage(option.number);
      
      if (response) {
        setMessages(prev => [
          ...prev,
          { 
            sender: 'bot', 
            text: response.text,
            rawOptions: response.rawOptions,
            isEnd: response.isEnd
          }
        ]);
        
        setIsFlowEnded(response.isEnd);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [
        ...prev,
        { 
          sender: 'bot', 
          text: 'There was an error processing your selection. Please try again.'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetConversation = () => {
    // Generate a new session ID and reset messages
    setSessionId(uuidv4());
    setMessages([]);
    setIsFlowEnded(false);
    // The useEffect will trigger startConversation
  };

  return (
    <div className="w-96 h-full flex flex-col border-l border-gray-200 bg-white">
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200 bg-gray-50">
        <h2 className="font-semibold text-lg">Test Flow</h2>
        <div className="flex space-x-3">
          <button 
            onClick={resetConversation}
            className="text-sm px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
          >
            Reset
          </button>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !isLoading ? (
          <div className="text-center text-gray-500 mt-10">
            Starting conversation...
          </div>
        ) : (
          messages.map((message, index) => (
            <div key={index} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-3/4 p-3 rounded-lg ${
                  message.sender === 'user' 
                    ? 'bg-blue-500 text-white rounded-tr-none' 
                    : 'bg-gray-100 text-gray-800 rounded-tl-none'
                }`}
              >
                <p>{message.text}</p>
                
                {/* Show options if available */}
                {message.sender === 'bot' && message.rawOptions && message.rawOptions.length > 0 && !message.isEnd && (
                  <div className="mt-2 space-y-2">
                    {message.rawOptions.map((option, optIndex) => (
                      <button
                        key={optIndex}
                        onClick={() => handleOptionClick(option)}
                        className="block w-full text-left px-3 py-2 bg-white hover:bg-gray-50 border border-gray-300 rounded text-sm"
                      >
                        {`${option.number}. ${option.text}`}
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Show end message indicator */}
                {message.sender === 'bot' && message.isEnd && (
                  <div className="mt-2 text-xs text-gray-500">
                    End of flow
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-3 rounded-lg rounded-tl-none">
              <div className="flex space-x-2">
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{animationDelay: '0ms'}}></div>
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{animationDelay: '150ms'}}></div>
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{animationDelay: '300ms'}}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input area */}
      <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading || isFlowEnded}
          />
          <button 
            type="submit" 
            className={`${isFlowEnded ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'} text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
            disabled={isLoading || isFlowEnded}
          >
            <Send size={20} />
          </button>
        </div>
        {isFlowEnded && (
          <div className="mt-2 text-xs text-center text-gray-500">
            This flow has ended. Click &quot;Reset&quot; to start over.
          </div>
        )}
      </form>
    </div>
  );
};

export default FlowTestPanel;