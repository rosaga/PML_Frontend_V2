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
import WarningIcon from '@mui/icons-material/Warning';
import Alert from '@mui/material/Alert';

const ButtonNode = ({ data, isConnectable }) => {
  // Handle node type (route or list)
  const nodeType = data.nodeType || 'route'; 
  
  // Check if this is an end route node (route node with no outgoing connections)
  const isEndRouteNode = React.useMemo(() => {
    if (data.inputType === "Buttons" && data.nodeType === 'route') {
      return data.isEndRouteNode || false;
    }
    return false;
  }, [data.inputType, data.nodeType, data.isEndRouteNode]);
  
  // Handle delete button click
  const handleDelete = (e) => {
    e.stopPropagation(); // Prevent node selection when clicking delete
    if (data.deleteNode) {
      data.deleteNode(data.id);
    }
  };
  
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
    <div className={`bg-white rounded-lg shadow border-2 min-w-[300px] relative ${
      isEndRouteNode ? 'border-red-500 bg-red-50' : ''
    }`}>
      {/* Input handle at the top */}
      <Handle
        type="target"
        position="top"
        isConnectable={isConnectable}
        className="w-3 h-3 border-2 border-gray-400 bg-white rounded-full"
        style={{ top: -6 }}
      />
      
      {/* Header with title and delete button */}
      <div className="flex justify-between items-center p-2 border-b border-gray-100">
        <div className="flex-1 flex items-center">
          <input
            type="text"
            defaultValue={data.title}
            onBlur={(e) => data.updateNodeData(data.id, "title", e.target.value)}
            className="w-full text-sm font-medium focus:outline-none bg-transparent"
            placeholder="Enter title"
          />
          {isEndRouteNode && (
            <WarningIcon 
              className="ml-2 text-red-500" 
              fontSize="small" 
              title="Warning: Route node should not be the end of a flow"
            />
          )}
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

      {/* Warning alert for end route nodes */}
      {isEndRouteNode && (
        <div className="p-2">
          <Alert severity="warning" className="text-xs">
            Route nodes should not be the end of a flow. Connect buttons to other nodes or change to a different node type.
          </Alert>
        </div>
      )}

      {/* Content area */}
      <div className="p-4 pt-2">
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
                <Tooltip title="'Route' nodes allow buttons to connect to other nodes. 'List' nodes collect user selection and continue to next node.">
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
                label={`${nodeType === 'route' ? 'Button' : 'Option'} ${index + 1}`}
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
                  className="w-3 h-3 border-2 border-blue-400 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors"
                  isConnectable={isConnectable}
                  style={{ 
                    right: -12,
                    top: '50%',
                    transform: 'translateY(-50%)'
                  }}
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
            Add {nodeType === 'route' ? 'Button' : 'Option'}
          </Button>
        </div>
        
        {/* Visual indicator for list nodes */}
        {nodeType === 'list' && (
          <div className="mt-2 text-xs text-gray-500 text-center">
            ↓ Connect to next node
          </div>
        )}
      </div>
      
      {/* Output handle for list nodes - made more visible and better positioned */}
      {nodeType === 'list' && (
        <Handle
          type="source"
          position="bottom"
          id="list-output"
          className="w-4 h-4 border-2 border-green-500 bg-green-100 rounded-full hover:bg-green-200 transition-colors"
          isConnectable={isConnectable}
          style={{ 
            bottom: -8,
            left: '50%',
            transform: 'translateX(-50%)'
          }}
        />
      )}
    </div>
  );
};

export default ButtonNode;