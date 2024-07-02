import React, { useState, useEffect } from "react";
import { DataGrid, GridRowsProp, GridColDef } from "@mui/x-data-grid";
import IosShareIcon from "@mui/icons-material/IosShare";
import AddIcon from "@mui/icons-material/Add";
import PeakButton from "../button/button";
import PeakSearch from "../search/search";
import RequestUnitsModal from "../modal/requestUnits";
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import CampaignDetails from "./campaignDetails";
import axios from "axios";
import { format, parseISO } from "date-fns";
import NewGroupModal from "../modal/newGroup";
import { GetCampaigns } from "@/app/api/actions/campaigns/campaigns";

const RecentCampaigns = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openCampaignDetails, setOpenCampaignDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [total, setTotal] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [campaigns, setCampaigns] = useState([]);

  const childActive = "campaigns";
  let org_id = null;
  if (typeof window !== 'undefined') {
    org_id = localStorage.getItem('selectedAccountId');
  }

  const [paginationModel, setPaginationModel] = useState({
    pageSize: 4,
    page: 0,
  });

  const getCampaigns = async () => {
    try {
      const res = await GetCampaigns(org_id, paginationModel.page + 1, paginationModel.pageSize);
      if (res.errors) {
        console.log("AN ERROR HAS OCCURRED");
      } else {
        setCampaigns(res.data.data);
        setTotal(res.data.count);
        setIsLoaded(true);
        setLoading(false);
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    setLoading(true);
    getCampaigns();
  }, [paginationModel.page, paginationModel.pageSize, isModalOpen, org_id]);

  const columns = [
    { field: "id", headerName: "ID", flex: 1 },
    { field: "name", headerName: "Campaign Name", flex: 1 },
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
      field: "groups",
      headerName: "Group Name",
      flex: 1,
      valueGetter: (params) => {
        return params?.name || "";
      },
    },
    { field: "created_by", headerName: "Owner", flex: 1 },
    { field: "contacts_count", headerName: "Contact Counts", flex: 1 },
    {
      field: "",
      headerName: "Bundle Amount",
      flex: 1,
      valueGetter: (params) => {
        const contactCount = params?.row?.contacts_count || 0;
        const bundleSize = params?.row?.bundle_size || 0;
        return contactCount * bundleSize;
      },
    },
    { field: "bundle_size", headerName: "Data Bundle Type", flex: 1 },
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
            rowCount={total}
            paginationMode="server"
            onRowClick={() => {
              window.location.href = "/apps/data-rewards";
            }}
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
