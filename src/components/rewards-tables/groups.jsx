import React, { useState, useEffect } from "react";
import { DataGrid, GridRowsProp, GridColDef, GridToolbar } from "@mui/x-data-grid";
import IosShareIcon from "@mui/icons-material/IosShare";
import AddIcon from "@mui/icons-material/Add";
import PeakButton from "../button/button";
import PeakSearch from "../search/search";
import RequestUnitsModal from "../modal/requestUnits";
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import axios from "axios";
import { format, parseISO } from "date-fns";
import NewGroupModal from "../modal/newGroup";
import { getToken } from "@/utils/auth";
import { GetGroups } from "@/app/api/actions/group/group";
import  GroupContactDetails  from "./groupDetails";

const GroupsTable = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(0); // Pagination state
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupDetailsOpen, setGroupDetailsOpen] = useState(false);
  const [groupID, setGroupID] = useState(null);
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

  const [paginationModel, setPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  });

  const [isLoaded, setIsLoaded] = useState(false);
  const [contacts, setContacts] = useState([]);

  const getGroups = async () => {
    try {
      const res = await GetGroups(org_id, paginationModel.page, paginationModel.pageSize);
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
    getGroups();
  }, [isModalOpen, paginationModel.page, org_id]);

  const filterOptions = [
    { value: "eq__external_id", label: "Transaction Reference" },
    { value: "ilike__first_name", label: "Start Date" },
    { value: "ilike__last_name", label: "End Date" },
    { value: "eq__external_id", label: "Data Bundle" },
    { value: "ilike__first_name", label: "Units" },
    { value: "ilike__last_name", label: "Status" },
  ];

  const columns = [
    { field: "id", headerName: "ID", flex: 1 },
    { field: "name", headerName: "Group Name", flex: 1 },
    { field: "contact_count", headerName: "No of Contacts", flex: 1 },
    { field: "description", headerName: "Description", flex: 1 },
    {
      field: "created_at",
      headerName: "Date Created",
      flex: 1,
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
      field: "action",
      headerName: "Action",
      flex: 0,
      renderCell: (params) => <DeleteIcon />,
    },
  ];

  const groupDetails = (id) => {

    setGroupDetailsOpen(true);
    setGroupID(id);
    
  };
  return (
    <>
      {isModalOpen && <NewGroupModal closeModal={closeModal} />}
      {groupDetailsOpen ? <GroupContactDetails groupID={groupID} />
      :
      <>
      <div className="flex items-center justify-between">
        <p className="mt-4 font-medium text-lg">All Groups</p>
        <div className="ml-auto flex space-x-4">
          <PeakSearch filterOptions={filterOptions} selectedFilter="" />
          <PeakButton
            buttonText="Create New Group"
            icon={AddIcon}
            className="bg-[#090A29] text-gray-100 text-sm rounded-[2px] px-2 shadow-sm outline-none"
            onClick={openModal}
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
            onRowClick={(params) => groupDetails(params.row.id)}
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
    }
    </>
    
   
  );
};

export default GroupsTable;
