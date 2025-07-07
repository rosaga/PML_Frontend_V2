import React from 'react';
import { Handle } from 'reactflow';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';

const NumberNode = ({ data, isConnectable }) => {
  const [isConfigOpen, setIsConfigOpen] = React.useState(false);

  // Handle delete button click
  const handleDelete = (e) => {
    e.stopPropagation(); // Prevent node selection when clicking delete
    if (data.deleteNode) {
      data.deleteNode(data.id);
    }
  };

  const handlePanelClick = () => {
    setIsConfigOpen(!isConfigOpen);
    data.openNumberConfigPanel(data.id);
  };

  return (
    <div className="bg-white rounded-lg shadow border-2 min-w-[250px]">
      {/* Header with title and delete button */}
      <div className="flex justify-between items-center p-2 border-b border-gray-100">
        <div className="flex-1">
          <input
            type="text"
            defaultValue={data.title}
            onBlur={(e) => data.updateNodeData(data.id, "title", e.target.value)}
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
        <div className="mb-4">
          <input
            type="text"
            defaultValue={data.prompt}
            onBlur={(e) => data.updateNodeData(data.id, "prompt", e.target.value)}
            className="w-full p-2 text-sm focus:outline-none bg-transparent"
            placeholder="Enter prompt"
          />
        </div>

        {/* Number Input Configuration */}
        <div 
          onClick={handlePanelClick}
          className="bg-gray-100 p-2 rounded text-center text-sm cursor-pointer hover:bg-gray-200"
        >
          Enter Number 
        </div>
          
        {isConfigOpen && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <FormControl fullWidth margin="dense" size="small">
              <TextField
                label="Minimum"
                type="number"
                value={data.tempNumberConfig?.minimum ?? ''}
                onChange={(e) => data.handleNumberConfigChange('minimum', e.target.value === '' ? undefined : parseInt(e.target.value, 10))}
                size="small"
                className="mb-2"
              />
            </FormControl>
            
            <FormControl fullWidth margin="dense" size="small">
              <TextField
                label="Maximum"
                type="number"
                value={data.tempNumberConfig?.maximum ?? ''}
                onChange={(e) => data.handleNumberConfigChange('maximum', e.target.value === '' ? undefined : parseInt(e.target.value, 10))}
                size="small"
                className="mb-2"
              />
            </FormControl>
            
            <FormControl fullWidth margin="dense" size="small">
              <InputLabel>Save to Variable</InputLabel>
              <Select
                value={data.tempNumberConfig?.variableName || ''}
                label="Save to Variable"
                onChange={(e) => data.handleNumberConfigChange('variableName', e.target.value)}
              >
                <MenuItem value=""><em>None</em></MenuItem>
                {data.variableOptions?.map((option) => (
                  <MenuItem key={option} value={option}>{option}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <div className="flex justify-end gap-2 mt-3">
              <Button 
                onClick={() => {
                  setIsConfigOpen(false);
                  data.cancelNumberConfig();
                }}
                size="small"
              >
                Cancel
              </Button>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => {
                  setIsConfigOpen(false);
                  data.saveNumberConfig();
                }}
                size="small"
              >
                Save
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position="top"
        isConnectable={isConnectable}
        className="w-3 h-3 border-2 border-gray-400 bg-white rounded-full"
      />
      <Handle
        type="source"
        position="bottom"
        isConnectable={isConnectable}
        className="w-3 h-3 border-2 border-gray-400 bg-white rounded-full"
      />
    </div>
  );
};

export default NumberNode;