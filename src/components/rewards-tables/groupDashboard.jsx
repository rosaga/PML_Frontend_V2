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
import NewGroupModal from "../modal/newGroup"
import { getToken } from "@/utils/auth";
import { GetGroups } from "@/app/api/actions/group/group";

const GroupDashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(0); // Pagination state
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  let org_id = null;
  if (typeof window !== 'undefined') {
    org_id = localStorage.getItem('selectedAccountId');
  }
  const [paginationModel, setPaginationModel] = React.useState({
    pageSize: 4,
    page: 1,
  });

  const [isLoaded, setIsLoaded] = useState(false);
  const [contacts, setContacts] = useState([]);

  const getGroups = async () => {
    try {
      const res = await GetGroups(org_id,paginationModel.page, paginationModel.pageSize);
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
  }, [isModalOpen,page, org_id]);


  const columns = [
    { field: "id", headerName: "ID", flex: 1},
    { field: "name", headerName: "Group Name", flex: 1 },
    { field: "contact_count", headerName: "No of Contacts", flex: 1 },
    { field: "description", headerName: "Description", flex: 1 },
    { field: "created_at", headerName: "Date Created", flex: 1,
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

  return (
    <>
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

export default GroupDashboard;
