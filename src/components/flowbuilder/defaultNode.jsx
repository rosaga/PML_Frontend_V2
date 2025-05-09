import React, { useState } from 'react';
import { Handle } from 'reactflow';

const DefaultNode = ({ data, isConnectable }) => {
  const [title, setTitle] = useState(data.title || "");
  const [prompt, setPrompt] = useState(data.prompt || "");

  // Handle focusing on title field
  const handleTitleFocus = (e) => {
    if (e.target.value === "Click to edit title") {
      setTitle("");
    }
  };
  
  // Handle focusing on prompt field
  const handlePromptFocus = (e) => {
    if (e.target.value === "Click to edit question/prompt") {
      setPrompt("");
    }
  };
  
  // Handle title change
  const handleTitleChange = (e) => {
    setTitle(e.target.value);
  };
  
  // Handle prompt change
  const handlePromptChange = (e) => {
    setPrompt(e.target.value);
  };
  
  // Handle blur events to save data
  const handleTitleBlur = (e) => {
    // Update the node data with current title
    data.updateNodeData?.(data.id, "title", e.target.value);
  };
  
  const handlePromptBlur = (e) => {
    // Update the node data with current prompt
    data.updateNodeData?.(data.id, "prompt", e.target.value);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow border-2 min-w-[250px]">
      {/* Title field */}
      <div className="mb-2">
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          onFocus={handleTitleFocus}
          onBlur={handleTitleBlur}
          className="w-full p-2 text-sm font-medium focus:outline-none bg-transparent"
          placeholder="Enter title"
        />
      </div>
      
      {/* Prompt field */}
      <div className="mb-4">
        <input
          type="text"
          value={prompt}
          onChange={handlePromptChange}
          onFocus={handlePromptFocus}
          onBlur={handlePromptBlur}
          className="w-full p-2 text-sm focus:outline-none bg-transparent"
          placeholder="Enter prompt"
        />
      </div>
      
      {/* Input handle */}
      <Handle
        type="target"
        position="top"
        isConnectable={isConnectable}
        className="w-3 h-3 border-2 border-gray-400 bg-white rounded-full"
      />
      
      {/* Output handle */}
      <Handle
        type="source"
        position="bottom"
        isConnectable={isConnectable}
        className="w-3 h-3 border-2 border-gray-400 bg-white rounded-full"
      />
    </div>
  );
};

export default DefaultNode;