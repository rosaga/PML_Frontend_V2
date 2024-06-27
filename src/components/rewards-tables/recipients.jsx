import React, { useState, useEffect } from "react";
import { DataGrid, GridRowsProp, GridColDef, GridToolbar } from "@mui/x-data-grid";
import IosShareIcon from "@mui/icons-material/IosShare";
import AddIcon from "@mui/icons-material/Add";
import PeakButton from "../button/button";
import PeakSearch from "../search/search";
import axios from "axios";
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import { format, parseISO } from "date-fns";
import UploadRecipientsModal from "../modal/uploadRecipients";
import NewContactModal from "../modal/newContact"
import { getToken } from "@/utils/auth";
import { GetContacts } from "../../app/api/actions/contact/contact"
import { signIn, signOut, useSession } from 'next-auth/react';


const UploadRecipients = () => {
  let org_id = null;
  if (typeof window !== 'undefined') {
    org_id = localStorage.getItem('selectedAccountId');
  }

  const { data: session, status } = useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalOpen1, setIsModalOpen1] = useState(false);
  const [page, setPage] = useState(0); // Pagination state
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isLoaded, setIsLoaded] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [paginationModel, setPaginationModel] = React.useState({
    pageSize: 10,
    page: 0,
  });

  const getContacts = async () => {
    try {
      const res = await GetContacts(org_id, paginationModel.page, paginationModel.pageSize);
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

  useEffect(() => {
      getContacts();
  }, [isModalOpen1,page, org_id, isModalOpen]);

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
    // { value: "eq__external_id", label: "" },
    { value: "ilike__first_name", label: "Date of Onboarding" },
    { value: "ilike__phone", label: "Phone Number" },
    { value: "ilike_status", label: "Status" },
    // { value: "ilike__first_name", label: "Units" },
    // { value: "ilike__last_name", label: "Status" },
  ];
  const columns = [
    { field: "created_at", headerName: "Date of Onboarding", flex: 1,
    valueFormatter: (params) => {
      try {
        const date = parseISO(params);
        return format(date, "yyyy-MM-dd HH:mm");
      } catch (error) {
        return "Invalid Date";
      }
    },
   },
    { field: "mobile_no", headerName: "Phone Number", flex: 1 },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
      renderCell: (params) => {
        const getColor = (status) => {
          switch (status) {
            case "ACTIVE":
              return "green";
            case "Inactive":
              return "red";
            default:
              return "black"; // Default color if needed
          }
        };

        return (
          <span style={{ color: getColor(params.value) }}>{params.value}</span>
        );
      },
    },
    { field: "Action", headerName: "Action", flex: 0, renderCell: (params) => <DeleteIcon /> },
  ];

  return (
    <>
      {isModalOpen && <UploadRecipientsModal closeModal={closeModal} />}
      {isModalOpen1 && <NewContactModal closeModal={closeModal} />}
      <div className="flex items-center justify-between">
        <p className="mt-4 font-medium text-lg">All Contacts</p>
        <div className="ml-auto flex space-x-4">
          <PeakSearch filterOptions={filterOptions} selectedFilter="" />
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
          {/* <PeakButton
            buttonText="Export"
            icon={IosShareIcon}
            className="rounded-[2px] border-2 text-sm px-2 py-1 shadow-sm outline-none"
            onClick={openModal}
          /> */}
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
            slots={{ toolbar: GridToolbar }}
          />
        </div>
      </div>
    </>
  );
};

export default UploadRecipients;
