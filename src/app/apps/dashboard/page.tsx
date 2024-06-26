"use client";
import Sidebar from "@/components/sidebar/sidebar";
import React from "react";
import { DataGrid, GridRowsProp, GridColDef } from "@mui/x-data-grid";
import Image from "next/image";
import Button from '@mui/material/Button';
import IosShareIcon from '@mui/icons-material/IosShare';
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import RecipientDashboard from "@/components/rewards-tables/recipientDashboard";
import RecentCampaigns from "@/components/rewards-tables/recentCampaigns";
import { getToken } from "@/utils/auth";
import GroupDashboard from "@/components/rewards-tables/groupDashboard";


interface RowData {
  id: number;
  data_bundle: string;
  units_bought: number;
  unit_balance: number;
  progress: number;
}

const Dashboard = () => {
  const rows: GridRowsProp<RowData> = [
    {
      id: 1,
      data_bundle: '10MB',
      units_bought: 100,
      unit_balance: 50,
      progress: 50,
    },
    {
      id: 2,
      data_bundle: '20MB',
      units_bought: 200,
      unit_balance: 100,
      progress: 50,
    },
    {
      id: 3,
      data_bundle: '30MB',
      units_bought: 300,
      unit_balance: 200,
      progress: 66.67,
    },
    {
      id: 4,
      data_bundle: '40MB',
      units_bought: 20,
      unit_balance: 5,
      progress: 25,
    },
  ];

  const calculateProgress = (unitsBought: number, unitBalance: number): number => {
    return ((unitsBought - unitBalance) / unitsBought) * 100;
  };

  const renderProgress = (params: any) => {
    const progress = calculateProgress(params.row.units_bought, params.row.unit_balance);
    return (
      <Box display="flex" alignItems="center">
        <Box width="100%" mr={1}>
          <LinearProgress variant="determinate" value={progress} />
        </Box>
        <Box minWidth={35}>
          <Typography variant="body2" color="textSecondary">{`${Math.round(progress)}%`}</Typography>
        </Box>
        {progress > 70 && <Typography variant="body2" color="error" style={{ marginLeft: 8 }}>depleting</Typography>}
      </Box>
    );
  };
  const [paginationModel, setPaginationModel] = React.useState({
    pageSize: 4,
    page: 0,
  });

  const columns: GridColDef[] = [
    { field: "data_bundle", headerName: "Data Bundle", flex: 1 },
    { field: "units_bought", headerName: "Units Bought", flex: 1 },
    { field: "unit_balance", headerName: "Unit Balance", flex: 1 },
    { field: "progress", headerName: "Progress", flex: 2, renderCell: renderProgress },
  ];

  const rows1: GridRowsProp = [
    {
      id: 1,
      date_of_onboarding: "2024-05-16",
      phone_number: "0711223344",
      status: "Active",
    },
    {
      id: 2,
      date_of_onboarding: "2024-05-16",
      phone_number: "0711223344",
      status: "Active",
    },
    {
      id: 3,
      date_of_onboarding: "2024-05-16",
      phone_number: "0711223344",
      status: "Active",
    },
    {
      id: 4,
      date_of_onboarding: "2024-05-16",
      phone_number: "0711223344",
      status: "Active",
    },
  ];

  const columns1: GridColDef[] = [
    { field: "date_of_onboarding", headerName: "Date of Onboarding", flex: 1 },
    { field: "phone_number", headerName: "Phone Number", flex: 1 },
    { field: "status", headerName: "Status", flex: 1 },
    { field: "Action", headerName: "Action", flex: 0, renderCell: (params) => <DeleteIcon /> },
  ];
  const rows2: GridRowsProp = [
    {
      id: 1,
      group_name: "Group 1",
      no_contact: 10,
      description: "Group 1 description",
      date_created: "2024-05-16",  
    },
    {
      id:2,
      group_name: "Group 2",
      no_contact: 5,
      description: "Group 2 description",
      date_created: "2024-05-17",        
    },
    {
      id:3,
      group_name: "Group 3",
      no_contact: 20,
      description: "Group 3 description",
      date_created: "2024-04-16",  
    },
    {
      id:4,
      group_name: "Group 4",
      no_contact: 100,
      description: "Group 4 description",
      date_created: "2023-04-16",  
    },
  ];

  const columns2: GridColDef[] = [
    { field: "id", headerName: "ID", flex: 1 },
    { field: "group_name", headerName: "Group Name", flex: 1 },
    { field: "no_contact", headerName: "No of Contacts", flex: 1 },
    { field: "description", headerName: "Description", flex: 1 },
    { field: "date_created", headerName: "Date Created", flex: 1 },
  ];
  const rows3: GridRowsProp = [
    {
      id: 1,
      campaign_name: "Kuza Talanta",
      date_created: "29-04-24, 8:00pm",
      group_name: "Gen-Z",
      owner: "James Karoti",
      contact_counts: 10,
      bundle_amount: 10,
      data_bundle_type: 10,
    },
    {
      id: 2,
      campaign_name: "Kuza Talanta",
      date_created: "29-04-24, 8:00pm",
      group_name: "Gen-Z",
      owner: "James Karoti",
      contact_counts: 10,
      bundle_amount: 10,
      data_bundle_type: 10,
    },
    {
      id: 3,
      campaign_name: "Kuza Talanta",
      date_created: "29-04-24, 8:00pm",
      group_name: "Gen-Z",
      owner: "James Karoti",
      contact_counts: 10,
      bundle_amount: 10,
      data_bundle_type: 10,
    },
    {
      id: 4,
      campaign_name: "Kuza Talanta",
      date_created: "29-04-24, 8:00pm",
      group_name: "Gen-Z",
      owner: "James Karoti",
      contact_counts: 10,
      bundle_amount: 10,
      data_bundle_type: 10,
    },
  ];
  
  const columns3: GridColDef[] = [
    { field: "id", headerName: "ID", flex: 1 },
    { field: "campaign_name", headerName: "Campaign Name", flex: 1 },
    { field: "date_created", headerName: "Date Created", flex: 1 },
    { field: "group_name", headerName: "Group Name", flex: 1 },
    { field: "owner", headerName: "Owner", flex: 1 },
    { field: "contact_counts", headerName: "Contact Counts", flex: 1 },
    { field: "bundle_amount", headerName: "Bundle Amount", flex: 1 },
    { field: "data_bundle_type", headerName: "Data Bundle Type", flex: 1 },
  ];

 

  return (
    <div className="p-4 sm:ml-64 h-screen ">
      <div className="p-4 h-full rounded-lg dark:border-gray-700">
        <div className="flex flex-col h-full">
          <div className="border-[1.5px] rounded-3xl">
            <div className="p-8">
              <p className="m-1 font-semibold text-lg">Summary Tiles</p>
              <div className="flex items-center justify-between">
                <p className="m-1 text-md">Data Rewards Summary</p>

              </div>
            </div>
            <div className="grid grid-cols-4 gap-4 p-8">
              <div className="border-[1.5px] shadow-sm rounded-lg p-6 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-gray-500">Recipients Reached</div>
                  <div>
                    <span>
                      <Image
                        style={{ color: "#F58426" }}
                        className="w-12 h-12 rounded-lg"
                        width={60}
                        height={60}
                        src="/images/Icon-0.svg"
                        blurDataURL="/bluriconloader.png"
                        placeholder="blur"
                        alt="Recipients reached"
                        priority
                      />
                    </span>
                  </div>
                </div>
                <div className="text-2xl font-bold">20</div>
              </div>
              <div className="border-[1.5px] shadow-sm rounded-lg p-6 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-gray-500">Consumed Data</div>
                  <div>
                    <span>
                      <Image
                        style={{ color: "#F58426" }}
                        className="w-12 h-12 rounded-lg"
                        width={60}
                        height={60}
                        src="/images/Icon-1.svg"
                        blurDataURL="/bluriconloader.png"
                        placeholder="blur"
                        alt="Recipients reached"
                        priority
                      />
                    </span>
                  </div>
                </div>
                <div className="text-2xl font-bold">10,000 MBS</div>
              </div>
              <div className="border-[1.5px] shadow-sm rounded-lg p-6 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-gray-500">Active Campaigns</div>
                  <div>
                    <span>
                      <Image
                        style={{ color: "#F58426" }}
                        className="w-12 h-12 rounded-lg"
                        width={60}
                        height={60}
                        src="/images/Icon-1.svg"
                        blurDataURL="/bluriconloader.png"
                        placeholder="blur"
                        alt="Recipients reached"
                        priority
                      />
                    </span>
                  </div>
                </div>
                <div className="text-2xl font-bold">5</div>
              </div>
              <div className="border-[1.5px] shadow-sm rounded-lg p-6 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-gray-500">Failed Campaigns</div>
                  <div>
                    <span>
                      <Image
                        style={{ color: "#F58426" }}
                        className="w-12 h-12 rounded-lg"
                        width={60}
                        height={60}
                        src="/images/Icon-3.svg"
                        blurDataURL="/bluriconloader.png"
                        placeholder="blur"
                        alt="Recipients reached"
                        priority
                      />
                    </span>
                  </div>
                </div>
                <div className="text-2xl font-bold">8</div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3 my-4 p-1">
            <div className="col-span-3 rounded-3xl border-[1.5px] font-semibold text-md p-6">
              <p className="mt-2 font-medium text-lg">Data Balance</p>
              <div className="mt-4">
                <div style={{ height: 350, width: "100%" }}>
                  <DataGrid
                    rows={rows}
                    columns={columns}
                    paginationModel={paginationModel}
                    onPaginationModelChange={setPaginationModel}
                    sx={{
                      "&.MuiDataGrid-root": {
                        border: "none",
                      },
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <div className="rounded-3xl border-[1.5px] p-8">
                <span>
                  <Image
                    style={{ color: "#F58426" }}
                    className="w-12 h-12 ml-4 rounded-lg"
                    width={60}
                    height={60}
                    src="/images/help.svg"
                    blurDataURL="/bluriconloader.png"
                    placeholder="blur"
                    alt="Help"
                    priority
                  />
                </span>
                <p className="mt-2 mb-20 ml-4 text-3xl font-bold text-orange-400">Help</p>
              </div>
              <div className="rounded-3xl border-[1.5px] p-8">
                <span>
                  <Image
                    style={{ color: "#F58426" }}
                    className="w-12 h-12 ml-4 rounded-lg"
                    width={60}
                    height={60}
                    src="/images/noti.svg"
                    blurDataURL="/bluriconloader.png"
                    placeholder="blur"
                    alt="Notification"
                    priority
                  />
                </span>
                <p className="mt-2 mb-20 ml-4 text-3xl font-bold text-red-600">Notification</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col">
            <div className="p-4 shadow-md rounded-lg">
              <div className="flex items-center justify-between">
                <p className="mt-4 font-medium text-lg">Recent Recipients</p>
                <span>
                  <Image
                    style={{ color: "#F58426" }}
                    className="w-8 h-8 ml-4 rounded-lg"
                    width={60}
                    height={60}
                    src="/images/Expand.svg"
                    blurDataURL="/bluriconloader.png"
                    placeholder="blur"
                    alt="Expand"
                    priority
                  />
                </span>
              </div>
              <div className="mt-4">
                <RecipientDashboard />
              </div>
            </div>
            <div className="p-4 shadow-md rounded-lg mt-4">
              <div className="flex items-center justify-between">
                <p className="mt-4 font-medium text-lg">Recent Groups</p>
                <span>
                  <Image
                    style={{ color: "#F58426" }}
                    className="w-8 h-8 ml-4 rounded-lg"
                    width={60}
                    height={60}
                    src="/images/Expand.svg"
                    blurDataURL="/bluriconloader.png"
                    placeholder="blur"
                    alt="Expand"
                    priority
                  />
                </span>
              </div>
              <div className="mt-4">
                <GroupDashboard/>
              </div>
            </div>
            <div className="p-4 shadow-md rounded-lg mt-4 mb-4">
              <div className="flex items-center justify-between">
                <p className="mt-4 font-medium text-lg">Recent Campaigns</p>
                <span>
                  <Image
                    style={{ color: "#F58426" }}
                    className="w-8 h-8 ml-4 rounded-lg"
                    width={60}
                    height={60}
                    src="/images/Expand.svg"
                    blurDataURL="/bluriconloader.png"
                    placeholder="blur"
                    alt="Expand"
                    priority
                  />
                </span>
              </div>
              <div className="mt-4">
                <RecentCampaigns/>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
