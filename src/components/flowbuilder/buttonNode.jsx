import React from 'react';
import { Handle } from 'reactflow';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';

const ButtonNode = ({ data, isConnectable }) => {
    return (
        <div className="bg-white p-4 rounded-lg shadow border-2 min-w-[250px]">
        
          {/* Title field with TextField */}
          <div className="mb-2">
          <input
            type="text"
            defaultValue={data.title}
            onBlur={(e) => data.updateNodeData(data.id, "title", e.target.value)}
            className="w-full p-2 text-sm font-medium focus:outline-none bg-transparent"
            placeholder="Enter title"
          />
        </div>
          {/* <input
            fullWidth
            size="small"
            defaultValue={data.title}
            onBlur={(e) => data.updateNodeData(data.id, "title", e.target.value)}
            placeholder="Enter title"
            variant="standard"
            InputProps={{
              style: { fontWeight: 'bold', fontSize: '14px' }
            }}
            className="mb-2"
          /> */}
          
          {/* Prompt field with TextField */}
          <div className="mb-2">
          <input
            type="text"
            defaultValue={data.prompt}
            onBlur={(e) => data.updateNodeData(data.id, "prompt", e.target.value)}
            className="w-full p-2 text-sm font-medium focus:outline-none bg-transparent"
            placeholder="Enter title"
          />
        </div>
          {/* <TextField
            fullWidth
            size="small"
            defaultValue={data.prompt}
            onBlur={(e) => data.updateNodeData(data.id, "prompt", e.target.value)}
            placeholder="Enter prompt"
            variant="standard"
            InputProps={{
              style: { fontSize: '14px' }
            }}
            className="mb-4"
          /> */}

      {/* Button options */}
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
            {/* Connection handle for each button */}
            <Handle
              type="source"
              position="right"
              id={`button-${index}`}
              className="w-3 h-3 border-2 border-gray-400 bg-white rounded-full"
              isConnectable={isConnectable}
              style={{ right: -10 }}
            />
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
        
        <Button
          onClick={data.saveButtonConfig}
          fullWidth
          variant="contained"
          color="primary"
          size="small"
        >
          Save Buttons
        </Button>
      </div>

      {/* Input handle */}
      <Handle
        type="target"
        position="top"
        isConnectable={isConnectable}
        className="w-3 h-3 border-2 border-gray-400 bg-white rounded-full"
      />
    </div>
  );
};

export default ButtonNode;