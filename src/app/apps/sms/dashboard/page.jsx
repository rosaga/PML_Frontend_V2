"use client";
import React, { useEffect, useState } from "react";
import { DataGrid, GridRowsProp, GridColDef } from "@mui/x-data-grid";
import Image from "next/image";
import RecipientDashboard from "@/components/rewards-tables/recipientDashboard";
import RecentCampaigns from "@/components/rewards-tables/recentCampaigns";
import { getToken } from "@/utils/auth";
import GroupDashboard from "@/components/rewards-tables/groupDashboard";
import { messagesAction, messageCountsAction, messageBalanceAction } from "../../../api/actions/messages/messagesAction";
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
  const [totalBalance, setTotalBalance] = useState(0);

  // Initialize with current date values
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedDay, setSelectedDay] = useState("");

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
    router.push("/apps/sms/help");
  };

  const handleNotifications = () => {
    router.push("/apps/sms/notification");
  };

  const generateYearOptions = () => {
    const options = [{ value: "", label: "All Years" }];
    const startYear = 2024;
    const currentYear = new Date().getFullYear();
    for (let year = startYear; year <= currentYear + 1; year++) {
      options.push({ value: year.toString(), label: year.toString() });
    }
    return options;
  };

  const generateMonthOptions = () => {
    const options = [{ value: "", label: "All Months" }];
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    for (let i = 0; i < 12; i++) {
      const monthNumber = i + 1;
      const monthValue = monthNumber < 10 ? `0${monthNumber}` : `${monthNumber}`;
      options.push({ value: monthValue, label: monthNames[i] });
    }
    return options;
  };

  const generateDayOptions = () => {
    const options = [{ value: "", label: "All Days" }];
    for (let day = 1; day <= 31; day++) {
      const dayValue = day < 10 ? `0${day}` : `${day}`;
      options.push({ value: dayValue, label: dayValue });
    }
    return options;
  };

  const yearOptions = generateYearOptions();
  const monthOptions = generateMonthOptions();
  const dayOptions = generateDayOptions();

  const getSmsBalance = () => {
    if (org_id) {
      messageBalanceAction({ org_id })
        .then((res) => {
          if (res.errors) {
            console.log("AN ERROR HAS OCCURED");
          } else {
            console.log("Balance is", res)
            setTotalBalance(res.data.balance);
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

  const getMessageCounts = () => {
    if (org_id) {
      setTotalMessages(0);
      setTotalSuccess(0);
      setTotalPending(0);
      
      const filterParams = {
        org_id,
        selectedYear: selectedYear || undefined,
        selectedMonth: selectedMonth || undefined,
        selectedDay: selectedDay || undefined
      };

      console.log("Sending filter params:", filterParams); 

      messageCountsAction(filterParams)
        .then((res) => {
          
          if (res.errors) {
            console.log("AN ERROR HAS OCCURED");
            setTotalMessages(0);
            setTotalSuccess(0);
            setTotalPending(0);
          } else {
            const responseData = res.data || {};
            
            const totalCount = responseData.TotalMessageCount || 0;
            setTotalMessages(totalCount);
  
            let successCount = 0;
            let pendingCount = 0;
  
            if (responseData.StatusCounts && Array.isArray(responseData.StatusCounts)) {
              responseData.StatusCounts.forEach((status) => {
                if (status.StatusDescription === "Recieved Pending Confirmation" || 
                    status.StatusDescription === "SUCCESS" || 
                    status.StatusDescription === "DeliveredToTerminal" ||
                    status.StatusDescription === "Accepted for processing"
                ) {
                  successCount += status.MessageCount || 0;
                } else {
                  pendingCount += status.MessageCount || 0;
                }
              });
            }
  
            setTotalSuccess(successCount);
            setTotalPending(pendingCount);
          }
          
          setLoading(false);
        })
        .catch((err) => {
          console.log("Catch block error:", err);
          setTotalMessages(0);
          setTotalSuccess(0);
          setTotalPending(0);
          setLoading(false);
        });
    } else {
      console.log("org_id is null or undefined. Skipping API call.");
      setTotalMessages(0);
      setTotalSuccess(0);
      setTotalPending(0);
      setLoading(false);
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
          setLoading(false);
        });
    } else {
      console.log("org_id is null or undefined. Skipping API call.");
    }
  };

  const handleYearChange = (year) => {
    setSelectedYear(year);
    setTotalMessages(0);
    setTotalSuccess(0);
    setTotalPending(0);
    setLoading(true);
  };

  const handleMonthChange = (month) => {
    setSelectedMonth(month);
    setTotalMessages(0);
    setTotalSuccess(0);
    setTotalPending(0);
    setLoading(true);
  };

  const handleDayChange = (day) => {
    setSelectedDay(day);
    setTotalMessages(0);
    setTotalSuccess(0);
    setTotalPending(0);
    setLoading(true);
  };

  useEffect(() => {
    if (org_id) {
      getMessages();
      getMessageCounts();
      getSmsBalance();
    }
  }, [org_id, selectedMonth, selectedYear, selectedDay]);

  return (
    <div className="flex flex-col sm:flex-row">
      {/* page wrapper: margin only on large screens when sidebar is visible */}
      <div className="flex-1 p-4 lg:ml-64 h-screen">
        <div className="p-4 h-full rounded-lg dark:border-gray-700">
          <div className="flex flex-col h-full">
            <div className="mb-4 p-4 border rounded-lg flex space-x-4 items-center">
              <div>
                <label htmlFor="yearFilter" className="block text-sm font-medium text-gray-700 mb-1">
                  Year
                </label>
                <select
                  id="yearFilter"
                  value={selectedYear}
                  onChange={(e) => handleYearChange(e.target.value)}
                  className="p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {yearOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="monthFilter" className="block text-sm font-medium text-gray-700 mb-1">
                  Month
                </label>
                <select
                  id="monthFilter"
                  value={selectedMonth}
                  onChange={(e) => handleMonthChange(e.target.value)}
                  className="p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {monthOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="dayFilter" className="block text-sm font-medium text-gray-700 mb-1">
                  Day
                </label>
                <select
                  id="dayFilter"
                  value={selectedDay}
                  onChange={(e) => handleDayChange(e.target.value)}
                  className="p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {dayOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {loading && (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-2">Loading...</span>
              </div>
            )}

            <div className="border-[1.5px] rounded-3xl">
              <div className="p-8">
                <p className="m-1 font-semibold text-lg">Summary Tiles</p>
                <div className="flex items-center justify-between">
                  <p className="m-1 text-md">SMS Summary</p>
                  {(selectedYear || selectedMonth || selectedDay) && (
                    <p className="text-sm text-gray-600">
                      Filtered by: {selectedYear && `Year ${selectedYear}`}
                      {selectedMonth && ` Month ${selectedMonth}`}
                      {selectedDay && ` Day ${selectedDay}`}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-8">
                <div className="border-[1.5px] shadow-sm rounded-lg p-6 flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-gray-500">Total Messages</div>
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
                          alt="Total messages"
                          priority
                        />
                      </span>
                    </div>
                  </div>
                  <div className="text-2xl font-bold">{totalMessages || 0}</div>
                </div>
                <div className="border-[1.5px] shadow-sm rounded-lg p-6 flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-gray-500">Total Delivered</div>
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
                          alt="Total delivered"
                          priority
                        />
                      </span>
                    </div>
                  </div>
                  <div className="text-2xl font-bold">{totalSuccess || 0}</div>
                </div>
                <div className="border-[1.5px] shadow-sm rounded-lg p-6 flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-gray-500">Total Failed Delivery</div>
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
                          alt="Total failed"
                          priority
                        />
                      </span>
                    </div>
                  </div>
                  <div className="text-2xl font-bold">{totalPending || 0}</div>
                </div>
                <div className="border-[1.5px] shadow-sm rounded-lg p-6 flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-gray-500">SMS Balance</div>
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
                          alt="SMS balance"
                          priority
                        />
                      </span>
                    </div>
                  </div>
                  <div className="text-2xl font-bold">{totalBalance || 0}</div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-3 my-4 p-1">
                <div className="col-span-1 sm:col-span-3 rounded-3xl border-[1.5px] font-semibold text-md p-6">
                  <p className="mt-2 font-medium text-lg">Recent Messages</p>
                  <div className="mt-4">
                    <div style={{ height: 350, width: "100%" }}>
                    <DataGrid
                      rows={messages}
                      columns={columns}
                      pageSize={5}
                      rowsPerPageOptions={[5]}
                      paginationModel={paginationModel}
                      onPaginationModelChange={setPaginationModel}
                      pagination
                      paginationMode="client"
                      getRowId={(row) => row.message_id || row.destination || Math.random().toString()}
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
                    <p className="mt-2 mb-20 ml-4 text-xl md:text-2xl lg:text-3xl font-bold text-orange-400">Help</p>
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
                    <p className="mt-2 mb-20 ml-4 text-xl md:text-2xl lg:text-3xl font-bold text-wrap text-red-600">Notification</p>
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