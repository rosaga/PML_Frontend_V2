"use client";
import React, { useState, useCallback } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle
} from "reactflow";
import Flag from '@mui/icons-material/Flag';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import { Menu, ChevronLeft, Play } from 'lucide-react';
import VariablesPanel from './variablePanel';
import ButtonNode from './ButtonNode';
import NumberNode from './NumberNode';
import TextNode from './TextNode';
import createTemplateFlow from './templateHandler'
import DefaultNode from './defaultNode';



import "reactflow/dist/style.css";

const initialNodes = [
  {
    id: "start",
    type: "input",
    data: { label: <div style={{ display: 'flex', alignItems: 'center', fontWeight: 'bold' }}> <Flag size={16} /> Start </div> },
    position: { x: 250, y: 5 },
    style: { width: 150, height: 50, background: "#f0f0f0", padding: "10px", borderRadius: "8px", fontWeight: "bold", textAlign: "center" }
  }
];

const nodeTypes = {
  buttonNode: ButtonNode,
  numberNode: NumberNode,
  textNode: TextNode,
  default: DefaultNode,
};

const initialEdges = [];

const variableOptions = [
  "age",
  "name",
  "email",
  "phone",
  "location"
];

export default function FlowBuilderUI() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [nodeIdCounter, setNodeIdCounter] = useState(1);
  const [selectedNode, setSelectedNode] = useState(null);
  const [tempNumberConfig, setTempNumberConfig] = useState({});
  const [configPanelVisibleNodeId, setConfigPanelVisibleNodeId] = useState(null);
  const [tempTextInputConfig, setTempTextInputConfig] = useState({});
  const [textConfigPanelVisibleNodeId, setTextConfigPanelVisibleNodeId] = useState(null);
  const [tempButtonConfig, setTempButtonConfig] = useState({ buttons: [{ label: 'Button 1' }, { label: 'Button 2' }] });
  

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const addNode = () => {
    const newNodeId = `node-${nodeIdCounter}`;
    const newNode = {
      id: newNodeId,
      type: "default",
      data: { 
        id: newNodeId, 
        title: "Click to edit title", 
        prompt: "Click to edit question/prompt", 
        inputType: null, 
        updateNodeData, // Add this line
        numberInputOptions: {}, 
        textInputOptions: {}, 
        buttonOptions: [{ label: 'Button 1' }, { label: 'Button 2' }] 
      },
      position: { x: 200 + nodeIdCounter * 100, y: 100 + nodeIdCounter * 100 },
      className: "min-w-[250px]" // Use className instead of style for consistency
    };
  
    setNodes((nds) => [...nds, newNode]);
    setNodeIdCounter((prev) => prev + 1);
  };
  const handleVariableAdd = (newVariable) => {
    // Handle the new variable in your main component if needed
    console.log('New variable added:', newVariable);
  };

  const updateNodeData = (id, key, value) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, [key]: value } } : node
      )
    );
  };
  const applyTemplate = () => {
    const { nodes: templateNodes, edges: templateEdges } = createTemplateFlow();
    
    // Update nodes with necessary handler functions
    const nodesWithHandlers = templateNodes.map(node => {
      let updatedNode = { ...node };
      
      if (node.type === "numberNode") {
        updatedNode.data = {
          ...node.data,
          handleNumberConfigChange,
          saveNumberConfig,
          cancelNumberConfig,
          openNumberConfigPanel,
          updateNodeData,
          tempNumberConfig,
          configPanelVisibleNodeId,
          selectedNode,
          variableOptions
        };
      }
      else if (node.type === "textNode") {
        updatedNode.data = {
          ...node.data,
          handleTextConfigChange,
          saveTextConfig,
          cancelTextConfig,
          openTextConfigPanel,
          updateNodeData,
          tempTextInputConfig,
          textConfigPanelVisibleNodeId,
          variableOptions
        };
      }
      else if (node.type === "buttonNode") {
        updatedNode.data = {
          ...node.data,
          handleButtonConfigChange,
          addButtonItem,
          saveButtonConfig,
          updateNodeData
        };
      }
      else {
        updatedNode.data = {
          ...node.data,
          updateNodeData
        };
      }
      
      return updatedNode;
    });
  
    // Set the nodes and edges
    setNodes(nodesWithHandlers);
    setEdges(templateEdges);
    
    // Reset the node counter to ensure new nodes get unique IDs
    setNodeIdCounter(templateNodes.length + 1);
  };

  const addUserInputToNode = (inputType) => {
    if (!selectedNode || selectedNode === "start") return;
  
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNode) {
          let updatedData = { ...node.data, inputType };
          let updatedNode = { ...node };
  
          if (inputType === "Buttons") {
            updatedNode.type = "buttonNode";
            updatedData = {
              ...updatedData,
              buttonOptions: [{ label: 'Button 1' }, { label: 'Button 2' }],
              handleButtonConfigChange,
              addButtonItem,
              saveButtonConfig,
              updateNodeData,
              id: node.id
            };
            setTempButtonConfig({ buttons: [{ label: 'Button 1' }, { label: 'Button 2' }] });
          } else if (inputType === "Number Input") {
            const nodeId = node.id;
            updatedNode.type = "numberNode";
            updatedData = {
              ...updatedData,
              handleNumberConfigChange,
              saveNumberConfig,
              cancelNumberConfig,
              openNumberConfigPanel,
              updateNodeData,
              tempNumberConfig,
              configPanelVisibleNodeId,
              selectedNode,  
              variableOptions,
              id: nodeId,
              numberInputOptions: updatedData.numberInputOptions || {}
            };
          }else if (inputType === "Text Input") {
            const nodeId = node.id;
            updatedNode.type = "textNode";
            updatedData = {
              ...updatedData,
              handleTextConfigChange,
              saveTextConfig,
              cancelTextConfig,
              openTextConfigPanel,
              updateNodeData,
              tempTextInputConfig,
              textConfigPanelVisibleNodeId,
              variableOptions,
              id: nodeId,
              textInputOptions: updatedData.textInputOptions || {}
            };
          }
          else {
            updatedNode.type = "default";
            if (inputType !== "Number Input") {
              updatedData.numberInputOptions = {};
              setConfigPanelVisibleNodeId(null);
            }
            if (inputType !== "Text Input") {
              updatedData.textInputOptions = {};
              setTextConfigPanelVisibleNodeId(null);
            }
          }
  
          return { ...updatedNode, data: updatedData };
        }
        return node;
      })
    );
    setConfigPanelVisibleNodeId(null);
    setTextConfigPanelVisibleNodeId(null);
  };


  const handleNumberConfigChange = (key, value) => {
    setTempNumberConfig(prevConfig => ({
      ...prevConfig,
      [key]: value,
    }));
  };

  const saveNumberConfig = () => {
    if (selectedNode) {
      setNodes(nds =>
        nds.map(node =>
          node.id === selectedNode ? { ...node, data: { ...node.data, numberInputOptions: tempNumberConfig } } : node
        )
      );
      setConfigPanelVisibleNodeId(null);
    }
  };

  const cancelNumberConfig = () => {
    setConfigPanelVisibleNodeId(null);
    setTempNumberConfig(nodes.find(node => node.id === selectedNode)?.data.numberInputOptions || {});
  };

  const openNumberConfigPanel = (nodeId) => {
    const currentNode = nodes.find(node => node.id === nodeId);
    if (currentNode) {
      setSelectedNode(nodeId);
      setConfigPanelVisibleNodeId(nodeId);
      setTempNumberConfig(currentNode.data.numberInputOptions || {});
    }
  };



  const handleTextConfigChange = (key, value) => {
    setTempTextInputConfig(prevConfig => ({
      ...prevConfig,
      [key]: value,
    }));
  };

  const saveTextConfig = () => {
    if (selectedNode) {
      const placeholderText = tempTextInputConfig.placeholder || "Enter text";
      setNodes(nds =>
        nds.map(node => {
          if (node.id === selectedNode) {
            return {
              ...node,
              data: {
                ...node.data,
                textInputOptions: tempTextInputConfig,
                label: (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "8px" }}>
                    <input
                      type="text"
                      defaultValue={node.data.title}
                      onBlur={(e) => updateNodeData(node.id, "title", e.target.value)}
                      style={{ fontWeight: "bold", border: "none", outline: "none", fontSize: "14px", background: "transparent" }}
                    />
                    <input
                      type="text"
                      defaultValue={node.data.prompt}
                      onBlur={(e) => updateNodeData(node.id, "prompt", e.target.value)}
                      style={{ border: "none", outline: "none", fontSize: "14px", background: "transparent" }}
                    />
                    {/* Corrected conditional rendering - Nest panels correctly */}
                    {node.data.inputType === "Number Input" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                        <div
                          onClick={() => openNumberConfigPanel(node.id)}
                          style={{
                            background: '#f0f0f0',
                            padding: '8px',
                            borderRadius: '4px',
                            textAlign: 'center',
                            fontSize: '14px',
                            cursor: 'pointer',
                          }}
                        >
                          Enter Number
                        </div>
                        {configPanelVisibleNodeId === node.id && ( /* Number Input Config Panel */
                          <div style={{ marginTop: '10px', borderTop: '1px solid #ddd', paddingTop: '10px' }}>
                            {/* Number Input Config Panel - Already Implemented */}
                            <FormControl fullWidth margin="dense" size="small">
                              <TextField
                                label="Minimum"
                                type="number"
                                value={tempNumberConfig.minimum !== undefined ? tempNumberConfig.minimum : ''}
                                onChange={(e) => handleNumberConfigChange('minimum', e.target.value === '' ? undefined : parseInt(e.target.value, 10))}
                              />
                            </FormControl>
                            <FormControl fullWidth margin="dense" size="small">
                              <TextField
                                label="Maximum"
                                type="number"
                                value={tempNumberConfig.maximum !== undefined ? tempNumberConfig.maximum : ''}
                                onChange={(e) => handleNumberConfigChange('maximum', e.target.value === '' ? undefined : parseInt(e.target.value, 10))}
                              />
                            </FormControl>
                            <FormControl fullWidth margin="dense" size="small">
                              <InputLabel id="variable-label">Save to Variable</InputLabel>
                              <Select
                                labelId="variable-label"
                                value={tempNumberConfig.variableName || ''}
                                label="Save to Variable"
                                onChange={(e) => handleNumberConfigChange('variableName', e.target.value)}
                                >
                                <MenuItem value=""><em>None</em></MenuItem>
                                {variableOptions.map((option) => (
                                  <MenuItem key={option} value={option}>{option}</MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                              <Button onClick={cancelNumberConfig} size="small" style={{ marginRight: '10px' }}>Cancel</Button>
                              <Button variant="contained" color="primary" onClick={saveNumberConfig} size="small">Save</Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {node.data.inputType === "Text Input" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                        <div
                          onClick={() => openTextConfigPanel(node.id)}
                          style={{
                            background: '#f0f0f0',
                            padding: '8px',
                            borderRadius: '4px',
                            textAlign: 'center',
                            fontSize: '14px',
                            cursor: 'pointer',
                          }}
                        >
                          {tempTextInputConfig.placeholder || "Enter text"}
                        </div>
                        {textConfigPanelVisibleNodeId === node.id && ( /* Text Input Config Panel */
                          <div style={{ marginTop: '10px', borderTop: '1px solid #ddd', paddingTop: '10px' }}>
                            {/* Text Input Config Panel */}
                            <FormControl fullWidth margin="dense" size="small">
                              <TextField
                                label="Placeholder"
                                value={tempTextInputConfig.placeholder || ''}
                                onChange={(e) => handleTextConfigChange('placeholder', e.target.value)}
                                onBlur={() => saveTextConfig()}
                              />
                            </FormControl>
                            <FormControl fullWidth margin="dense" size="small">
                              <InputLabel id="variable-label-text">Save to Variable</InputLabel>
                              <Select
                                labelId="variable-label-text"
                                value={tempTextInputConfig.variableName || ''}
                                label="Save to Variable"
                                onChange={(e) => handleTextConfigChange('variableName', e.target.value)}
                                >
                                <MenuItem value=""><em>None</em></MenuItem>
                                {variableOptions.map((option) => (
                                  <MenuItem key={option} value={option}>{option}</MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                              <Button onClick={cancelTextConfig} size="small" style={{ marginRight: '10px' }}>Cancel</Button>
                              <Button variant="contained" color="primary" onClick={saveTextConfig} size="small">Save</Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {node.data.inputType === "Buttons" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {tempButtonConfig.buttons.map((button, index) => (
                          <TextField
                            key={index}
                            label={`Button ${index + 1} Text`}
                            value={button.label}
                            onChange={(e) => handleButtonConfigChange(index, 'label', e.target.value)}
                            margin="dense"
                            size="small"
                          />
                        ))}
                        <Button
                          startIcon={<AddIcon />}
                          onClick={addButtonItem}
                          size="small"
                        >
                          Add Button
                        </Button>
                        <Button variant="contained" color="primary" onClick={saveButtonConfig} size="small">Save Buttons</Button>
                      </div>
                    )}
                    
                  </div>
                )
              }
            };
          }
          return node;
        })
      );
      setTextConfigPanelVisibleNodeId(null);
    }
  };

  const cancelTextConfig = () => {
    setTextConfigPanelVisibleNodeId(null);
    setTempTextInputConfig(nodes.find(node => node.id === selectedNode)?.data.textInputOptions || {});
  };

  const openTextConfigPanel = (nodeId) => {
    setTextConfigPanelVisibleNodeId(nodeId);
    setTempTextInputConfig(nodes.find(node => node.id === nodeId)?.data.textInputOptions || {});
  };


  // Button Input Config Panel Handlers
  const handleButtonConfigChange = (index, key, value) => {
    // Update temp state
    setTempButtonConfig(prevConfig => {
      const updatedButtons = [...prevConfig.buttons];
      updatedButtons[index][key] = value;
      return { buttons: updatedButtons };
    });
  
    // Immediately update node data
    setNodes(nds =>
      nds.map(node => {
        if (node.id === selectedNode) {
          const updatedButtonOptions = [...node.data.buttonOptions];
          updatedButtonOptions[index][key] = value;
          return {
            ...node,
            data: {
              ...node.data,
              buttonOptions: updatedButtonOptions
            }
          };
        }
        return node;
      })
    );
  };

  const addButtonItem = () => {
    const newButton = { label: `Button ${tempButtonConfig.buttons.length + 1}` };
    
    // Update temp state
    setTempButtonConfig(prevConfig => ({
      buttons: [...prevConfig.buttons, newButton]
    }));
  
    // Update node data
    setNodes(nds =>
      nds.map(node => {
        if (node.id === selectedNode) {
          return {
            ...node,
            data: {
              ...node.data,
              buttonOptions: [...node.data.buttonOptions, newButton]
            }
          };
        }
        return node;
      })
    );
  };

  const saveButtonConfig = () => {
    if (selectedNode) {
      setNodes(nds =>
        nds.map(node =>
          node.id === selectedNode ? {
            ...node,
            data: {
              ...node.data,
              buttonOptions: tempButtonConfig.buttons
            }
          } : node
        )
      );
    }
  };

  const cancelButtonItem = () => {
    if (selectedNode) {
      setTempButtonConfig({ buttons: nodes.find(node => node.id === selectedNode)?.data.buttonOptions || [] });
    }
  };


  return (
    <div className="h-screen flex flex-col">
    {/* Top Navigation Bar */}
    <div className="h-16 border-b flex items-center justify-between px-4 bg-white">
      {/* <div className="flex items-center space-x-4">
        <Menu className="h-6 w-6 text-gray-600 cursor-pointer" /> */}
        <h1 className="text-xl font-semibold">Kaza Dada</h1>
      {/* </div> */}
      <div className="flex items-center space-x-4">
        <button className="px-12 py-2 bg-[#F58426] text-white rounded-lg flex items-center space-x-2">
          Save as Draft
        </button>
        <button className="px-12 py-2 bg-[#090A29] text-white rounded-lg">
          Publish
        </button>
        <button className="px-12 py-2 border border-[#F58426] text-[#F58426] rounded-lg flex items-center space-x-2">
          <Play className="h-4 w-4" />
        <span>Test</span>
        </button>
      </div>
    </div>

    <div className="flex flex-1 overflow-hidden">
      {/* Left Sidebar */}
      <div className="w-64 border-r bg-white">
        <div className="p-4">
          <div className="space-y-4">
            <h2 className="font-medium text-gray-900">Prompt</h2>
            <button 
              onClick={addNode}
              className="w-full p-3 text-left bg-[#090A29] text-white rounded-lg flex items-center"
            >
              <Flag className="mr-2" /> Text
            </button>
            
            <h2 className="font-medium text-gray-900 pt-4">Input</h2>
            <div className="space-y-2">
              <button 
                onClick={() => addUserInputToNode("Text Input")}
                className="w-full p-3 text-left border border-[#F58426] text-[#F58426] rounded-lg flex items-center space-x-2 hover:bg-gray-50"
              >
                <span>T</span>
                <span>Text</span>
              </button>
              <button 
                onClick={() => addUserInputToNode("Buttons")}
                className="w-full p-3 text-left border border-[#F58426] text-[#F58426] rounded-lg flex items-center space-x-2 hover:bg-gray-50"
              >
                <span>···</span>
                <span>Buttons</span>
              </button>
              <button 
                onClick={() => addUserInputToNode("Number Input")}
                className="w-full p-3 text-left border border-[#F58426] text-[#F58426] rounded-lg flex items-center space-x-2 hover:bg-gray-50"
              >
                <span>#</span>
                <span>Number</span>
              </button>
              <button 
                className="w-full p-3 text-left border border-[#F58426] text-[#F58426] rounded-lg flex items-center space-x-2 hover:bg-gray-50"
              >
                <span>@</span>
                <span>Email</span>
              </button>
            </div>

            <h2 className="font-medium text-gray-900 pt-4">Logic</h2>
            <div className="space-y-2">
              <button 
              onClick={applyTemplate}
              className="w-full p-3 text-left bg-[#F58426] text-white rounded-lg">
                Template
              </button>
              <button className="w-full p-3 text-left bg-[#F58426] text-white rounded-lg">
                Redirect
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 h-full">
      <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          onNodeClick={(_, node) => {
            setSelectedNode(node.id);
            if (node.type !== "numberNode" && node.type !== "textNode") {
              setConfigPanelVisibleNodeId(null);
              setTextConfigPanelVisibleNodeId(null);
            }
          }}
          style={{ height: "100%" }}
        >
          <MiniMap />
          <Controls />
          <Background variant="dots" gap={12} size={1} />
        </ReactFlow>
        </div>
      </div>
      <VariablesPanel onVariableAdd={handleVariableAdd} />
    </div>
  );
}