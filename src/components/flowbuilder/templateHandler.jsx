import React from 'react';
import { Flag } from 'lucide-react';

const createTemplateFlow = () => {
  const templateNodes = [
    {
      id: "start",
      type: "input",
      data: { 
        label: <div className="flex items-center font-bold"><Flag size={16} className="mr-2" /> Start</div> 
      },
      position: { x: 250, y: 50 },
      className: "w-36 h-12 bg-gray-100 p-3 rounded-lg font-bold text-center"
    },
    {
      id: "name-input",
      type: "textNode",
      data: {
        id: "name-input",
        title: "Name",
        prompt: "What is your name",
        inputType: "Text Input",
        textInputOptions: {
          placeholder: "Enter text",
          variableName: "name"
        }
      },
      position: { x: 100, y: 180 },
      className: "w-64 min-h-24 bg-white p-3 rounded-lg shadow-md text-sm font-medium"
    },
    {
      id: "age-input",
      type: "numberNode",
      data: {
        id: "age-input",
        title: "Age",
        prompt: "What is your age",
        inputType: "Number Input",
        numberInputOptions: {
          minimum: 0,
          maximum: 120,
          variableName: "age"
        }
      },
      position: { x: 100, y: 420 },
      className: "w-64 min-h-24 bg-white p-3 rounded-lg shadow-md text-sm font-medium"
    },
    {
      id: "fruit-choice",
      type: "buttonNode",
      data: {
        id: "fruit-choice",
        title: "Fruit",
        prompt: "What fruit do you like",
        inputType: "Buttons",
        buttonOptions: [
          { label: "Banana" },
          { label: "Mangoes" }
        ]
      },
      position: { x: 400, y: 180 },
      className: "w-64 min-h-24 bg-white p-3 rounded-lg shadow-md text-sm font-medium"
    },
    {
      id: "end-banana",
      type: "textNode",
      data: {
        id: "end-banana",
        title: "End",
        prompt: "Thank you for participating in banana",
        inputType: "Text Input",
        textInputOptions: {
          placeholder: "Enter text"
        }
      },
      position: { x: 700, y: 180 },
      className: "w-64 min-h-24 bg-white p-3 rounded-lg shadow-md text-sm font-medium"
    },
    {
      id: "end-mango",
      type: "default",
      data: {
        id: "end-mango",
        title: "End",
        prompt: "Thank you for choosing Mango",
        inputType: null
      },
      position: { x: 700, y: 500 },
      className: "w-64 min-h-24 bg-white p-3 rounded-lg shadow-md text-sm font-medium"
    }
  ];

  const templateEdges = [
    {
      id: 'start-to-name',
      source: 'start',
      target: 'name-input',
      type: 'smoothstep'
    },
    {
      id: 'name-to-age',
      source: 'name-input',
      target: 'age-input',
      type: 'smoothstep'
    },
    {
      id: 'age-to-fruit',
      source: 'age-input',
      target: 'fruit-choice',
      type: 'smoothstep'
    },
    {
      id: 'banana-to-end-banana',
      source: 'fruit-choice',
      target: 'end-banana',
      type: 'smoothstep'
    },
    {
      id: 'mango-to-end-mango',
      source: 'fruit-choice',
      target: 'end-mango',
      type: 'smoothstep'
    }
  ];

  return { nodes: templateNodes, edges: templateEdges };
};

export default createTemplateFlow;