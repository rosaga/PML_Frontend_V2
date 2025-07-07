import React, { useState } from 'react';
import { Handle } from 'reactflow';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';

const DefaultNode = ({ data, isConnectable }) => {
  const [title, setTitle] = useState(data.title || "");
  const [prompt, setPrompt] = useState(data.prompt || "");

  // Handle delete button click
  const handleDelete = (e) => {
    e.stopPropagation(); // Prevent node selection when clicking delete
    if (data.deleteNode) {
      data.deleteNode(data.id);
    }
  };

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
    <div className="bg-white rounded-lg shadow border-2 min-w-[250px] relative">
      {/* Header with delete button */}
      <div className="flex justify-between items-center p-2 border-b border-gray-100">
        <div className="flex-1">
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            onFocus={handleTitleFocus}
            onBlur={handleTitleBlur}
            className="w-full text-sm font-medium focus:outline-none bg-transparent"
            placeholder="Enter title"
          />
        </div>
        {/* Delete button */}
        <IconButton
          size="small"
          onClick={handleDelete}
          className="ml-2 text-red-500 hover:text-red-700 hover:bg-red-50"
          style={{ 
            padding: '4px',
            fontSize: '16px'
          }}
          title="Delete node"
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </div>

      {/* Content area */}
      <div className="p-4 pt-2">
        {/* Prompt field */}
        <div className="mb-2">
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