// pages/api-docs.js
"use client";
import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function APIDocs() {
  const [selectedEndpoint, setSelectedEndpoint] = useState(null);
  const [requestBody, setRequestBody] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authToken, setAuthToken] = useState('');
  const [manualToken, setManualToken] = useState('');
  const [orgId, setOrgId] = useState('58045135-f272-4879-be0f-2559d836fdba');
  
  // Define your base URL
  const baseUrl = 'https://peakdata-1048592730476.europe-west4.run.app';

  // Sample API endpoints data - replace with your actual endpoints
  const apiEndpoints = [
    {
      id: 'login',
      method: 'POST',
      path: '{{base_url}}/public/login',
      description: 'Authenticate user and receive access token',
      parameters: [
        { name: 'username', type: 'string', required: true, description: 'User email address' },
        { name: 'password', type: 'string', required: true, description: 'User password' }
      ],
      exampleBody: `{
  "username": "siderravictor@gmail.com",
  "password": "Test@1234"
}`
    },
    {
      id: 'reward',
      method: 'POST',
      path: '{{base_url}}/api/v2/organization/{{org_id}}/airtime',
      description: 'Send reward to customer (requires authentication token)',
      requiresAuth: true,
      parameters: [
        { name: 'airtime_amount', type: 'string', required: true, description: 'Amount to send' },
        { name: 'msisdn', type: 'string', required: true, description: 'Customer phone number' },
        { name: 'request_id', type: 'string', required: true, description: 'Unique request identifier' }
      ],
      exampleBody: `{
      "airtime_amount": "20",
      "msisdn": "254711438911",
      "request_id": "ccfe95d2-1eca-476d-90a1-099eb2fe1a89"
    }`
    },
    {
      id: 'accounts',
      method: 'GET',
      path: '{{base_url}}/api/v2/organization',
      description: 'Retrieve a list of the organizations accounts',
      requiresAuth: true,
      parameters: [
        { name: 'limit', type: 'number', required: false, description: 'Number of accounts to return' },
        { name: 'offset', type: 'number', required: false, description: 'Number of accounts to skip' }
      ]
    },
    // {
    //   id: 'user-create',
    //   method: 'POST',
    //   path: '{{base_url}}/api/users',
    //   description: 'Create a new user',
    //   parameters: [
    //     { name: 'name', type: 'string', required: true, description: 'User name' },
    //     { name: 'email', type: 'string', required: true, description: 'User email' }
    //   ]
    // },
    // {
    //   id: 'user',
    //   method: 'GET',
    //   path: '{{base_url}}/api/users/[id]',
    //   description: 'Retrieve a specific user',
    //   parameters: [
    //     { name: 'id', type: 'string', required: true, description: 'User ID' }
    //   ]
    // }
  ];

  // Update request body when endpoint changes
  useEffect(() => {
    if (selectedEndpoint?.exampleBody) {
      setRequestBody(selectedEndpoint.exampleBody);
    } else if (selectedEndpoint?.method === 'GET') {
      setRequestBody('');
    } else {
      setRequestBody('{}');
    }
  }, [selectedEndpoint]);

  // Function to replace placeholders with actual values
  const resolvePath = (path) => {
    return path
      .replace('{{base_url}}', baseUrl)
      .replace('{{org_id}}', orgId);
  };

  // Function to display path without base URL for UI
  const displayPath = (path) => {
    return path
      .replace('{{base_url}}', '')
      .replace('{{org_id}}', '{org_id}');
  };

  const executeRequest = async () => {
    if (!selectedEndpoint) return;
    
    setLoading(true);
    try {
      const options = {
        method: selectedEndpoint.method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      // Add Authorization header if endpoint requires auth and we have a token
      if (selectedEndpoint.requiresAuth) {
        // Use manual token if provided, otherwise use the one from login
        const tokenToUse = manualToken || authToken;
        if (tokenToUse) {
          options.headers['Authorization'] = `Bearer ${tokenToUse}`;
        } else {
          setResponse({
            status: 'Error',
            statusText: 'Authentication required but no token available',
            data: null
          });
          setLoading(false);
          return;
        }
      }

      if (selectedEndpoint.method !== 'GET' && requestBody) {
        options.body = requestBody;
      }

      // Resolve the path with the actual base URL and org ID
      const url = resolvePath(selectedEndpoint.path);
      
      const res = await fetch(url, options);
      const data = await res.json();
      
      setResponse({
        status: res.status,
        statusText: res.statusText,
        data: JSON.stringify(data, null, 2)
      });

      // If this is the login endpoint and we got an access_token, save it
      if (selectedEndpoint.id === 'login' && data.access_token) {
        setAuthToken(data.access_token);
      }
    } catch (error) {
      setResponse({
        status: 'Error',
        statusText: error.message,
        data: null
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      // You could add a toast notification here
      alert('Copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  };

  const setExampleBody = () => {
    if (selectedEndpoint.exampleBody) {
      setRequestBody(selectedEndpoint.exampleBody);
    }
  };

  return (
    <div className="p-4 lg:ml-64 h-screen ">
      <div className="flex flex-col h-full">
        <div className="flex flex-col">
          <div className="p-4">
      <Head>
        <title>API Documentation | Your App</title>
        <meta name="description" content="Interactive API documentation and testing playground" />
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Airtime API Documentation</h1>
          <p className="text-lg text-gray-600">
            Explore and test our API endpoints directly from your browser
          </p>
          <div className="mt-2 text-sm text-gray-500">
            Base URL: <code className="px-2 py-1 bg-gray-100 rounded">{baseUrl}</code>
          </div>
        </div>

        {/* Configuration Section */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="org-id" className="block text-sm font-medium text-gray-700 mb-1">
                Organization ID
              </label>
              <input
                id="org-id"
                type="text"
                value={orgId}
                onChange={(e) => setOrgId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="manual-token" className="block text-sm font-medium text-gray-700 mb-1">
                Manual Token (optional)
              </label>
              <input
                id="manual-token"
                type="text"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="Paste access_token here if not using login"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Auth Token Display */}
        {(authToken || manualToken) && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium text-blue-800">Authentication Token</h3>
                <p className="text-sm text-blue-600 mt-1">
                  {selectedEndpoint?.requiresAuth ? "This token will be automatically included in the Authorization header" : "Your access token is available for use"}
                  {manualToken && " (using manual token)"}
                  {!manualToken && authToken && " (using token from login)"}
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(manualToken || authToken)}
                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Copy Token
              </button>
            </div>
            <div className="mt-2 p-2 bg-blue-100 rounded overflow-x-auto">
              <code className="text-sm text-blue-800 break-all">{manualToken || authToken}</code>
            </div>
          </div>
        )}

        {/* Warning for endpoints requiring auth */}
        {selectedEndpoint?.requiresAuth && !authToken && !manualToken && (
          <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Authentication Required</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>This endpoint requires an authentication token. Please:</p>
                  <ol className="list-decimal list-inside mt-1 ml-2">
                    <li>Authenticate using the login endpoint, or</li>
                    <li>Paste an access_token manually in the configuration section above</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar with endpoints list */}
          <div className="w-full lg:w-1/3">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Endpoints</h2>
              <div className="space-y-2">
                {apiEndpoints.map(endpoint => (
                  <button
                    key={endpoint.id}
                    onClick={() => setSelectedEndpoint(endpoint)}
                    className={`w-full text-left p-3 rounded-md transition-colors ${
                      selectedEndpoint?.id === endpoint.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        endpoint.method === 'GET' 
                          ? 'bg-green-100 text-green-800'
                          : endpoint.method === 'POST'
                          ? 'bg-yellow-100 text-yellow-800'
                          : endpoint.method === 'PUT'
                          ? 'bg-blue-100 text-blue-800'
                          : endpoint.method === 'DELETE'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {endpoint.method}
                      </span>
                      <span className="ml-2 font-medium break-all">{displayPath(endpoint.path)}</span>
                      {endpoint.requiresAuth && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                          Auth
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{endpoint.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main content area */}
          <div className="w-full lg:w-2/3">
            {selectedEndpoint ? (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center flex-wrap">
                    <span className={`inline-flex items-center px-3 py-1 rounded text-sm font-medium ${
                      selectedEndpoint.method === 'GET' 
                        ? 'bg-green-100 text-green-800'
                        : selectedEndpoint.method === 'POST'
                        ? 'bg-yellow-100 text-yellow-800'
                        : selectedEndpoint.method === 'PUT'
                        ? 'bg-blue-100 text-blue-800'
                        : selectedEndpoint.method === 'DELETE'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedEndpoint.method}
                    </span>
                    <span className="ml-3 font-mono text-lg text-gray-800 break-all">
                      {displayPath(selectedEndpoint.path)}
                    </span>
                    {selectedEndpoint.requiresAuth && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                        Requires Authentication
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-gray-600">{selectedEndpoint.description}</p>
                  
                  {selectedEndpoint.parameters && selectedEndpoint.parameters.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Parameters</h3>
                      <div className="bg-gray-50 rounded-md overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Required</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {selectedEndpoint.parameters.map((param, index) => (
                              <tr key={index}>
                                <td className="px-4 py-2 text-sm font-medium text-gray-900">{param.name}</td>
                                <td className="px-4 py-2 text-sm text-gray-500">{param.type}</td>
                                <td className="px-4 py-2 text-sm text-gray-500">{param.required ? 'Yes' : 'No'}</td>
                                <td className="px-4 py-2 text-sm text-gray-500">{param.description}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* cURL Example */}
                  {selectedEndpoint.id === 'login' && (
                    <div className="mt-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">cURL Example</h3>
                      <div className="bg-gray-800 rounded-md overflow-hidden">
                        <div className="flex justify-between items-center px-4 py-2 bg-gray-900 text-white text-sm font-medium">
                          <span>Terminal command</span>
                          <button 
                            onClick={() => copyToClipboard(`curl --location --request POST '${resolvePath(selectedEndpoint.path)}' \\\n--header 'Content-Type: application/json' \\\n--data-raw '{\n  "username":"siderravictor@gmail.com",\n  "password":"Test@1234"\n}'`)}
                            className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded"
                          >
                            Copy
                          </button>
                        </div>
                        <pre className="p-4 text-green-400 bg-gray-800 overflow-auto text-sm">
{`curl --location --request POST '${resolvePath(selectedEndpoint.path)}' \\
--header 'Content-Type: application/json' \\
--data-raw '{
  "username":"siderravictor@gmail.com",
  "password":"Test@1234"
}'`}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* cURL Example for reward endpoint */}
                  {selectedEndpoint.id === 'reward' && (
                    <div className="mt-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">cURL Example</h3>
                      <div className="bg-gray-800 rounded-md overflow-hidden">
                        <div className="flex justify-between items-center px-4 py-2 bg-gray-900 text-white text-sm font-medium">
                          <span>Terminal command</span>
                          <button 
                            onClick={() => copyToClipboard(`curl --location --request POST '${resolvePath(selectedEndpoint.path)}' \\\n--header 'Authorization: Bearer ${manualToken || authToken || 'YOUR_ACCESS_TOKEN_HERE'}' \\\n--header 'Content-Type: application/json' \\\n--data-raw '{\n  "airtime_amount": "20",\n  "msisdn": "254711438911",\n  "request_id": "ccfe95d2-1eca-476d-90a1-099eb2fe1a89"\n}'`)}
                            className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded"
                          >
                            Copy
                          </button>
                        </div>
                        <pre className="p-4 text-green-400 bg-gray-800 overflow-auto text-sm">
{`curl --location --request POST '${resolvePath(selectedEndpoint.path)}' \\
--header 'Authorization: Bearer ${manualToken || authToken || 'YOUR_ACCESS_TOKEN_HERE'}' \\
--header 'Content-Type: application.json' \\
--data-raw '{
  "airtime_amount": "20",
  "msisdn": "25471114389111",
  "request_id": "ccfe95d2-1eca-476d-90a1-099eb2fe1a89"
}'`}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>

                {/* Request/Response section */}
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Try it out</h3>
                  
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <label htmlFor="request-body" className="block text-sm font-medium text-gray-700">
                        Request Body (JSON)
                      </label>
                      {selectedEndpoint.exampleBody && (
                        <button
                          onClick={setExampleBody}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Reset to Example
                        </button>
                      )}
                    </div>
                    <textarea
                      id="request-body"
                      rows={6}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                      placeholder={selectedEndpoint.method === 'GET' ? 'GET requests do not typically have a body' : '{"key": "value"}'}
                      value={requestBody}
                      onChange={(e) => setRequestBody(e.target.value)}
                      disabled={selectedEndpoint.method === 'GET'}
                    />
                  </div>

                  <button
                    onClick={executeRequest}
                    disabled={loading || (selectedEndpoint.requiresAuth && !authToken && !manualToken)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </>
                    ) : (selectedEndpoint.requiresAuth && !authToken && !manualToken) ? 'Authentication Required' : 'Execute Request'}
                  </button>

                  {response && (
                    <div className="mt-8">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-md font-medium text-gray-900">Response</h4>
                        <button 
                          onClick={() => copyToClipboard(response.data)}
                          className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded"
                        >
                          Copy Response
                        </button>
                      </div>
                      <div className="bg-gray-800 rounded-md overflow-hidden">
                        <div className="px-4 py-2 bg-gray-900 text-white text-sm font-medium">
                          Status: {response.status} {response.statusText}
                        </div>
                        <pre className="p-4 text-green-400 bg-gray-800 overflow-auto text-sm">
                          {response.data || 'No response data'}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">Select an endpoint</h3>
                <p className="mt-2 text-gray-500">Choose an API endpoint from the sidebar to explore its documentation and test it out.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </div>
      </div>
    </div>
  );
}