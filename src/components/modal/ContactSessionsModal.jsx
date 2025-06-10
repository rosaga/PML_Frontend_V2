"use client";
import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { getToken } from "@/utils/auth";
import ResponseDetailsModal from "./responseDetails"; 

const ContactSessionsModal = ({ closeModal, contact }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
  const [totalSessions, setTotalSessions] = useState(0);
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  });

  let org_id = null;
  let token = null;
  if (typeof window !== 'undefined') {
    org_id = localStorage.getItem('selectedAccountId');
    token = getToken();
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (event.target.id === "contact-sessions-modal") {
        closeModal();
      }
    };

    window.addEventListener("click", handleClickOutside);
    return () => {
      window.removeEventListener("click", handleClickOutside);
    };
  }, [closeModal]);

  // Fetch contact sessions when contact or pagination changes
  useEffect(() => {
    if (contact && contact.id) {
      fetchContactSessions(contact.id);
    }
  }, [contact, paginationModel.page, paginationModel.pageSize]);

  const fetchContactSessions = async (contactId) => {
    setLoading(true);
    setError(null);
    
    try {
      const offset = paginationModel.page * paginationModel.pageSize;
      const response = await fetch(
        `https://flowbot-1048592730476.europe-west4.run.app/api/v2/session?eq__contact_id=${contactId}&limit=${paginationModel.pageSize}&offset=${offset}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch contact sessions: ${response.statusText}`);
      }

      const data = await response.json();
      setSessions(data.results || []);
      setTotalSessions(data.count || 0);
    } catch (err) {
      console.error('Error fetching contact sessions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
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

  // Handle session row click
  const handleSessionClick = (session) => {
    // Create flowData object similar to what ResponseDetailsModal expects
    const flowData = {
      id: session.id,
      flow_name: `Flow ${session.flow_id}`,
      created_at: session.created_at,
      updated_at: session.updated_at,
      channel: session.channel,
      msisdn: contact.mobile_no,
      status: session.status,
      variables: {} // Add variables if available
    };
    
    setSelectedSession(flowData);
    setIsResponseModalOpen(true);
  };

  const closeResponseModal = () => {
    setIsResponseModalOpen(false);
    setSelectedSession(null);
  };

  // Pagination handlers
  const handlePageChange = (newPage) => {
    setPaginationModel(prev => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (newPageSize) => {
    setPaginationModel({ page: 0, pageSize: newPageSize });
  };

  // Calculate pagination info
  const totalPages = Math.ceil(totalSessions / paginationModel.pageSize);
  const startIndex = paginationModel.page * paginationModel.pageSize + 1;
  const endIndex = Math.min((paginationModel.page + 1) * paginationModel.pageSize, totalSessions);

  return (
    <>
      {/* Response Details Modal */}
      {isResponseModalOpen && selectedSession && (
        <ResponseDetailsModal 
          closeModal={closeResponseModal} 
          flowData={selectedSession} 
        />
      )}
      
      <div
        id="contact-sessions-modal"
        tabIndex="-1"
        aria-hidden="true"
        className="fixed inset-0 z-40 flex justify-center items-center w-full h-screen bg-black bg-opacity-50"
      >
        <div className="relative p-4 w-full max-w-4xl max-h-full overflow-y-auto">
          <div className="relative bg-white rounded-lg shadow">
            <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t">
              <h3 className="text-xl font-semibold text-gray-900">
                Sessions for {contact?.mobile_no || 'Contact'}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center"
              >
                <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                </svg>
              </button>
            </div>
            
            <div className="p-4 md:p-5">
              {/* Contact Info Section */}
              <div className="mb-6">
                <div className="bg-[#090A29] text-white p-3 mb-4">
                  Contact Information
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">Phone Number:</span> {contact?.mobile_no || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Created By:</span> {contact?.created_by || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span> 
                    <span className={`ml-2 ${contact?.status === 'ACTIVE' ? 'text-green-600' : 'text-red-600'}`}>
                      {contact?.status || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Created At:</span> {contact?.created_at ? formatDate(contact.created_at) : 'N/A'}
                  </div>
                </div>
              </div>

              {/* Sessions Section */}
              <div className="mb-6">
                <div className="bg-[#090A29] text-white p-3 mb-4 flex justify-between items-center">
                  <span>Sessions ({totalSessions})</span>
                  {totalSessions > 0 && (
                    <div className="flex items-center space-x-4">
                      <span className="text-sm">
                        Showing {startIndex}-{endIndex} of {totalSessions}
                      </span>
                      <select
                        value={paginationModel.pageSize}
                        onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                        className="bg-white text-black text-sm px-2 py-1 rounded"
                      >
                        <option value={5}>5 per page</option>
                        <option value={10}>10 per page</option>
                        <option value={20}>20 per page</option>
                        <option value={50}>50 per page</option>
                      </select>
                    </div>
                  )}
                </div>
                
                {loading ? (
                  <div className="flex justify-center items-center py-10">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-400"></div>
                  </div>
                ) : error ? (
                  <div className="p-4 mb-4 text-red-700 bg-red-100 border border-red-200 rounded-md">
                    Error loading sessions: {error}
                  </div>
                ) : totalSessions === 0 ? (
                  <div className="p-4 mb-4 text-gray-700 bg-gray-100 border border-gray-200 rounded-md">
                    No sessions found for this contact.
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-[#090A29] text-white">
                            <th className="border border-gray-300 py-3 px-4 text-left font-medium">Session ID</th>
                            <th className="border border-gray-300 py-3 px-4 text-left font-medium">Flow Name</th>
                            <th className="border border-gray-300 py-3 px-4 text-left font-medium">Channel</th>
                            <th className="border border-gray-300 py-3 px-4 text-left font-medium">Status</th>
                            <th className="border border-gray-300 py-3 px-4 text-left font-medium">Created At</th>
                            <th className="border border-gray-300 py-3 px-4 text-left font-medium">Updated At</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sessions.map((session, index) => (
                            <tr 
                              key={session.id} 
                              className={`cursor-pointer hover:bg-blue-50 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
                              onClick={() => handleSessionClick(session)}
                            >
                              <td className="border border-gray-300 py-3 px-4">{session.id}</td>
                              <td className="border border-gray-300 py-3 px-4">{session.flow?.name}</td>
                              <td className="border border-gray-300 py-3 px-4">{session.flow?.type}</td>
                              <td className="border border-gray-300 py-3 px-4">
                                <span className={`px-2 py-1 rounded text-sm ${
                                  session.flow?.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                  session.flow?.status === 'DRAFT' ? 'bg-blue-100 text-blue-800' :
                                  session.flow?.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {session.flow?.status || 'N/A'}
                                </span>
                              </td>
                              <td className="border border-gray-300 py-3 px-4">
                                {formatDate(session.created_at)}
                              </td>
                              <td className="border border-gray-300 py-3 px-4">
                                {formatDate(session.updated_at)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-4 px-4 py-3 bg-gray-50 border border-gray-300 rounded-md">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handlePageChange(0)}
                            disabled={paginationModel.page === 0}
                            className="px-3 py-1 text-sm bg-white border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                          >
                            First
                          </button>
                          <button
                            onClick={() => handlePageChange(paginationModel.page - 1)}
                            disabled={paginationModel.page === 0}
                            className="px-3 py-1 text-sm bg-white border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                          >
                            Previous
                          </button>
                        </div>

                        <div className="flex items-center space-x-2">
                          {/* Page numbers */}
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i;
                            } else if (paginationModel.page <= 2) {
                              pageNum = i;
                            } else if (paginationModel.page >= totalPages - 3) {
                              pageNum = totalPages - 5 + i;
                            } else {
                              pageNum = paginationModel.page - 2 + i;
                            }

                            return (
                              <button
                                key={pageNum}
                                onClick={() => handlePageChange(pageNum)}
                                className={`px-3 py-1 text-sm border border-gray-300 rounded ${
                                  paginationModel.page === pageNum
                                    ? 'bg-orange-400 text-white'
                                    : 'bg-white hover:bg-gray-100'
                                }`}
                              >
                                {pageNum + 1}
                              </button>
                            );
                          })}
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handlePageChange(paginationModel.page + 1)}
                            disabled={paginationModel.page >= totalPages - 1}
                            className="px-3 py-1 text-sm bg-white border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                          >
                            Next
                          </button>
                          <button
                            onClick={() => handlePageChange(totalPages - 1)}
                            disabled={paginationModel.page >= totalPages - 1}
                            className="px-3 py-1 text-sm bg-white border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                          >
                            Last
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="mt-6">
                <button
                  onClick={closeModal}
                  className="w-full text-white bg-orange-400 hover:bg-orange-500 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactSessionsModal;