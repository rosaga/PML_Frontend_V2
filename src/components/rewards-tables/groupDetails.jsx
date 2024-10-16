import React, { useState, useEffect } from "react";
import { DataGrid, GridRowsProp, GridColDef } from "@mui/x-data-grid";
import IosShareIcon from "@mui/icons-material/IosShare";
import AddIcon from "@mui/icons-material/Add";
import PeakButton from "../button/button";
import PeakSearch from "../search/search";
import RequestUnitsModal from "../modal/requestUnits";
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import axios from "axios";
import { format,parseISO } from "date-fns";
import NewGroupModal from "../modal/newGroup"
import { getToken } from "@/utils/auth";
import { GetGroupDetails } from "@/app/api/actions/group/group";

const GroupContactDetails = ( group_id ) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(0); // Pagination state
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
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
  const [paginationModel, setPaginationModel] = React.useState({
    pageSize: 10,
    page: 1,
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const [contacts, setContacts] = useState([]);

  const getDetails = async () => {
    try {
      const res = await GetGroupDetails(org_id,group_id.groupID,paginationModel.page, paginationModel.pageSize);
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
    getDetails();
  }, [isModalOpen,page, org_id]);

  const filterOptions = [
    { value: "eq__external_id", label: "Transaction Reference" },
    { value: "ilike__first_name", label: "Start Date" },
    { value: "ilike__last_name", label: "End Date" },
    { value: "eq__external_id", label: "Data Bundle" },
    { value: "ilike__first_name", label: "Units" },
    { value: "ilike__last_name", label: "Status" },
  ];

  const columns = [

    // { field: "contact_id", headerName: "ID", flex: 1},
    { field: "created_at", headerName: "Date of Onboarding", flex: 1, minWidth: 200,
    valueFormatter: (params) => { 
      try {
        const date = parseISO(params);
        return format(date, "yyyy-MM-dd HH:mm");
      } catch (error) {
        return "Invalid Date";
      }
    }, },
    { field: "contact", headerName: "Phone Number", flex: 1, minWidth: 150,
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
              return "black"; // Default color if needed
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
      renderCell: (params) => <DeleteIcon />,
    },
  ];

  return (
    <>
      {isModalOpen && <NewGroupModal closeModal={closeModal} />}
      <div className="flex flex-col md:flex-row items-center justify-between">
        <p className="mt-4 font-medium text-lg">All Groups</p>
        <div className="md:ml-auto flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <PeakSearch filterOptions={filterOptions} selectedFilter="" />
          <PeakButton
            buttonText="Create New Group"
            icon={AddIcon}
            className="bg-[#090A29] text-gray-100 text-sm rounded-[2px] px-2 shadow-sm outline-none"
            onClick={openModal}
          />
          <PeakButton
            buttonText="Export"
            icon={IosShareIcon}
            className="rounded-[2px] border-2 text-sm px-2 py-1 shadow-sm outline-none"
            onClick={openModal}
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
    </>
  );
};

export default GroupContactDetails;
