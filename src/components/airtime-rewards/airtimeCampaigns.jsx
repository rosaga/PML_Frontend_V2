import React, { useMemo, useState } from "react";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import PeakButton from "../button/button";
import PeakSearch from "../search/search";
import { format, parseISO } from "date-fns";
import CreateAirtimeCampaignModal from "../modal/createAirtimeCampaign";
import CampaignDetails from "../rewards-tables/campaignDetails";

const DUMMY_CAMPAIGNS = [
  {
    id: "CMP-001",
    name: "Welcome Bonus Top-Ups",
    created_at: "2025-09-18T10:12:00Z",
    groups: "New Signups - Sept",
    created_by: "Ted Test",
    contacts_count: 120,
    bundle_size: 50,
    airtime_amount: 6000,
  },
  {
    id: "CMP-002",
    name: "Loyalty Milestone 100pts",
    created_at: "2025-09-22T08:00:00Z",
    groups: { name: "Active Users" },
    created_by: "Edwin Aringo",
    contacts_count: 80,
    bundle_size: 100,
    airtime_amount: 8000,
  },
  {
    id: "CMP-003",
    name: "Dormant Re-activation Wave 1",
    created_at: "2025-09-28T14:45:00Z",
    groups: { name: "Dormant 30-60d" },
    created_by: "Ted Test",
    contacts_count: 50,
    bundle_size: 20,
    airtime_amount: 2500,
  },
  {
    id: "CMP-004",
    name: "VIP Thank You Drop",
    created_at: "2025-10-01T07:30:00Z",
    groups: { name: "VIP Tier" },
    created_by: "Edwin Aringo",
    contacts_count: 20,
    bundle_size: 250,
    airtime_amount: 10000,
  },
  {
    id: "CMP-005",
    name: "Churn Risk Save",
    created_at: "2025-10-03T16:05:00Z",
    groups: { name: "Churn Risk 7d" },
    created_by: "Ted Test",
    contacts_count: 150,
    bundle_size: 50,
    airtime_amount: 7500,
  },
  {
    id: "CMP-006",
    name: "Weekend Promo",
    created_at: "2025-10-04T09:10:00Z",
    groups: { name: "All Customers" },
    created_by: "Ops Bot",
    contacts_count: 300,
    bundle_size: 20,
    airtime_amount: 6000,
  },
  {
    id: "CMP-007",
    name: "Partner Co-Brand Blast",
    created_at: "2025-10-05T11:20:00Z",
    groups: { name: "Co-Brand Segment" },
    created_by: "Ted Test",
    contacts_count: 90,
    bundle_size: 100,
    airtime_amount: 9000,
  },
  {
    id: "CMP-008",
    name: "Referral Reward Wave",
    created_at: "2025-10-06T13:15:00Z",
    groups: { name: "Referrers" },
    created_by: "Edwin Aringo",
    contacts_count: 60,
    bundle_size: 50,
    airtime_amount: 3000,
  },
  {
    id: "CMP-009",
    name: "Service Recovery Tokens",
    created_at: "2025-10-07T17:25:00Z",
    groups: { name: "Recent Tickets" },
    created_by: "Care Team",
    contacts_count: 35,
    bundle_size: 100,
    airtime_amount: 3500,
  },
  {
    id: "CMP-010",
    name: "Quarter-End Appreciation",
    created_at: "2025-09-30T18:45:00Z",
    groups: { name: "Top Spenders" },
    created_by: "Finance Ops",
    contacts_count: 25,
    bundle_size: 200,
    airtime_amount: 5000,
  },
  {
    id: "CMP-011",
    name: "Flash Sale Reactivation",
    created_at: "2025-10-08T06:10:00Z",
    groups: { name: "Dormant 7-14d" },
    created_by: "Marketing Bot",
    contacts_count: 110,
    bundle_size: 50,
    airtime_amount: 5500,
  },
  {
    id: "CMP-012",
    name: "Birthday Treats",
    created_at: "2025-10-09T09:00:00Z",
    groups: { name: "Birthdays This Week" },
    created_by: "CRM",
    contacts_count: 18,
    bundle_size: 100,
    airtime_amount: 1800,
  },
  {
    id: "CMP-013",
    name: "NPS Promoters Thank You",
    created_at: "2025-10-09T12:00:00Z",
    groups: { name: "NPS Promoters" },
    created_by: "CX Team",
    contacts_count: 40,
    bundle_size: 50,
    airtime_amount: 2000,
  },
  {
    id: "CMP-014",
    name: "Insider Community Drop",
    created_at: "2025-10-10T08:40:00Z",
    groups: { name: "Insider Club" },
    created_by: "Community",
    contacts_count: 55,
    bundle_size: 100,
    airtime_amount: 5500,
  },
  {
    id: "CMP-015",
    name: "Welcome Back Winback",
    created_at: "2025-10-11T15:35:00Z",
    groups: { name: "Winback 60-90d" },
    created_by: "Growth",
    contacts_count: 140,
    bundle_size: 20,
    airtime_amount: 2800,
  },
];


const AirtimeCampaignsTable = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openCampaignDetails, setOpenCampaignDetails] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  const filterOptions = [
    { value: "ilike__name", label: "Name" },
    { value: "ilike__created_by", label: "Owner" },
    { value: "eq__bundle_size", label: "Bundle Amt" },
  ];

  const [searchParams, setSearchParams] = useState({});
  const handleSearch = (filter, value) => {
    setSearchParams({ [filter]: value });
  };
  const handleClearSearch = () => setSearchParams({});

  const [paginationModel, setPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  });


  const rows = useMemo(() => {
    const entries = Object.entries(searchParams || {});
    if (!entries.length) return DUMMY_CAMPAIGNS;

    return DUMMY_CAMPAIGNS.filter((row) => {
      return entries.every(([key, val]) => {
        if (!val && val !== 0) return true;
        const v = String(val).toLowerCase();

        if (key === "ilike__name") {
          return String(row.name || "").toLowerCase().includes(v);
        }
        if (key === "ilike__created_by") {
          return String(row.created_by || "").toLowerCase().includes(v);
        }
        if (key === "eq__bundle_size") {
          const numeric = Number(v);
          return Number(row.bundle_size) === numeric;
        }
        return true;
      });
    });
  }, [searchParams]);

  const total = rows.length;

  const columns = [
    { field: "id", headerName: "ID", flex: 1, minWidth: 100 },
    { field: "name", headerName: "Campaign Name", flex: 1, minWidth: 220 },
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
      field: "groups",
      headerName: "Group Name",
      flex: 1,
      minWidth: 200,
      valueGetter: (params) => params?.row?.groups?.name || params?.row?.groups || "Test Group",
    },
    { field: "created_by", headerName: "Owner", flex: 1, minWidth: 200 },
    {
      field: "contacts_count",
      headerName: "Contact Counts",
      flex: 1,
      minWidth: 150,
      type: "number",
    },

    {
      field: "airtime_amount",
      headerName: "Airtime Amount (KES)",
      flex: 1,
      minWidth: 180,
      type: "number",
      valueFormatter: ({ value }) =>
        typeof value === "number" ? value.toLocaleString("en-KE") : value,
    },
  ];

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

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

          <div className="mt-4" style={{ width: "100%" }}>
            <DataGrid
              rows={rows}
              columns={columns}
              loading={false}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              onRowClick={handleRowClick}
              rowCount={total}
              paginationMode="client"
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
        </>
      )}
    </>
  );
};

export default AirtimeCampaignsTable;
