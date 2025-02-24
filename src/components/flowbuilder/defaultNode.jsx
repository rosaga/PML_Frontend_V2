import React from 'react';
import { Handle } from 'reactflow';

const DefaultNode = ({ data, isConnectable }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow border-2 min-w-[250px]">
      {/* Title field - Using exactly the same style as NumberNode */}
      <div className="mb-2">
        <input
          type="text"
          defaultValue={data.title}
          onBlur={(e) => data.updateNodeData?.(data.id, "title", e.target.value)}
          className="w-full p-2 text-sm font-medium focus:outline-none bg-transparent"
          placeholder="Enter title"
        />
      </div>
      
      {/* Prompt field - Using exactly the same style as NumberNode */}
      <div className="mb-4">
        <input
          type="text"
          defaultValue={data.prompt}
          onBlur={(e) => data.updateNodeData?.(data.id, "prompt", e.target.value)}
          className="w-full p-2 text-sm focus:outline-none bg-transparent"
          placeholder="Enter prompt"
        />
      </div>

      {/* Input handle - Same positioning and style as NumberNode */}
      <Handle
        type="target"
        position="top"
        isConnectable={isConnectable}
        className="w-3 h-3 border-2 border-gray-400 bg-white rounded-full"
      />
      
      {/* Output handle - Same positioning and style as NumberNode */}
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