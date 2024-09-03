import React, { useState, useEffect } from "react";
import { DataGrid, GridRowsProp, GridColDef, GridToolbar } from "@mui/x-data-grid";
import IosShareIcon from "@mui/icons-material/IosShare";
import AddIcon from "@mui/icons-material/Add";
import PeakButton from "../button/button";
import PeakSearch from "../search/search";
import axios from "axios";
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import { format, parseISO, set } from "date-fns";
import UploadRecipientsModal from "../modal/uploadRecipients";
import NewContactModal from "../modal/newContact"
import { getToken } from "@/utils/auth";
import { GetContacts } from "../../app/api/actions/contact/contact"
import { ToastContainer, toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
import RecyclingOutlinedIcon from '@mui/icons-material/RecyclingOutlined';
import Tooltip from '@mui/material/Tooltip';



const UploadRecipients = () => {

  let org_id = null;
  let token = null;
  if (typeof window !== 'undefined') {
    org_id = localStorage.getItem('selectedAccountId');
    token = getToken();
  }

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalOpen1, setIsModalOpen1] = useState(false);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [searchParams, setSearchParams] = useState({});

  const [isDeleted, setIsDeleted] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [paginationModel, setPaginationModel] = React.useState({
    pageSize: 10,
    page: 0,
  });

  const getContacts = async () => {
    try {
      const res = await GetContacts(org_id, paginationModel.page+1, paginationModel.pageSize, searchParams);
      if (res.errors) {
        console.log("AN ERROR HAS OCCURRED");
      } else {
        setTotal(res.data.count);
        setContacts(res.data.data);
        setLoading(false);
      
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
      getContacts();
  }, [isModalOpen1,paginationModel.page, paginationModel.pageSize, org_id, isModalOpen, isDeleted, searchParams]);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const openModal1 = () => {
    setIsModalOpen1(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsModalOpen1(false);
  };


  const filterOptions = [
    { value: "ilike__created_by", label: "Created By" },
    { value: "ilike__mobile_no", label: "Phone Number" },
  ];

  const handleSearch = (filter, value) => {
    setSearchParams({ [filter]: value });
  };

  const handleClearSearch = () => {
    setSearchParams({});
  };

  const deleteContact = async (id) => {
    
    const deleteUrl = `https://peakdata-jja4kcvvdq-ez.a.run.app/api/v2/organization/${org_id}/contact/${id}`
    try {
      const response = await axios.delete(deleteUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
  
      if (response.status === 204) {
        setIsDeleted(true);
        toast.success("DELETE SUCCESSUL!!!");
      } else {
        toast.error("DELETE FAILED");
      }
    } catch (error) {
      console.log(error)
      toast.error("DELETE FAILED");

    }
  };

  const columns = [    
   { field: "id", headerName: "ID", flex: 1 },
    { field: "mobile_no", headerName: "Phone Number", flex: 1 },
    { field: "created_by", headerName: "Created By", flex: 1 },
    { field: "created_at", headerName: "Created At", flex: 1,
    valueFormatter: (params) => {
      try {
        const date = parseISO(params);
        return format(date, "yyyy-MM-dd HH:mm");
      } catch (error) {
        return "Invalid Date";
      }
    }, },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
      renderCell: (params) => {
        const getColor = (status) => {
          switch (status) {
            case "ACTIVE":
              return "green";
            case "DEACTIVE":
              return "red";
            default:
              return "black"; // Default color if needed
          }
        };
        const getName = (status) => {
          switch (status) {
            case "ACTIVE":
              return "ACTIVE";
            case "DEACTIVE":
              return "DEACTIVATED";
            default:
              return "black"; // Default color if needed
          }
        };


        return (
          <span style={{ color: getColor(params.value) }}>{getName(params.value)}</span>
        );
      },
    },
    {
      field: "Action",
      headerName: "Action",
      flex: 0.5,
      renderCell: (params) => {
        const handleDelete = () => {
          deleteContact(params.id);
        };
        const handleReactivate = () => {
          //have code for reactivate here
        }
  
        return (
          <>
            {params.row.status === "ACTIVE" ? (
              <Tooltip title="Deactivate">
                <DeleteIcon
                  style={{ cursor: 'pointer', color: 'red' }}
                  onClick={handleDelete}
                />
              </Tooltip>
            ) : (
              <Tooltip title="ReActivate">
                <RecyclingOutlinedIcon 
                  style={{ cursor: 'pointer', color: 'red' }}
                />
              </Tooltip>
            )}
          </>
        );
      },
    },
  ];

  return (
    <>
      <ToastContainer />
      {isModalOpen && <UploadRecipientsModal closeModal={closeModal} />}
      {isModalOpen1 && <NewContactModal closeModal={closeModal} />}
      <div className="flex flex-col md:flex-row items-center justify-between">
        <p className="mt-4 font-medium text-lg">All Contacts</p>
        <div className="md:ml-auto flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <PeakSearch
            filterOptions={filterOptions}
            selectedFilter=""
            onSearch={handleSearch}
            onClearSearch={handleClearSearch}
          />
          <PeakButton
            buttonText="Upload CSV File"
            icon={IosShareIcon}
            className="bg-[#E88A17] text-gray-100 text-sm rounded-[2px] px-2 shadow-sm outline-none"
            onClick={openModal}
          />
          <PeakButton
            buttonText="New Contact"
            icon={AddIcon}
            className="bg-[#090A29] text-gray-100 text-sm rounded-[2px] px-2 shadow-sm outline-none"
            onClick={openModal1}
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
            rowCount={total}
            paginationMode="server"
            sx={{
              "& .MuiDataGrid-columnHeader": {
                backgroundColor: "#F1F2F3",
              },
              "&.MuiDataGrid-root": {
                border: "none",
              },
            }}
            slots={{ toolbar: GridToolbar }}
          />
        </div>
      </div>
    </>
  );
};
export default UploadRecipients;
