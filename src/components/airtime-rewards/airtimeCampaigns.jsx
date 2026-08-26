import React, { useEffect, useState } from "react";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import PeakButton from "../button/button";
import PeakSearch from "../search/search";
import { format, parseISO } from "date-fns";
import CreateAirtimeCampaignModal from "../modal/createAirtimeCampaign";
import { GetAirtimeCampaigns } from "@/app/api/actions/campaigns/campaigns";

const AirtimeCampaignsTable = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useState({});

  const filterOptions = [
    { value: "ilike__name", label: "Name" },
    { value: "ilike__created_by", label: "Created By" },
    { value: "eq__airtime_amount", label: "Airtime Amt (KES)" },
  ];

  const handleSearch = (filter, value) => {
    setSearchParams({ [filter]: value });
  };

  const handleClearSearch = () => {
    setSearchParams({});
  };

  const [paginationModel, setPaginationModel] = React.useState({
    pageSize: 10,
    page: 0,
  });

  // Get org_id
  let org_id = null;
  if (typeof window !== "undefined") {
    org_id = localStorage.getItem("selectedAccountId");
  }

  const columns = [
    { field: "id", headerName: "ID", flex: 0.6, minWidth: 90 },
    { field: "name", headerName: "Campaign Name", flex: 1.2, minWidth: 220 },
    {
      field: "group",
      headerName: "Group Name",
      flex: 1,
      minWidth: 200,
      valueGetter: (params) => {
        return params?.name;
      },
    },
    {
      field: "created_at",
      headerName: "Date Created",
      flex: 1,
      minWidth: 170,
      valueFormatter: (params) => {
        try {
          const date = parseISO(params);
          return format(date, "yyyy-MM-dd HH:mm");
        } catch (error) {
          return "Invalid Date";
        }
      },
    },
    { field: "created_by", headerName: "Created By", flex: 1, minWidth: 250 },
    { field: "contacts_count", headerName: "Contact Counts", flex: 1, minWidth: 150 },
    {
      field: "airtime_amount",
      headerName: "Airtime Amount (KES)",
      flex: 1,
      minWidth: 180,
    },
  ];

  // Fetch campaigns
  const getAirtimeCampaigns = async () => {
    try {
      const res = await GetAirtimeCampaigns(
        org_id,
        paginationModel.page + 1,
        paginationModel.pageSize,
        searchParams
      );
      if (res.errors) {
        console.log("AN ERROR HAS OCCURRED");
      } else {
        setLoading(false);
        setData(res.data.data);
        setTotal(res.data.count);
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    getAirtimeCampaigns();
  }, [org_id, paginationModel.page, paginationModel.pageSize, isModalOpen, searchParams]);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <>
      {isModalOpen && <CreateAirtimeCampaignModal closeModal={closeModal} />}

      <div className="flex flex-col md:flex-row items-center justify-between">
        <p className="mt-4 font-medium text-lg">All Airtime Campaigns</p>
        <div className="md:ml-auto flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <PeakSearch
            filterOptions={filterOptions}
            selectedFilter=""
            onSearch={handleSearch}
            onClearSearch={handleClearSearch}
          />
          <PeakButton
            buttonText="Create Campaign"
            icon={AddIcon}
            className="bg-[#090A29] text-gray-100 text-sm rounded-[2px] px-2 shadow-sm outline-none"
            onClick={openModal}
          />
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

export default AirtimeCampaignsTable;