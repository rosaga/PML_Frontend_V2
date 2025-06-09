"use client";
import React, { useState, useEffect, useRef } from 'react';

const VariablesPanel = ({ onVariableAdd, onClose }) => {
  const [showAddVariable, setShowAddVariable] = useState(false);
  const [newVariableName, setNewVariableName] = useState('');
  const [variables, setVariables] = useState([
    "Name",
    "Answer",
    "Email"
  ]);
  
  const variablesPanelRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        variablesPanelRef.current && 
        !variablesPanelRef.current.contains(event.target)
      ) {
        if (!showAddVariable && onClose) {
          onClose();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAddVariable, onClose]);

  const handleAddVariable = () => {
    if (newVariableName.trim()) {
      const newVar = newVariableName.trim();
      setVariables([...variables, newVar]);
      if (onVariableAdd) {
        onVariableAdd(newVar);
      }
      setNewVariableName('');
      setShowAddVariable(false);
    }
  };

  return (
    <div ref={variablesPanelRef} className="fixed top-[12vh] right-20 z-50">
      <div className="w-64 bg-white rounded-lg shadow-lg border min-w-[200px] z-20">
        {!showAddVariable ? (
          <div className="p-4 rounded-lg">
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-semibold text-gray-700">All Available variables</h2>
              <button
                onClick={() => setShowAddVariable(true)}
                className="bg-[#090A29] text-white px-2 py-1 rounded-lg text-xs flex items-center gap-1 hover:bg-opacity-90"
              >
                <span className="text-base">+</span>
                <span>Add Variable</span>
              </button>
            </div>
            <div className="space-y-2">
              {variables.map((variable) => (
                <div key={variable} className="text-xs text-gray-600 p-2 hover:bg-gray-50 rounded-md">
                  {variable}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-lg">
            {/* Close Button */}
            <button
              onClick={() => setShowAddVariable(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="text-sm font-semibold text-gray-700 mb-4">Create New Variable</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1 text-gray-600">
                  Enter Variable Name
                </label>
                <input
                  type="text"
                  value={newVariableName}
                  onChange={(e) => setNewVariableName(e.target.value)}
                  placeholder="Enter Variable Name"
                  className="w-full p-2 border rounded-lg bg-gray-50 text-xs focus:outline-none focus:ring-1 focus:ring-[#F58426]"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddVariable(false)}
                  className="flex-1 py-1.5 bg-[#F58426] text-white text-xs rounded-lg hover:bg-opacity-90 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddVariable}
                  className="flex-1 py-1.5 bg-[#090A29] text-white text-xs rounded-lg hover:bg-opacity-90 transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VariablesPanel;