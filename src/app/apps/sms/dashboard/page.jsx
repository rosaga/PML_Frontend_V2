"use client";
import React, { useEffect, useState } from "react";
import { DataGrid, GridRowsProp, GridColDef } from "@mui/x-data-grid";
import Image from "next/image";
import RecipientDashboard from "@/components/rewards-tables/recipientDashboard";
import RecentCampaigns from "@/components/rewards-tables/recentCampaigns";
import { getToken } from "@/utils/auth";
import GroupDashboard from "@/components/rewards-tables/groupDashboard";
import { messagesAction, messageCountsAction } from "../../../api/actions/messages/messagesAction";
import { set } from "date-fns";
import { useRouter } from "next/navigation";
import { format,parseISO } from "date-fns";

const Dashboard = () => {

  const router = useRouter();

  let org_id = null;
  if (typeof window !== 'undefined') {
    org_id = localStorage.getItem('selectedAccountId');
  }
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalMessages, setTotalMessages] = useState('');
  const [totalSuccess, setTotalSuccess] = useState('');
  const [totalPending, setTotalPending] = useState('');
  const [totalFailed, setTotalFailed] = useState(0);

  const page = 1;
  const limit = 5;

  const [paginationModel, setPaginationModel] = React.useState({
    pageSize: 4,
    page: 0
  });

  const columns = [
    // { field: "id", headerName: "ID", flex: 1, minWidth: 50 },
    { field: "source", headerName: "SOURCE", flex: 1, minWidth: 150 },
    { 
      field: "destination", 
      headerName: "DESTINATION", 
      flex: 1, 
      minWidth: 150,
      renderCell: (params) => (
        <span style={{ fontWeight: '550' }}>
          {params.value}
        </span>
      ) 
    },
    { field: "content", headerName: "CONTENT", flex: 1, minWidth: 150 },
    { field: "channel", headerName: "CHANNEL", flex: 1, minWidth: 150 },
    { field: "direction", headerName: "DIRECTION", flex: 1, minWidth: 150 },
    { 
      field: "status_desc", 
      headerName: "STATUS", 
      flex: 1, 
      minWidth: 150, 
      renderCell: (params) => {
        let color = 'inherit'; // Default color
        if (params.value === "SUCCESS") {
          color = 'green';
        } else if (params.value === "InvalidMsisdn") {
          color = 'red';
        }
        return <span style={{ color }}>{params.value}</span>;
      }
    },
    { field: "createdat", headerName: "Date Created", flex: 1, minWidth: 150, 
      valueFormatter: (params) => {
        try {
          const date = parseISO(params);
          return format(date, "yyyy-MM-dd HH:mm");
        } catch (error) {
          return "Invalid Date";
        }
      },
     },
  ];

  const handleHelp = () => {
    router.push("/apps/data/help");
  };

  const handleNotifications = () => {
    router.push("/apps/data/notification");
  };

  const getMessageCounts = () => {
    if (org_id) {
      messageCountsAction({ org_id })
        .then((res) => {
          if (res.errors) {
            console.log("AN ERROR HAS OCCURED");
          } else {
            // Set total message count
            setTotalMessages(res.data.TotalMessageCount);
  
            // Initialize success and failed counts
            let successCount = 0;
            let pendingCount = 0;
  
            // Loop through the StatusCounts and calculate success/failed totals
            res.data.StatusCounts.forEach((status) => {
              if (status.StatusDescription === "Recieved Pending Confirmation" || status.StatusDescription === "SUCCESS") {
                successCount += status.MessageCount;
              } else if (status.StatusDescription === "Accepted for processing") {
                pendingCount += status.MessageCount;
              }
            });
  
            // Set the state for total success and total failed
            setTotalSuccess(successCount);
            setTotalPending(pendingCount);
  
            setLoading(false);
          }
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      console.log("org_id is null or undefined. Skipping API call.");
    }
  };
  const getMessages = () => {
    if (org_id) {
      messagesAction({ org_id, page, limit })
        .then((res) => {
          if (res.errors) {
            console.log("AN ERROR HAS OCCURED");
          } else {
            setMessages(res.data);
            setLoading(false);
          }
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      console.log("org_id is null or undefined. Skipping API call.");
    }
  };

  useEffect(() => {
    getMessages();
    getMessageCounts();
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
                  <p className="m-1 text-md">SMS Summary</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-8">
                <div className="border-[1.5px] shadow-sm rounded-lg p-6 flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-gray-500">Total Sent</div>
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
                  <div className="text-2xl font-bold">{totalMessages ? totalMessages : 0}</div>
                </div>
                <div className="border-[1.5px] shadow-sm rounded-lg p-6 flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-gray-500">Total Success</div>
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
                  <div className="text-2xl font-bold">{totalSuccess ? totalSuccess : 0}</div>
                </div>
                <div className="border-[1.5px] shadow-sm rounded-lg p-6 flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-gray-500">Total Pending</div>
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
                  <div className="text-2xl font-bold">{totalPending ? totalPending : 0}</div>
                </div>
                <div className="border-[1.5px] shadow-sm rounded-lg p-6 flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-gray-500">Total Failed</div>
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
                  <p className="mt-2 font-medium text-lg">Recent Messages</p>
                  <div className="mt-4">
                    <div style={{ height: 350, width: "100%" }}>
                    <DataGrid
                      rows={messages}
                      columns={columns}
                      pageSize={5} // Limits to 5 rows per page
                      rowsPerPageOptions={[5]} // Restricts available page size options
                      paginationModel={paginationModel}
                      onPaginationModelChange={setPaginationModel}
                      pagination // Enable pagination
                      paginationMode="client" // Make sure pagination is handled on the client-side
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
                    <p className="mt-2 mb-20 ml-4 text-3xl font-bold text-wrap text-red-600">Notification</p>
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
