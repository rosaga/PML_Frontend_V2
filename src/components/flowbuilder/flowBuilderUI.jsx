import React, { useState, useCallback } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
} from "reactflow";
import Flag from '@mui/icons-material/Flag';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add'; // Import AddIcon

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
    const newNode = {
      id: `node-${nodeIdCounter}`,
      type: "default",
      data: { title: "Click to edit title", prompt: "Click to edit question", inputType: null, numberInputOptions: {}, textInputOptions: {}, buttonOptions: [{ label: 'Button 1' }, { label: 'Button 2' }] },
      position: { x: 200 + nodeIdCounter * 100, y: 100 + nodeIdCounter * 100 },
      style: { width: 250, minHeight: 100, background: "#ffffff", padding: "10px", borderRadius: "8px", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)", fontSize: "14px", fontWeight: "500" }
    };

    setNodes((nds) => [...nds, newNode]);
    setNodeIdCounter((prev) => prev + 1);
  };

  const updateNodeData = (id, key, value) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, [key]: value } } : node
      )
    );
  };

  const addUserInputToNode = (inputType) => {
    if (!selectedNode || selectedNode === "start") return;

    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNode) {
          let updatedData = { ...node.data, inputType };
          if (inputType === "Buttons") {
            updatedData.buttonOptions = [{ label: 'Button 1' }, { label: 'Button 2' }];
            setTempButtonConfig({ buttons: [{ label: 'Button 1' }, { label: 'Button 2' }] });
          } else {
            updatedData.buttonOptions = [];
            setTempButtonConfig({ buttons: [] });
          }
          if (inputType !== "Number Input") {
            updatedData.numberInputOptions = {};
            setConfigPanelVisibleNodeId(null);
          }
          if (inputType !== "Text Input") {
            updatedData.textInputOptions = {};
            setTextConfigPanelVisibleNodeId(null);
          }
          return { ...node, data: updatedData };
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
    setConfigPanelVisibleNodeId(nodeId);
    setTempNumberConfig(nodes.find(node => node.id === nodeId)?.data.numberInputOptions || {});
  };


  // Text Input Config Panel Handlers
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
                    {/* Removed redundant inputType label rendering - handled by "Enter Number", "Enter text", or Buttons section */}
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
    setTempButtonConfig(prevConfig => {
      const updatedButtons = [...prevConfig.buttons];
      updatedButtons[index][key] = value;
      return { buttons: updatedButtons };
    });
  };

  const addButtonItem = () => {
    setTempButtonConfig(prevConfig => ({
      buttons: [...prevConfig.buttons, { label: `Button ${prevConfig.buttons.length + 1}` }]
    }));
  };

  const saveButtonConfig = () => {
    if (selectedNode) {
      setNodes(nds =>
        nds.map(node =>
          node.id === selectedNode ? { ...node, data: { ...node.data, buttonOptions: tempButtonConfig.buttons } } : node
        )
      );
      // No need to close config panel for Buttons as it's inline
    }
  };

  const cancelButtonItem = () => {
    if (selectedNode) {
      setTempButtonConfig({ buttons: nodes.find(node => node.id === selectedNode)?.data.buttonOptions || [] });
    }
  };


  return (
    <div style={{ width: "100vw", height: "100vh", display: "flex", flexDirection: "column" }}>
      <div className="flex flex-col md:flex-row items-center justify-between p-4 bg-[#090A29] text-white">
        <p className="font-medium text-lg">Flow Builder</p>
      </div>

      <div style={{ display: "flex", flex: 1 }}>
        <aside style={{ width: "250px", padding: "16px", background: "#f9f9f9", borderRight: "1px solid #ddd" }}>
          <h3 className=" flex items-center justify-center" style={{ fontWeight: "bold" }}>Prompt</h3>
          <button onClick={addNode} className="w-full bg-[#090A29] text-white p-2 rounded-md mb-2 flex items-center justify-center" ><Flag size={16} className="mr-2" /> Text</button>

          <h4 className=" flex items-center justify-center" style={{ fontWeight: "bold", marginTop: "16px", align: "center" }}>Users Input</h4>
          <button onClick={() => addUserInputToNode("Text Input")} className="w-full border border-orange-500 text-orange-500 p-2 rounded-md mb-2 flex items-center justify-center" style={{ borderColor: "#F58426", color: "#F58426" }}> <span className="mr-2" >✏️</span> Text</button>
          <button onClick={() => addUserInputToNode("Buttons")} className="w-full border border-orange-500 text-orange-500 p-2 rounded-md mb-2 flex items-center justify-center" style={{ borderColor: "#F58426", color: "#F58426" }}> <span className="mr-2">🔘</span> Buttons</button>
          <button onClick={() => addUserInputToNode("Number Input")} className="w-full border border-orange-500 text-orange-500 p-2 rounded-md mb-2 flex items-center justify-center" style={{ borderColor: "#F58426", color: "#F58426" }}> <span className="mr-2" >#️⃣</span> Number</button>
          <button className="w-full border border-orange-500 text-orange-500 p-2 rounded-md mb-2 flex items-center justify-center" style={{ borderColor: "#F58426", color: "#F58426" }}> <span className="mr-2">✉️</span> Email</button>

          <h4 className=" flex items-center justify-center" style={{ fontWeight: "bold", marginTop: "16px" }}>Logic</h4>
          <button className="w-full bg-orange-500 text-white p-2 rounded-md mb-2 flex items-center justify-center" style={{ backgroundColor: "#F58426" }}> <span className="mr-2">🔄</span> Template</button>
          <button className="w-full bg-orange-500 text-white p-2 rounded-md mb-2 flex items-center justify-center" style={{ backgroundColor: "#F58426" }}> <span className="mr-2">🔀</span> Redirect</button>
        </aside>

        <div style={{ flex: 1, height: "100vh", padding: "16px" }}>
          <ReactFlow
            nodes={nodes.map((node) => {
              if (node.id === "start") {
                return node;
              }
              return {
                ...node,
                data: {
                  ...node.data,
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

                      {/* Corrected Conditional Rendering Block */}
                      {node.data.inputType === "Number Input" ? (
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
                          {configPanelVisibleNodeId === node.id && (
                            <div style={{ marginTop: '10px', borderTop: '1px solid #ddd', paddingTop: '10px' }}>
                              {/* Number Input Config Panel */}
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
                      ) : node.data.inputType === "Text Input" ? (
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
                          {textConfigPanelVisibleNodeId === node.id && (
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
                      ) : node.data.inputType === "Buttons" ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                          {/* Buttons Input Section */}
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
                      ) :  null
                      }
                    </div>
                  )
                }
              };
            })}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => {
              setSelectedNode(node.id);
              if (node.data.inputType !== "Number Input" && node.data.inputType !== "Text Input" && node.data.inputType !== "Buttons") { // Extend condition to Buttons
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
    </div>
  );
}