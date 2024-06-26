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
import {  GetRecentCampaigns } from "@/app/api/actions/campaigns/campaigns";


const RecentCampaigns = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(0); 
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
  const [campaigns, setCampaigns] = useState([]);

  const getCampaigns = async () => {
    try {
      const res = await GetRecentCampaigns(org_id,paginationModel.page, paginationModel.pageSize);
      if (res.errors) {
        console.log("AN ERROR HAS OCCURRED");
      } else {
        setCampaigns(res.data.data);
        console.log('ppppppp',res.data.data)
        setIsLoaded(true);
        setLoading(false);
      
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
      getCampaigns();
  }, [isModalOpen,page, org_id]);


  const columns = [
    { field: "id", headerName: "ID", flex: 1 },
    { field: "name", headerName: "Campaign Name", flex: 1 },
    { field: "date_created", headerName: "Date Created", flex: 1, valueFormatter: (params) => {
      try {
        const date = parseISO(params);
        return format(date, "yyyy-MM-dd HH:mm");
      } catch (error) {
        return "Invalid Date";
      }
    },
    }, 
    { field: "group_name", headerName: "Group Name", flex: 1 },
    { field: "owner", headerName: "Owner", flex: 1 },
    { field: "contact_counts", headerName: "Contact Counts", flex: 1 },
    { field: "bundle_amount", headerName: "Bundle Amount", flex: 1 },
    { field: "data_bundle_type", headerName: "Data Bundle Type", flex: 1 },
  ];
  

  return (
    <>
      <div className="mt-4">
        <div style={{ width: "100%" }}>
          <DataGrid
            rows={campaigns}
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

export default RecentCampaigns;
