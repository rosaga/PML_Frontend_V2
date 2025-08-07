import React, { useState, useEffect } from "react";
import { DataGrid, GridRowsProp, GridColDef } from "@mui/x-data-grid";
import IosShareIcon from "@mui/icons-material/IosShare";
import AddIcon from "@mui/icons-material/Add";
import PeakButton from "../button/button";
import PeakSearch from "../search/search";
import RequestUnitsModal from "../modal/requestUnits";
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import axios from "axios";
import { format, parseISO } from "date-fns";
import NewGroupContactModal from "../modal/newGroupContactModal"
import { getToken } from "@/utils/auth";
import { GetGroupDetails } from "@/app/api/actions/group/group";
import { removeContactFromGroup } from "@/app/api/actions/contact/contact";
import { ToastContainer, toast } from "react-toastify";

const GroupContactDetails = ({ groupID, groupName }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingContacts, setDeletingContacts] = useState(new Set());
  const [confirmDelete, setConfirmDelete] = useState(null);
  
  let org_id = null;
  if (typeof window !== 'undefined') {
    org_id = localStorage.getItem('selectedAccountId');
  }

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const openAddModal = () => {
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
  };

  const [paginationModel, setPaginationModel] = React.useState({
    pageSize: 10,
    page: 1,
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const [contacts, setContacts] = useState([]);

  const getDetails = async () => {
    try {
      const res = await GetGroupDetails(org_id, groupID, paginationModel.page, paginationModel.pageSize);
      if (res.errors) {
        console.log("AN ERROR HAS OCCURRED");
      } else {
        setContacts(res.data.data);
        setIsLoaded(true);
        setLoading(false);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleDeleteContact = (contactId, contactMobile) => {
    setConfirmDelete({ contactId, contactMobile });
  };

  const confirmDeleteContact = async () => {
    const { contactId, contactMobile } = confirmDelete;
    setDeletingContacts(prev => new Set([...prev, contactId]));
    setConfirmDelete(null);

    try {
      const response = await removeContactFromGroup(org_id, groupID, contactId);

      if (response.status === 204) {
        toast.success(`Contact ${contactMobile} removed from ${groupName} successfully`);
        
        setContacts(prevContacts => 
          prevContacts.filter(contact => contact.id !== contactId)
        );
      } else if (response.errors) {
        toast.error(response.errors._error || "Failed to remove contact from group");
      }
    } catch (error) {
      console.error("Error removing contact from group:", error);
      toast.error("Failed to remove contact from group. Please try again.");
    } finally {
      setDeletingContacts(prev => {
        const newSet = new Set(prev);
        newSet.delete(contactId);
        return newSet;
      });
    }
  };

  const cancelDelete = () => {
    setConfirmDelete(null);
  };

  useEffect(() => {
    if (groupID) {
      getDetails();
    }
  }, [isModalOpen, isAddModalOpen, page, org_id, groupID, groupName]);

  const filterOptions = [
    { value: "eq__external_id", label: "Transaction Reference" },
    { value: "ilike__first_name", label: "Start Date" },
    { value: "ilike__last_name", label: "End Date" },
    { value: "eq__external_id", label: "Data Bundle" },
    { value: "ilike__first_name", label: "Units" },
    { value: "ilike__last_name", label: "Status" },
  ];

  const columns = [
    { 
      field: "created_at", 
      headerName: "Date of Onboarding", 
      flex: 1, 
      minWidth: 200,
      valueFormatter: (params) => { 
        try {
          const date = parseISO(params);
          return format(date, "yyyy-MM-dd HH:mm");
        } catch (error) {
          return "Invalid Date";
        }
      }, 
    },
    { 
      field: "contact", 
      headerName: "Phone Number", 
      flex: 1, 
      minWidth: 150,
      valueFormatter: (params) => {
        return params.mobile_no;
      },
    },
    {
      field: "status_id",
      headerName: "Status",
      flex: 1,
      minWidth: 150,
      renderCell: (params) => {
        const getColor = (status) => {
          switch (status) {
            case "ACTIVE":
              return "green";
            case "INACTIVE":
              return "grey";
            default:
              return "black";
          }
        };

        return (
          <span style={{ color: getColor(params.value) }}>{params.value}</span>
        );
      },
    },
    {
      field: "action",
      headerName: "Action",
      flex: 0,
      minWidth: 80,
      renderCell: (params) => {
        const isDeleting = deletingContacts.has(params.row.id);
        const mobileNumber = params.row.contact?.mobile_no || params.row.mobile_no || 'Unknown';
        
        return (
          <button
            onClick={() => handleDeleteContact(params.row.id, mobileNumber)}
            disabled={isDeleting}
            className={`p-1 rounded hover:bg-red-50 transition-colors ${
              isDeleting ? 'opacity-50 cursor-not-allowed' : 'hover:text-red-600 cursor-pointer'
            }`}
            title={`Remove ${mobileNumber} from group`}
          >
            {isDeleting ? (
              <div className="w-5 h-5 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
            ) : (
              <DeleteIcon className="text-red-500" />
            )}
          </button>
        );
      },
    },
  ];

  return (
    <>
      {isAddModalOpen && (
        <NewGroupContactModal 
          closeModal={closeAddModal} 
          existingGroupId={groupID}
          groupName={groupName}
        />
      )}
      
      {/* Confirmation Modal */}
      {confirmDelete && (
        <div
          id="confirmation-modal"
          tabIndex={-1}
          className="fixed inset-0 z-50 flex justify-center items-center w-full h-screen bg-black bg-opacity-50"
        >
          <div className="relative p-4 w-full max-w-md max-h-full">
            <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
              <div className="flex items-center justify-between p-4 border-b rounded-t dark:border-gray-600">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Confirm Removal
                </h3>
                <button
                  onClick={cancelDelete}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <div className="p-6 text-center">
                <p className="mb-6 text-gray-900 dark:text-white">
                  Are you sure you want to remove {confirmDelete.contactMobile} from {groupName}?
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={cancelDelete}
                    className="w-full text-white bg-gray-700 hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteContact}
                    className="w-full text-white bg-orange-400 hover:bg-orange-500 focus:ring-4 focus:outline-none focus:ring-orange-300 font-medium rounded-lg text-sm px-5 py-2.5"
                  >
                    Yes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex flex-col md:flex-row items-center justify-between">
        <p className="mt-4 font-medium text-lg">Group Details {groupName && `- ${groupName}`}</p>
        <div className="md:ml-auto flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <PeakSearch filterOptions={filterOptions} selectedFilter="" />
          <PeakButton
            buttonText="Create New Group"
            icon={AddIcon}
            className="bg-[#090A29] text-gray-100 text-sm rounded-[2px] px-2 shadow-sm outline-none"
            onClick={openModal}
          />
          <PeakButton
            buttonText="Add Contact"
            icon={IosShareIcon}
            className="rounded-[2px] border-2 text-sm px-2 py-1 shadow-sm outline-none"
            onClick={openAddModal}
          />
        </div>
      </div>

      <div className="mt-4">
        <div style={{ width: "100%" }}>
          <DataGrid
            rows={contacts}
            columns={columns}
            loading={loading}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            sx={{
              "& .MuiDataGrid-columnHeader": {
                backgroundColor: "#F1F2F3",
              },
              "&.MuiDataGrid-root": {
                border: "none",
              },
            }}
          />
        </div>
      </div>
      
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
};

export default GroupContactDetails;