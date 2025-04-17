"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { format } from "date-fns";

const ResponseDetailsModal = ({ closeModal, flowData }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [responseEvents, setResponseEvents] = useState([]);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (event.target.id === "authentication-modal") {
        closeModal();
      }
    };

    window.addEventListener("click", handleClickOutside);
    return () => {
      window.removeEventListener("click", handleClickOutside);
    };
  }, [closeModal]);

  // Fetch response events when flowData changes
  useEffect(() => {
    if (flowData && flowData.id) {
      fetchResponseEvents(flowData.id);
    }
  }, [flowData]);

  const fetchResponseEvents = async (sessionId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `https://flowbot-1048592730476.europe-west4.run.app/api/v2/session/events?eq__session_id=${sessionId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch response events: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Response events:", data);
      setResponseEvents(data.results || []);
    } catch (err) {
      console.error('Error fetching response events:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Process the text to remove CON/END prefixes
  const cleanResponseText = (text) => {
    if (!text) return "N/A";
    
    // Remove CON prefix
    if (text.startsWith("CON ")) {
      return text.substring(4);
    }
    // Remove END prefix
    else if (text.startsWith("END ")) {
      return text.substring(4);
    }
    return text;
  };
  
  // Group events into pairs of app responses and user inputs
  const groupEventsIntoPairs = () => {
    const pairs = [];
    
    // Sort events by creation time and ID to ensure proper order
    const sortedEvents = [...responseEvents].sort((a, b) => {
      if (a.created_at === b.created_at) {
        return a.id - b.id;
      }
      return new Date(a.created_at) - new Date(b.created_at);
    });
    
    // Skip the first event if it's the initial service code/phone number
    let startIndex = 0;
    if (sortedEvents.length > 0 && sortedEvents[0].event_type === "INBOUND") {
      startIndex = 1;
    }
    
    // Now pair OUTBOUND (system message) with the following INBOUND (user response)
    for (let i = startIndex; i < sortedEvents.length; i++) {
      const event = sortedEvents[i];
      
      if (event.event_type === "OUTBOUND") {
        // Create a new pair for each system message
        const currentPair = {
          startTime: event.created_at,
          appResponse: cleanResponseText(event.text),
          status: event.status
        };
        
        // Look ahead to find the user's response (if any)
        if (i + 1 < sortedEvents.length && sortedEvents[i + 1].event_type === "INBOUND") {
          currentPair.userResponse = sortedEvents[i + 1].text;
          i++; // Skip the next event since we've already processed it
        }
        
        pairs.push(currentPair);
      }
    }
    
    return pairs;
  };

  // Format date
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMMM d, yyyy h:mma');
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  // Get the first variable name and value if available
  const getFirstVariable = () => {
    if (flowData && flowData.variables && Object.keys(flowData.variables).length > 0) {
      const key = Object.keys(flowData.variables)[0];
      return { name: key, value: flowData.variables[key] };
    }
    return { name: "N/A", value: "N/A" };
  };  // Calculate session duration
  const calculateDuration = (startDate, endDate) => {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate || Date.now());
      const durationMs = end - start;
      const seconds = Math.floor(durationMs / 1000);
      
      if (seconds < 60) {
        return `${seconds}s`;
      } else {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
      }
    } catch (error) {
      console.error('Error calculating duration:', error);
      return 'N/A';
    }
  };

  // Flow details based on actual flowData
  const flowDetails = {
    name: flowData?.flow_name || "Flow Details",
    details: {
      date: flowData ? formatDate(flowData.created_at) : "N/A",
      serviceCode: flowData?.channel || "N/A",
      phoneNumber: flowData?.msisdn || "N/A",
      variable: getFirstVariable().name,
      variableValue: getFirstVariable().value,
      duration: flowData ? calculateDuration(flowData.created_at, flowData.updated_at) : "N/A",
      status: flowData?.status || "N/A"
    }
  };



  return (
    <div
      id="authentication-modal"
      tabIndex="-1"
      aria-hidden="true"
      className="fixed inset-0 z-50 flex justify-center items-center w-full h-screen bg-black bg-opacity-50"
    >
      <div className="relative p-4 w-full max-w-2xl max-h-full overflow-y-auto">
        <div className="relative bg-white rounded-lg shadow">
          <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t">
            <h3 className="text-xl font-semibold text-gray-900">
              {flowDetails.name}
            </h3>
          </div>
          
          <div className="p-4 md:p-5">
            {/* Flow Details Section */}
            <div className="mb-6">
              <div className="bg-[#090A29] text-white p-3 mb-4">
                Session Details
              </div>
              <table className="w-full">
                <thead>
                  <tr className="bg-[#090A29] text-white">
                    <th className="py-3 px-4 text-left font-medium w-1/3">Item</th>
                    <th className="py-3 px-4 text-left font-medium">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(flowDetails.details).map(([key, value], index) => (
                    <tr key={key} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                      <td className="py-2 px-4 font-medium w-1/3">{key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}</td>
                      <td className="py-2 px-4">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Responses Section */}
            {loading ? (
              <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-400"></div>
              </div>
            ) : error ? (
              <div className="p-4 mb-4 text-red-700 bg-red-100 border border-red-200 rounded-md">
                Error loading response events: {error}
              </div>
            ) : responseEvents.length === 0 ? (
              <div className="p-4 mb-4 text-gray-700 bg-gray-100 border border-gray-200 rounded-md">
                No response events found for this session.
              </div>
            ) : (
              // Group events into pairs (system response + user input)
              groupEventsIntoPairs().map((pair, index) => (
                <div key={index} className="mb-6">
                  <div className="bg-[#090A29] text-white p-3 mb-4">
                    Response {index + 1}
                  </div>
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#090A29] text-white">
                        <th className="py-3 px-4 text-left font-medium w-1/3">Item</th>
                        <th className="py-3 px-4 text-left font-medium">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-gray-50">
                        <td className="py-2 px-4 font-medium w-1/3">Start Time</td>
                        <td className="py-2 px-4">{formatDate(pair.startTime)}</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-4 font-medium w-1/3">App Response</td>
                        <td className="py-2 px-4">{pair.appResponse}</td>
                      </tr>
                      {pair.userResponse && (
                        <tr className="bg-gray-50">
                          <td className="py-2 px-4 font-medium w-1/3">User Response</td>
                          <td className="py-2 px-4">{pair.userResponse}</td>
                        </tr>
                      )}
                      <tr className={pair.userResponse ? '' : 'bg-gray-50'}>
                        <td className="py-2 px-4 font-medium w-1/3">Status</td>
                        <td className="py-2 px-4">{pair.status}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ))
            )}

            {/* Done Button */}
            <div className="mt-6">
              <button
                onClick={closeModal}
                className="w-full text-white bg-orange-400 hover:bg-orange-500 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResponseDetailsModal;