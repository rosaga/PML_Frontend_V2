import React from 'react';
import { Handle } from 'reactflow';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import FormLabel from '@mui/material/FormLabel';
import Tooltip from '@mui/material/Tooltip';
import InfoIcon from '@mui/icons-material/Info';

const ButtonNode = ({ data, isConnectable }) => {
  // Handle node type (route or list)
  const nodeType = data.nodeType || 'route'; 
  
  // Handler for changing node type (route or list)
  const handleNodeTypeChange = (event) => {
    const newType = event.target.value;
    if (data.updateNodeData) {
      data.updateNodeData(data.id, "nodeType", newType);
    }
  };

  // Handler for removing a button
  const removeButton = (index) => {
    const newButtons = [...data.buttonOptions];
    newButtons.splice(index, 1);
    data.updateNodeData(data.id, "buttonOptions", newButtons);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow border-2 min-w-[300px]">
      {/* Title field */}
      <div className="mb-2">
        <input
          type="text"
          defaultValue={data.title}
          onBlur={(e) => data.updateNodeData(data.id, "title", e.target.value)}
          className="w-full p-2 text-sm font-medium focus:outline-none bg-transparent"
          placeholder="Enter title"
        />
      </div>
      
      {/* Prompt field */}
      <div className="mb-2">
        <input
          type="text"
          defaultValue={data.prompt}
          onBlur={(e) => data.updateNodeData(data.id, "prompt", e.target.value)}
          className="w-full p-2 text-sm font-medium focus:outline-none bg-transparent"
          placeholder="Enter prompt"
        />
      </div>
      
      {/* Node type selection */}
      <div className="mb-3 p-2 bg-gray-50 rounded-md">
        <FormControl component="fieldset" size="small">
          <FormLabel component="legend" style={{ fontSize: '12px', marginBottom: '8px' }}>
            <div className="flex items-center">
              <span>Node Type</span>
              <Tooltip title="'Route' nodes allow buttons to connect to other nodes. 'List' nodes don't connect to any nodes.">
                <InfoIcon fontSize="small" className="ml-1 text-gray-400" />
              </Tooltip>
            </div>
          </FormLabel>
          <RadioGroup
            row
            value={nodeType}
            onChange={handleNodeTypeChange}
          >
            <FormControlLabel 
              value="route" 
              control={<Radio size="small" />} 
              label="Route" 
              style={{ marginRight: '12px' }}
            />
            <FormControlLabel 
              value="list" 
              control={<Radio size="small" />} 
              label="List" 
            />
          </RadioGroup>
        </FormControl>
      </div>
      
      <div className="space-y-3">
        {data.buttonOptions?.map((button, index) => (
          <div key={index} className="relative flex items-center">
            <TextField
              fullWidth
              size="small"
              value={button.label}
              onChange={(e) => data.handleButtonConfigChange(index, 'label', e.target.value)}
              label={`Button ${index + 1}`}
              margin="dense"
            />
            
            <IconButton 
              size="small" 
              color="error" 
              onClick={() => removeButton(index)}
              disabled={data.buttonOptions.length <= 1}
              style={{ marginLeft: '8px' }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
            
            {/* Connection handle for each button - only shown for route nodes */}
            {nodeType === 'route' && (
              <Handle
                type="source"
                position="right"
                id={`button-${index}`}
                className="w-3 h-3 border-2 border-gray-400 bg-white rounded-full"
                isConnectable={isConnectable}
                style={{ right: -10 }}
              />
            )}
          </div>
        ))}
      </div>
      
      {/* Add button control */}
      <div className="mt-4 space-y-2">
        <Button
          onClick={data.addButtonItem}
          fullWidth
          variant="outlined"
          size="small"
          startIcon={<AddIcon />}
        >
          Add Button
        </Button>
       
      </div>
      
      <Handle
        type="target"
        position="top"
        isConnectable={isConnectable}
        className="w-3 h-3 border-2 border-gray-400 bg-white rounded-full"
      />
      
      {/* Output handle for list nodes */}
      {nodeType === 'list' && (
        <Handle
          type="source"
          position="bottom"
          id="list-output"
          className="w-3 h-3 border-2 border-gray-400 bg-white rounded-full"
          isConnectable={isConnectable}
        />
      )}
    </div>
  );
};

export default ButtonNode;