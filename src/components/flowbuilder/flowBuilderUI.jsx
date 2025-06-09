"use client";
import React, { useEffect, useState, useCallback } from "react";
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
import AddIcon from "@mui/icons-material/Add";
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import VariablesPanel from './variablePanel';
import ButtonNode from './buttonNode';
import NumberNode from './numberNode';
import TextNode from './textNode';
import createTemplateFlow from './templateHandler';
import DefaultNode from './defaultNode';
import { ToastContainer, toast } from 'react-toastify';
import FlowTestPanel from './FlowTestPanel';
import { useRouter } from 'next/navigation';
import DocumentScannerIcon from '@mui/icons-material/DocumentScanner';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import Filter1Icon from '@mui/icons-material/Filter1';
import SortByAlphaIcon from '@mui/icons-material/SortByAlpha';
import OfflineShareIcon from '@mui/icons-material/OfflineShare';

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

export default function FlowBuilderUI({ flowId: propFlowId, flowName: propFlowName, onBack }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [nodeIdCounter, setNodeIdCounter] = useState(1);
  const [selectedNode, setSelectedNode] = useState(null);
  const [tempNumberConfig, setTempNumberConfig] = useState({});
  const [configPanelVisibleNodeId, setConfigPanelVisibleNodeId] = useState(null);
  const [tempTextInputConfig, setTempTextInputConfig] = useState({});
  const [textConfigPanelVisibleNodeId, setTextConfigPanelVisibleNodeId] = useState(null);
  const [tempButtonConfig, setTempButtonConfig] = useState({ 
    buttons: [{ label: 'Button 1' }, { label: 'Button 2' }],
    nodeType: 'route'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'success', 'error', or null
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [flowName, setFlowName] = useState(propFlowName ? decodeURIComponent(propFlowName) : "");
  const router = useRouter();
  const [showVariablePanel, setShowVariablesPanel] = useState(false);

  // Get flowId from props or URL
  const getFlowId = useCallback(() => {
    if (propFlowId) return propFlowId;
    
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      return url.searchParams.get("id");
    }
    return null;
  }, [propFlowId]);
  
  const flowId = getFlowId();

  // Fetch flow details to get the name if not provided
  useEffect(() => {
    const fetchFlowDetails = async () => {
      if (!flowId) return;
      
      // If flowName is already provided via props, no need to fetch
      if (propFlowName) {
        setFlowName(decodeURIComponent(propFlowName));
        return;
      }

      try {
        const apiUrl = `https://flowbot-1048592730476.europe-west4.run.app/api/v2/flows/${flowId}`;
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch flow details');
        }

        const data = await response.json();
        if (data && data.name) {
          setFlowName(data.name);
        }
      } catch (err) {
        console.error('Error fetching flow details:', err);
      }
    };

    fetchFlowDetails();
  }, [flowId, propFlowName]);

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);


  // Handle back button click
  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else {
      // Fallback if onBack prop is not provided
      router.push('/apps/flowbot/flowbuilder');
    }
  };


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
        updateNodeData,
        numberInputOptions: {}, 
        textInputOptions: {}, 
        buttonOptions: [{ label: 'Button 1' }, { label: 'Button 2' }] 
      },
      position: { x: 200 + nodeIdCounter * 100, y: 100 + nodeIdCounter * 100 },
      className: "min-w-[250px]"
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

  // Save the entire flow as a batch
  const saveEntireFlow = async () => {
    if (!flowId) {
      console.error("No flow ID available");
      alert("No flow ID found. Please check the URL parameters.");
      return;
    }

    setIsSaving(true);
    setSaveStatus(null);

    try {
      // Create a topologically sorted list of nodes (starting from nodes connected to start)
      const sortedNodes = createSortedNodeList();
      
      const timestamp = new Date().toISOString();
      
      // Convert nodes to the backend format
      const formattedNodes = sortedNodes.map((node, index) => 
        convertNodeToBackendFormat(node, index, sortedNodes, timestamp)
      );

      // Create the payload
      const payload = {
        flow_id: parseInt(flowId),
        nodes: formattedNodes
      };

      console.log("Saving flow with payload:", payload);
      
      // Send to the backend
      const response = await fetch("https://flowbot-1048592730476.europe-west4.run.app/api/v2/nodes/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save flow: ${response.statusText}`);
      }
      
      const result = await response.json();

      toast.success("Flow saved successfully");
      setSaveStatus('success');
      
      return result;
    } catch (error) {
      console.error("Error saving flow:", error);
      setSaveStatus('error');
      return null;
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  // This function creates a topologically sorted list of nodes starting from the "start" node
  const createSortedNodeList = () => {
    // First, get all the regular nodes from the canvas
    const regularNodes = [];
    const visited = new Set();
    
    // Find direct children of the start node
    const startNodeChildren = edges
      .filter(edge => edge.source === "start")
      .map(edge => nodes.find(node => node.id === edge.target))
      .filter(Boolean);
    
    // For each child of the start node, do a depth-first traversal
    for (const child of startNodeChildren) {
      visitNode(child, visited, regularNodes);
    }
    
    const allNodes = [];
    
    // Add regular nodes first
    regularNodes.forEach(node => {
      allNodes.push(node);
      
      // If this is a route node with buttons, create nodes for each button
      if (node.data.inputType === "Buttons" && node.data.nodeType === 'route' && node.data.buttonOptions?.length > 0) {
        node.data.buttonOptions.forEach((button, btnIndex) => {
          // Create a node for this button option
          const buttonOptionNode = {
            id: `${node.id}-btn-${btnIndex}`,
            // Flag to identify this as a button option node
            isButtonOption: true,
            // Reference to parent node and button index
            parentId: node.id,
            buttonIndex: btnIndex,
            data: {
              title: button.label,
              prompt: `Option: ${button.label}`
            },
            // Position 
            position: {
              x: (node.position?.x || 0) + 200,
              y: (node.position?.y || 0) + (btnIndex * 100)
            }
          };
          
          allNodes.push(buttonOptionNode);
        });
      }
    });
    
    return allNodes;
  };


  // Helper function for depth-first traversal
  const visitNode = (node, visited, result) => {
    if (visited.has(node.id)) return;
    
    visited.add(node.id);
    result.push(node);
    
    // Find all children of this node
    const children = edges
      .filter(edge => {
        // For route nodes, only consider edges with button-specific sourceHandles
        if (node.data.inputType === "Buttons" && node.data.nodeType === 'route') {
          return edge.source === node.id && edge.sourceHandle?.startsWith('button-');
        }
        // For list nodes, look for the list-output handle
        else if (node.data.inputType === "Buttons" && node.data.nodeType === 'list') {
          return edge.source === node.id && edge.sourceHandle === 'list-output';
        }
        // For other node types, regular connections
        else {
          return edge.source === node.id;
        }
      })
      .map(edge => nodes.find(n => n.id === edge.target))
      .filter(Boolean);
    
    for (const child of children) {
      visitNode(child, visited, result);
    }
  };

// Convert nodes to backend format with proper parent relationships
const convertNodeToBackendFormat = (node, index, allNodes, timestamp) => {
  if (node.isButtonOption) {
    // Find the index of the parent node in our list
    const parentIndex = allNodes.findIndex(n => n.id === node.parentId);
    
    return {
      backend_enabled: true,
      exit_enabled: true,
      extra_data: {
        position: node.position,
        isButtonOption: true,
        buttonIndex: node.buttonIndex
      },
      header_text_template: {
        language: "en",
        text: node.data.prompt || ""
      },
      name: node.data.title || "",
      // Button options are TEXT nodes by default
      node_type: "TEXT",
      // Parent index points to the parent route node
      parent_index: parentIndex >= 0 ? parentIndex : 0,
      created_at: timestamp,
      updated_at: timestamp,
      created_by: "",
      updated_by: ""
    };
  }
  
  // For regular nodes, determine parent based on connections
  let parentIndex = null;
  
  // Look for incoming edges to this node
  const incomingEdges = edges.filter(edge => edge.target === node.id);
  
  if (incomingEdges.length > 0) {
    const parentId = incomingEdges[0].source;
    const sourceHandle = incomingEdges[0].sourceHandle;
    
    if (parentId === "start") {
      // Direct child of start node gets parent_index 0
      parentIndex = 0;
    } else {
      // Check if this is connected to a specific button in a route node
      if (sourceHandle?.startsWith('button-')) {
        const parentNode = nodes.find(n => n.id === parentId);
        
        if (parentNode?.data?.inputType === "Buttons" && parentNode?.data?.nodeType === "route") {
          // Get the button index from the handle
          const buttonIndex = parseInt(sourceHandle.split('-')[1]);
          
          // Find the corresponding button option node
          const buttonOptionId = `${parentId}-btn-${buttonIndex}`;
          const buttonOptionIndex = allNodes.findIndex(n => n.id === buttonOptionId);
          
          if (buttonOptionIndex >= 0) {
            // Use the button option node as the parent
            parentIndex = buttonOptionIndex;
          } else {
            // Fallback to the parent node
            parentIndex = allNodes.findIndex(n => n.id === parentId);
          }
        } else {
          // Normal node parent
          parentIndex = allNodes.findIndex(n => n.id === parentId);
        }
      } 
      // Check if this is connected to a list node
      else if (sourceHandle === 'list-output') {
        const parentNode = nodes.find(n => n.id === parentId);
        
        if (parentNode?.data?.inputType === "Buttons" && parentNode?.data?.nodeType === "list") {
          // For list nodes, directly use the parent node index
          parentIndex = allNodes.findIndex(n => n.id === parentId);
        } else {
          // Normal node parent
          parentIndex = allNodes.findIndex(n => n.id === parentId);
        }
      }
      else {
        // Normal node parent
        parentIndex = allNodes.findIndex(n => n.id === parentId);
      }
    }
  } else {
    // If no parent, set to 0 (attached to start)
    parentIndex = 0;
  }
  
  let nodeType = "TEXT"; // Default type
  
  if (node.data.inputType === "Buttons") {
    // Check if this is a route or list type
    nodeType = node.data.nodeType === 'route' ? "ROUTE" : "LIST";
  } else if (node.data.inputType === "Number Input") {
    nodeType = "NUMBER";
  } else if (node.data.inputType === "Text Input") {
    nodeType = "TEXT";
  }
  
  let extraData = {
    position: node.position || node.positionAbsolute
  };
  
  if (nodeType === "ROUTE") {
    extraData = {
      ...extraData,
      buttons: node.data.buttonOptions.map(btn => ({
        text: btn.label
      }))
    };
  } else if (nodeType === "LIST") {
    extraData = {
      ...extraData,
      LIST: node.data.buttonOptions.map(btn => btn.label)
    };
  } else if (nodeType === "NUMBER") {
    extraData = {
      ...extraData,
      min: node.data.numberInputOptions?.minimum,
      max: node.data.numberInputOptions?.maximum,
      variableName: node.data.numberInputOptions?.variableName
    };
  } else if (nodeType === "TEXT") {
    extraData = {
      ...extraData,
      placeholder: node.data.textInputOptions?.placeholder,
      variableName: node.data.textInputOptions?.variableName
    };
  }
  
  return {
    backend_enabled: true,
    exit_enabled: true,
    extra_data: extraData,
    header_text_template: {
      language: "en",
      text: node.data.prompt || ""
    },
    name: node.data.title || "",
    node_type: nodeType,
    parent_index: parentIndex !== null ? parentIndex : 0,
    created_at: timestamp,
    updated_at: timestamp,
    created_by: "",
    updated_by: ""
  };
};

  // Function to publish the flow -- to do
  const publishFlow = async () => {
    if (!flowId) {
      console.error("No flow ID available");
      return;
    }

    setIsSaving(true);
    setSaveStatus(null);

    // to do the publish logic
      
  };

  // Function to test the flow
  const testFlow = () => {
    if (!flowId) {
      console.error("No flow ID available");
      return;
    }
    
    setShowTestPanel(true);
  };
  const closeTestPanel = () => {
    setShowTestPanel(false);
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
  
    setNodes(nodesWithHandlers);
    setEdges(templateEdges);
    
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
              nodeType: 'route', 
              buttonOptions: [
                { label: 'Button 1' }, 
                { label: 'Button 2' }
              ],
              handleButtonConfigChange,
              addButtonItem,
              saveButtonConfig,
              updateNodeData,
              id: node.id
            };
            setTempButtonConfig({ 
              buttons: [
                { label: 'Button 1' }, 
                { label: 'Button 2' }
              ],
              nodeType: 'route'
            });
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
          } else if (inputType === "Text Input") {
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
          } else {
            // Default node handling
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
      setNodes(nds =>
        nds.map(node => {
          if (node.id === selectedNode) {
            return {
              ...node,
              data: {
                ...node.data,
                textInputOptions: tempTextInputConfig
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
  const toggleVariablePanel = () => {
    setShowVariablesPanel(!showVariablePanel);
    if (showTestPanel) {
      setShowTestPanel(false);
    }
  };
  const closeVariablePanel = () => {
    setShowVariablesPanel(false);
  };


  const openTextConfigPanel = (nodeId) => {
    setTextConfigPanelVisibleNodeId(nodeId);
    setTempTextInputConfig(nodes.find(node => node.id === nodeId)?.data.textInputOptions || {});
  };

  // Button Input Config Panel Handlers
  const handleButtonConfigChange = (index, key, value) => {
    setTempButtonConfig(prevConfig => {
      const updatedButtons = [...prevConfig.buttons];
      if (!updatedButtons[index]) {
        updatedButtons[index] = { label: `Button ${index + 1}` };
      }
      updatedButtons[index][key] = value;
      return { ...prevConfig, buttons: updatedButtons };
    });
  
    setNodes(nds =>
      nds.map(node => {
        if (node.id === selectedNode) {
          const updatedButtonOptions = [...node.data.buttonOptions];
          if (!updatedButtonOptions[index]) {
            updatedButtonOptions[index] = { label: `Button ${index + 1}` };
          }
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
      ...prevConfig,
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
              buttonOptions: tempButtonConfig.buttons,
              nodeType: tempButtonConfig.nodeType || 'route'
            }
          } : node
        )
      );
    }
  };


  const cancelButtonItem = () => {
    if (selectedNode) {
      setTempButtonConfig({ 
        buttons: nodes.find(node => node.id === selectedNode)?.data.buttonOptions || [],
        nodeType: nodes.find(node => node.id === selectedNode)?.data.nodeType || 'route'
      });
    }
  };

  // load existing flow nodes
const getFlowNodes = async () => {
  if (!flowId) {
    console.error("No flow ID available");
    return;
  }

  try {
    const response = await fetch(`https://flowbot-1048592730476.europe-west4.run.app/api/v2/flows/${flowId}/linked-nodes`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to load flow nodes: ${response.statusText}`);
    }
    
    const flowData = await response.json();
    console.log("Flow nodes loaded:", flowData);
    
    if (flowData && flowData.nodes && flowData.nodes.length > 0) {
      // Convert backend nodes to our local format
      const { localNodes, localEdges } = convertBackendNodesToLocalFormat(flowData.nodes);
      
      setNodes(localNodes);
      setEdges(localEdges);
      
      // Find the highest numerical part in existing node IDs
      const nodeIds = localNodes
        .filter(n => n.id !== "start")
        .map(n => {
          const match = n.id.match(/node-(\d+)/);
          return match ? parseInt(match[1]) : 0;
        });
      
      const highestId = nodeIds.length > 0 ? Math.max(...nodeIds) : 0;
      setNodeIdCounter(highestId + 1);
      
      toast.success("Flow loaded successfully");
    }
  } catch (error) {
    console.error("Error loading flow nodes:", error);
    toast.error("Failed to load flow");
  }
};

const getNavigate = async () => {
  if (!flowId) {
    console.error("No flow ID available");
    return;
  }
  try {
    const response = await fetch(`https://flowbot-1048592730476.europe-west4.run.app/public/flow/navigate/14`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      }
    });
    if (!response.ok) {
      throw new Error(`Failed to load flow nodes: ${response.statusText}`);
    }
    const navigateData = await response.json();
    console.log("Flow nodes loaded:", navigateData);
  } catch (error) {
    console.error("Error loading Navigation nodes:", error);
    toast.error("Failed to load Navigation");
  }
};


// Convert backend nodes to local ReactFlow format
const convertBackendNodesToLocalFormat = (backendNodes) => {
  const localNodes = [
    {
      id: "start",
      type: "input",
      data: { label: <div style={{ display: 'flex', alignItems: 'center', fontWeight: 'bold' }}> <Flag size={16} /> Start </div> },
      position: { x: 250, y: 5 },
      style: { width: 150, height: 50, background: "#f0f0f0", padding: "10px", borderRadius: "8px", fontWeight: "bold", textAlign: "center" }
    }
  ];
  
  const localEdges = [];
  
  // Step 1: Sort backend nodes by their order/index to maintain proper hierarchy
  const sortedBackendNodes = [...backendNodes].sort((a, b) => {
    // If nodes have an explicit order field, use that
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order;
    }
    return a.id - b.id;
  });
  
  // Step 2: Create a mapping from backend array index to backend node
  const backendIndexToNode = {};
  sortedBackendNodes.forEach((node, index) => {
    backendIndexToNode[index] = node;
  });
  
  // Step 3: Create a mapping from backend node ID to local node ID
  const backendIdToLocalId = {};
  const backendIndexToLocalId = {}; // This will map array indices to local IDs
  
  // Step 4: Create all local nodes (excluding button option nodes)
  let localNodeCounter = 1;
  
  sortedBackendNodes.forEach((backendNode, backendIndex) => {
    // Skip button option nodes - they're not represented as actual nodes in ReactFlow
    if (backendNode.extra_data?.isButtonOption) return;
    
    const localId = `node-${localNodeCounter}`;
    backendIdToLocalId[backendNode.id] = localId;
    backendIndexToLocalId[backendIndex] = localId; 
    localNodeCounter++;
    
    // Determine position from extra_data
    const position = backendNode.extra_data?.position || { 
      x: 250 + localNodeCounter * 150, 
      y: 100 + localNodeCounter * 100 
    };
    
    // Determine node type and configuration
    let nodeType = "default";
    let inputType = null;
    let numberInputOptions = {};
    let textInputOptions = {};
    let buttonOptions = [];
    let buttonNodeType = 'route'; // Default for button nodes
    
    if (backendNode.node_type === "NUMBER") {
      nodeType = "numberNode";
      inputType = "Number Input";
      numberInputOptions = {
        minimum: backendNode.extra_data?.min,
        maximum: backendNode.extra_data?.max,
        variableName: backendNode.extra_data?.variableName
      };
    } else if (backendNode.node_type === "TEXT") {
      nodeType = "textNode";
      inputType = "Text Input";
      textInputOptions = {
        placeholder: backendNode.extra_data?.placeholder || "Enter text",
        variableName: backendNode.extra_data?.variableName
      };
    } else if (backendNode.node_type === "ROUTE") {
      nodeType = "buttonNode";
      inputType = "Buttons";
      buttonNodeType = 'route';
      
      if (backendNode.extra_data?.buttons) {
        buttonOptions = backendNode.extra_data.buttons.map(btn => ({
          label: btn.text || "Button"
        }));
      } else {
        buttonOptions = [{ label: 'Button 1' }, { label: 'Button 2' }];
      }
    } else if (backendNode.node_type === "LIST") {
      nodeType = "buttonNode";
      inputType = "Buttons";
      buttonNodeType = 'list';
      
      if (backendNode.extra_data?.LIST) {
        buttonOptions = backendNode.extra_data.LIST.map(text => ({
          label: text
        }));
      } else {
        buttonOptions = [{ label: 'Item 1' }, { label: 'Item 2' }];
      }
    }
    
    const localNode = {
      id: localId,
      type: nodeType,
      position: position,
      data: {
        id: localId,
        title: backendNode.name || "Click to edit title",
        prompt: backendNode.header_text_template?.text || "Click to edit question/prompt",
        inputType: inputType,
        updateNodeData,
        numberInputOptions,
        textInputOptions,
        buttonOptions,
        nodeType: buttonNodeType
      },
      className: "min-w-[250px]"
    };
    
    // Add node-type specific handlers
    if (nodeType === "numberNode") {
      localNode.data = {
        ...localNode.data,
        handleNumberConfigChange,
        saveNumberConfig,
        cancelNumberConfig,
        openNumberConfigPanel,
        configPanelVisibleNodeId,
        selectedNode,
        variableOptions
      };
    } else if (nodeType === "textNode") {
      localNode.data = {
        ...localNode.data,
        handleTextConfigChange,
        saveTextConfig,
        cancelTextConfig,
        openTextConfigPanel,
        textConfigPanelVisibleNodeId,
        variableOptions
      };
    } else if (nodeType === "buttonNode") {
      localNode.data = {
        ...localNode.data,
        handleButtonConfigChange,
        addButtonItem,
        saveButtonConfig,
        updateNodeData
      };
    }
    
    localNodes.push(localNode);
  });
  
  // Step 5: Create the connections (edges) based on parent_index
  sortedBackendNodes.forEach((backendNode, backendIndex) => {
    // Skip button option nodes
    if (backendNode.extra_data?.isButtonOption) return;
    
    const currentLocalId = backendIndexToLocalId[backendIndex];
    if (!currentLocalId) return;
    
    // Special case: Only the very first node (array index 0) with parent_index 0 connects to start
    if (backendIndex === 0 && backendNode.parent_index === 0) {
      localEdges.push({
        id: `edge-start-${currentLocalId}`,
        source: "start",
        target: currentLocalId
      });
    }
    // All other nodes use parent_index as array index to find their parent
    else if (backendNode.parent_index !== null && backendNode.parent_index !== undefined) {
      const parentBackendNode = sortedBackendNodes[backendNode.parent_index];
      
      if (!parentBackendNode) {
        return;
      }
      
      // Check if parent is a button option node
      if (parentBackendNode.extra_data?.isButtonOption) {
        // Find the actual route node this option belongs to
        const routeNodeIndex = parentBackendNode.parent_index;
        const routeNode = sortedBackendNodes[routeNodeIndex];
        
        if (routeNode) {
          const routeNodeLocalId = backendIndexToLocalId[routeNodeIndex];
          const buttonIndex = parentBackendNode.extra_data.buttonIndex;
          
          if (routeNodeLocalId) {
            localEdges.push({
              id: `edge-${routeNodeLocalId}-btn${buttonIndex}-${currentLocalId}`,
              source: routeNodeLocalId,
              target: currentLocalId,
              sourceHandle: `button-${buttonIndex}`
            });
          }
        }
      }
      // If parent is a regular node
      else {
        const parentLocalId = backendIndexToLocalId[backendNode.parent_index];
        
        if (parentLocalId) {
          // For LIST nodes, connect to the special list-output handle
          if (parentBackendNode.node_type === "LIST") {
            localEdges.push({
              id: `edge-${parentLocalId}-list-${currentLocalId}`,
              source: parentLocalId,
              target: currentLocalId,
              sourceHandle: 'list-output'
            });
          }
          // For regular node connections
          else {
            localEdges.push({
              id: `edge-${parentLocalId}-${currentLocalId}`,
              source: parentLocalId,
              target: currentLocalId
            });
          }
        }
      }
    }
  });
  
  return { localNodes, localEdges };
};

useEffect(() => {
  if (flowId) {
    getFlowNodes();
    // getNavigate();

  }
}, [flowId]);
;
return (
  <div className="h-screen flex flex-col">
    {/* Top Navigation Bar */}
    <div className="h-16 border-b flex items-center justify-between px-4 bg-white">
      <div className="flex items-center">
        <button 
          onClick={handleBackClick}
          className="mr-4 text-gray-600 hover:text-gray-900"
        >
        </button>
        <h1 className="text-xl font-semibold">{flowName || "Flow Builder"}</h1>
      </div>
      <div className="flex items-center space-x-4">
        {saveStatus === 'success' && (
          <span className="text-green-600 mr-2">Successfully saved</span>
        )}
        {saveStatus === 'error' && (
          <span className="text-red-600 mr-2">Error saving</span>
        )}
        <button 
          className={`px-6 py-2 bg-[#F58426] text-white rounded-lg flex items-center space-x-2 ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
          onClick={saveEntireFlow}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save as Draft'}
        </button>
        <button 
          className={`px-6 py-2 bg-[#090A29] text-white rounded-lg ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
          onClick={publishFlow}
          disabled={isSaving}
        >
          {isSaving ? 'Publishing...' : 'Publish'}
        </button>
        <button 
          className="px-6 py-2 border border-[#F58426] bg-[#F58426] text-white rounded-lg flex items-center space-x-1"
          onClick={toggleVariablePanel}
        >
          <span>Variables</span>
        </button>
        {/* Variables Panel - Note this is positioned here before the Test button */}
        <button 
          className="px-6 py-2 border border-[#F58426] text-[#F58426] rounded-lg flex items-center space-x-2"
          onClick={testFlow}
        >
          <PlayArrowIcon fontSize="small" />
          <span>Test</span>
        </button>
      </div>
    </div>

    <div className="flex flex-1 overflow-hidden">
      {/* Left Sidebar */}
      <div className="w-64 border-r bg-white">
        <div className="p-4">
          <div className="space-y-4">
            <h2 className="font-medium text-gray-900">Bots Input</h2>
            <button 
              onClick={addNode} 
              className="w-full p-3 text-left bg-[#090A29] text-white rounded-lg flex items-center"
            >
              <Flag fontSize="small" className="mr-2" /> Text
            </button>
            
            <h2 className="font-medium text-gray-900 pt-4">Users Output</h2>
            <div className="space-y-2">
              <button 
                onClick={() => addUserInputToNode("Text Input")} 
                className="w-full p-3 text-left border border-[#F58426] text-[#F58426] rounded-lg flex items-center space-x-2 hover:bg-gray-50"
                disabled={!selectedNode || selectedNode === "start"}
              >
                <SortByAlphaIcon/>
                <span>Text</span>
              </button>
              <button 
                onClick={() => addUserInputToNode("Buttons")} 
                className="w-full p-3 text-left border border-[#F58426] text-[#F58426] rounded-lg flex items-center space-x-2 hover:bg-gray-50"
                disabled={!selectedNode || selectedNode === "start"}
              >
                <DocumentScannerIcon/>
                <span>Multiple Options</span>
                
              </button>
              <button 
                onClick={() => addUserInputToNode("Number Input")} 
                className="w-full p-3 text-left border border-[#F58426] text-[#F58426] rounded-lg flex items-center space-x-2 hover:bg-gray-50"
                disabled={!selectedNode || selectedNode === "start"}
              >
                <Filter1Icon/>
                <span>Number</span>
              </button>
              <button 
                className="w-full p-3 text-left border border-[#F58426] text-[#F58426] rounded-lg flex items-center space-x-2 hover:bg-gray-50"
                disabled={!selectedNode || selectedNode === "start"}
              >
                <MailOutlineIcon/>
                <span>Email</span>
              </button>
            </div>

            <h2 className="font-medium text-gray-900 pt-4">Logic</h2>
            <div className="space-y-2">
              <button 
                onClick={applyTemplate} 
                className="w-full p-3 text-left bg-[#F58426] text-white rounded-lg">
                <DocumentScannerIcon/>
                <span>Template</span>
              </button>
              <button 
                className="w-full p-3 text-left bg-[#F58426] text-white rounded-lg">
                <OfflineShareIcon/>
                <span>Redirect</span>
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

      {/* Right Side Test Panel when active */}
      {showTestPanel && (
        <FlowTestPanel flowId={flowId} onClose={closeTestPanel} />
      )}
      {showVariablePanel && (
        <VariablesPanel 
          onVariableAdd={handleVariableAdd} 
          onClose={closeVariablePanel}
        />
      )}
    </div>
  </div>
);
}