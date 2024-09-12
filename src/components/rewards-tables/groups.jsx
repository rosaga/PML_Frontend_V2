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
import { ToastContainer, toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";

const GroupsTable = () => {

  let org_id = null;
  let token = null;
  if (typeof window !== 'undefined') {
    org_id = localStorage.getItem('selectedAccountId');
    token = getToken();
  }

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupDetailsOpen, setGroupDetailsOpen] = useState(false);
  const [groupID, setGroupID] = useState(null);
  const [isDeleted, setIsDeleted] = useState(false);
  const [total, setTotal] = useState(0);
  const [searchParams, setSearchParams] = useState({});

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
      const res = await GetGroups(org_id, paginationModel.page+1, paginationModel.pageSize, searchParams);
      if (res.errors) {
        console.log("AN ERROR HAS OCCURRED");
      } else {
        setContacts(res.data.data);
        setTotal(res.data.count);
        setIsLoaded(true);
        setLoading(false);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const deleteGroup = async (id) => {
    
    const deleteUrl = `https://peakdata-jja4kcvvdq-ez.a.run.app/api/v2/organization/${org_id}/group/${id}`
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

  useEffect(() => {
    getGroups();
  }, [isModalOpen, paginationModel.page,paginationModel.pageSize, org_id, isDeleted, searchParams]);

  const filterOptions = [
    { value: "ilike__name", label: "Name" },
    { value: "ilike__description", label: "Description" },
  ];

  const handleSearch = (filter, value) => {
    setSearchParams({ [filter]: value });
  };

  const handleClearSearch = () => {
    setSearchParams({});
  };


  const columns = [
    { field: "id", headerName: "ID", flex: 1, minWidth: 100 },
    { field: "name", headerName: "Group Name", flex: 1, minWidth: 200 },
    { field: "contact_count", headerName: "No of Contacts", flex: 1, minWidth: 150 },
    { field: "description", headerName: "Description", flex: 1, minWidth: 200 },
    {
      field: "created_at",
      headerName: "Date Created",
      flex: 1,
      minWidth: 150,
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
      field: "Action",
      headerName: "Action",
      flex: 0.5,
      minWidth: 100,
      renderCell: (params) => {
        const handleDelete = () => {
          deleteGroup(params.id);
        };
  
        return (
          <DeleteIcon
            style={{ cursor: 'pointer', color: 'red' }}
            onClick={handleDelete}
          />
        );
      },
    },
  ];

  const groupDetails = (id) => {

    setGroupDetailsOpen(true);
    setGroupID(id);
    
  };
  return (
    <>
    <ToastContainer />
      {isModalOpen && <NewGroupModal closeModal={closeModal} />}
      {groupDetailsOpen ? <GroupContactDetails groupID={groupID} />
      :
      <>
      <div className="flex flex-col md:flex-row items-center justify-between">
        <p className="mt-4 font-medium text-lg">All Groups</p>
        <div className="md:ml-auto flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
        <PeakSearch filterOptions={filterOptions} selectedFilter="" onSearch={handleSearch} onClearSearch={handleClearSearch}/>
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
    }
    </>
    
   
  );
};

export default GroupsTable;
