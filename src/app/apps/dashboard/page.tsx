"use client";
import Sidebar from "@/components/sidebar/sidebar";
import React, { useEffect, useState } from "react";
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
import { GetDashboardSummary, GetDataBalance } from "@/app/api/actions/dashboard/dashboard"
import { set } from "date-fns";
import { useRouter } from "next/navigation";

interface RowData {
  id: number;
  data_bundle: string;
  units_bought: number;
  unit_balance: number;
  progress: number;
}

const Dashboard = () => {

  const router = useRouter();

  let org_id: string | null = null;
  if (typeof window !== 'undefined') {
    org_id = localStorage.getItem('selectedAccountId');
  }
  const [rows, setRows] = useState([]);
  const [recipientsReached, setRecipientsReached] = useState('');
  const [consumedData, setConsumedData] = useState('');
  const [activeCampaigns, setActiveCampaigns] = useState('');



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
    pageSize: 10,
    page: 0,
  });

  const columns: GridColDef[] = [
    { field: "data_bundle", headerName: "Data Bundle", flex: 1 },
    { field: "units_bought", headerName: "Units Bought", flex: 1 },
    { field: "unit_balance", headerName: "Unit Balance", flex: 1 },
    { field: "progress", headerName: "Progress", flex: 2, renderCell: renderProgress },
  ];

 

  const columns1: GridColDef[] = [
    { field: "date_of_onboarding", headerName: "Date of Onboarding", flex: 1 },
    { field: "phone_number", headerName: "Phone Number", flex: 1 },
    { field: "status", headerName: "Status", flex: 1 },
    { field: "Action", headerName: "Action", flex: 0, renderCell: (params) => <DeleteIcon /> },
  ];
 

  const columns2: GridColDef[] = [
    { field: "id", headerName: "ID", flex: 1 },
    { field: "group_name", headerName: "Group Name", flex: 1 },
    { field: "no_contact", headerName: "No of Contacts", flex: 1 },
    { field: "description", headerName: "Description", flex: 1 },
    { field: "date_created", headerName: "Date Created", flex: 1 },
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
  const fetchDashboardSummary = async () => {
    const summary = await GetDashboardSummary(org_id);
    if ('recipientsReached' in summary) {
      setRecipientsReached(summary.recipientsReached);
      setConsumedData(summary.consumedData);
      setActiveCampaigns(summary.activeCampaigns);
    }
  };
  const fetchDataBundle = async () => {
    const dataBalance = await GetDataBalance(org_id);
    setRows(dataBalance);
  };

  const handleHelp = () => {
    router.push("/apps/help");
  };

  const handleNotifications = () => {
    router.push("/apps/notification");
  };

 useEffect(() => {
  fetchDashboardSummary()
  fetchDataBundle()
  }, []);


  return (
    <div className="flex flex-col sm:flex-row">
      <div className="flex-1 p-4 sm:ml-64 h-screen">
        <div className="p-4 h-full rounded-lg dark:border-gray-700">
          <div className="flex flex-col h-full">
            <div className="border-[1.5px] rounded-3xl">
              <div className="p-8">
                <p className="m-1 font-semibold text-lg">Summary Tiles</p>
                <div className="flex items-center justify-between">
                  <p className="m-1 text-md">Data Rewards Summary</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-8">
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
                  <div className="text-2xl font-bold">{recipientsReached ? recipientsReached : 0}</div>
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
                  <div className="text-2xl font-bold">{consumedData ? consumedData : 0} MBS</div>
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
                  <div className="text-2xl font-bold">{activeCampaigns ? activeCampaigns : 0}</div>
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
                  <div className="text-2xl font-bold">0</div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 my-4 p-1">
                <div className="col-span-1 sm:col-span-3 rounded-3xl border-[1.5px] font-semibold text-md p-6">
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
                <div className="flex flex-col gap-4 col-span-1">
                  <div onClick={handleHelp} className="rounded-3xl border-[1.5px] p-8 cursor-pointer">
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
                  <div onClick={handleNotifications} className="rounded-3xl border-[1.5px] p-8 cursor-pointer">
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
                  <GroupDashboard />
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
                  <RecentCampaigns />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
