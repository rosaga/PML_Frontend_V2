// MyComponent.js
import React, { useState, useEffect } from "react";
import { DataGrid, GridRowsProp, GridColDef, GridToolbar } from "@mui/x-data-grid";
import Image from "next/image";
import Button from "@mui/material/Button";
import IosShareIcon from "@mui/icons-material/IosShare";
import PeakButton from "../button/button";
import AddIcon from "@mui/icons-material/Add";
import PeakSearch from "../search/search";
import { format,parseISO } from "date-fns";
import axios from "axios";
import RequestUnitsModal from "../modal/requestUnits";
import CreateCampaignModal from "../modal/createCampaign"
import CampaignDetails from "./campaignDetails";
import { getToken } from "@/utils/auth";
import { GetCampaigns } from "@/app/api/actions/campaigns/campaigns";

const CampaignsTable = () => {

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [page, setPage] = useState(0); // Pagination state
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openCampaignDetails, setOpenCampaignDetails] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState(null);
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

  const filterOptions = [
    { value: "eq__external_id", label: "Transaction Reference" },
    { value: "ilike__first_name", label: "Start Date" },
    { value: "ilike__last_name", label: "End Date" },
    { value: "eq__external_id", label: "Data Bundle" },
    { value: "ilike__first_name", label: "Units" },
    { value: "ilike__last_name", label: "Status" },
  ];

  

  const columns= [
    { field: "id", headerName: "ID", flex: 1 },
    { field: "name", headerName: "Campaign Name", flex: 1 },
    { field: "created_at", headerName: "Date Created", flex: 1 ,
    valueFormatter: (params) => { 
      try {
        const date = parseISO(params);
        return format(date, "yyyy-MM-dd HH:mm");
      } catch (error) {
        return "Invalid Date";
      }
    },
  },
    { field: "group_name", headerName: "Group Name", flex: 1 },
    { field: "created_by", headerName: "Owner", flex: 1 },
    { field: "contacts_count", headerName: "Contact Counts", flex: 1 },
    { field: "bundle_amount", headerName: "Bundle Amount", flex: 1 },
    { field: "bundle_size", headerName: "Data Bundle Type", flex: 1 },

  ];
  const [paginationModel, setPaginationModel] = React.useState({
    pageSize: 10,
    page: 0,
  });


  const getCampaigns = async () => {
    try {
      const res = await GetCampaigns(org_id, paginationModel.page, paginationModel.pageSize);
      if (res.errors) {
        console.log("AN ERROR HAS OCCURRED");
      } else {
        setLoading(false);
        setData(res.data.data);
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    getCampaigns();
  }, [page]);

  const handleRowClick = (params) => {
    const { id } = params.row;
    setSelectedCampaign(id);
    setOpenCampaignDetails(true);
  };

  return (
    <>
      {openCampaignDetails && (
        <CampaignDetails
          campaignId={selectedCampaign}
          closeDetails={() => setOpenCampaignDetails(false)}
        />
      )}

      {!openCampaignDetails && (
        <>
          {isModalOpen && <CreateCampaignModal closeModal={closeModal} />}
          <div className="flex items-center justify-between">
            <p className="mt-4 font-medium text-lg">All Campaigns</p>
            <div className="ml-auto flex space-x-4">
              <PeakSearch filterOptions={filterOptions} selectedFilter="" />
              <PeakButton
                buttonText="Schedule Campaign"
                icon={AddIcon}
                className="bg-orange-400 text-gray-100 text-sm rounded-[2px] px-2 shadow-sm outline-none"
                onClick={openModal}
              />
              <PeakButton
                buttonText="Create Campaign"
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
                rows={data}
                columns={columns}
                loading={loading}
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                onRowClick={handleRowClick} // Add this line to handle row click
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
      )}
    </>
  );
};

export default CampaignsTable;
