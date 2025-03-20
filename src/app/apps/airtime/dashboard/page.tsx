"use client";
import React, { useEffect, useState } from "react";
import { DataGrid, GridColDef, GridToolbar } from "@mui/x-data-grid";
import Image from "next/image";
import { format, parseISO } from "date-fns";
import { useRouter } from "next/navigation";
import RecipientDashboard from "@/components/rewards-tables/recipientDashboard";
import GroupDashboard from "@/components/rewards-tables/groupDashboard";
import DownloadAllButton from "@/components/button/DownloadAllButton";
import { GetAirtimeRewards } from "@/app/api/actions/airtimeReward/airtimeReward";
import IconButton from "@mui/material/IconButton";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
  
interface AirtimeReward {
  id: number;
  created_at: string;
  airtime_amount: string;
  status: string;
  status_desc?: string;
  contact?: {
    mobile_no: string;
    firstName?: string;
    lastName?: string;
  };
}

interface RewardsAPIResponse {
  data?: {
    data: AirtimeReward[];
    count: number;
  };
  errors?: {
    _error: string;
  };
  status?: number;
}

const Dashboard = () => {
  const router = useRouter();
  let org_id: string | null = null;
  if (typeof window !== "undefined") {
    org_id = localStorage.getItem("selectedAccountId");
  }

  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [hidePhone, setHidePhone] = useState(true);

  const [rows, setRows] = useState<AirtimeReward[]>([]);
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  });
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [recipientsReached, setRecipientsReached] = useState(0);
  const [consumedAirtime, setConsumedAirtime] = useState(0);

  const [recipients, setRecipients] = useState<any[]>([]);

    // mask phone number function
    const maskPhone = (phone: string) => {
      if (phone && phone.length > 5) {
        return phone.slice(0, 2) + "*".repeat(phone.length - 5) + phone.slice(-3);
      }
      return phone;
    };

  const columns: GridColDef[] = [
    {
      field: "id",
      headerName: "Request ID",
      flex: 1,
      minWidth: 100,
    },
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
      field: "airtime_amount",
      headerName: "Airtime Amount",
      flex: 1,
      minWidth: 150,
    },
    {
      field: "mobile_no",
      renderHeader: () => (
        <div style={{ display: "flex", alignItems: "center" }}>
          <span style={{ marginRight: 4 }}>Phone Number</span>
          <IconButton
            size="small"
            onClick={() => setHidePhone(!hidePhone)}
            title={hidePhone ? "Show Phone Number" : "Hide Phone Number"}
          >
            {hidePhone ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
          </IconButton>
        </div>
      ),
      flex: 1,
      minWidth: 200,
      renderCell: (params) => {
        const phone = params.value || "";
        return hidePhone ? maskPhone(phone) : phone;
      },
    },
    {
      field: "status",
      headerName: "Status ID",
      flex: 1,
      minWidth: 150,
      renderCell: (params) => {
        const getColor = (status: string) => {
          switch (status) {
            case "SUCCESS":
              return "green";
            case "FAILED":
              return "red";
            default:
              return "black";
          }
        };
        return <span style={{ color: getColor(params.value) }}>{params.value}</span>;
      },
    },
    {
      field: "status_desc",
      headerName: "Status Description",
      flex: 1,
      minWidth: 200,
    },
  ];

  const buildDateQuery = (): Record<string, string> => {
    const searchParams: Record<string, string> = {};
    if (!selectedYear) return searchParams;

    let startDate = "";
    let endDate = "";
    if (selectedYear && selectedMonth) {
      startDate = `${selectedYear}-${selectedMonth}-01`;
      const lastDay = new Date(+selectedYear, +selectedMonth, 0).getDate();
      endDate = `${selectedYear}-${selectedMonth}-${lastDay}`;
    } else if (selectedYear) {
      startDate = `${selectedYear}-01-01`;
      endDate = `${selectedYear}-12-31`;
    }
    searchParams["gte__created_at"] = startDate;
    searchParams["lte__created_at"] = endDate;
    return searchParams;
  };

  const fetchRewards = async () => {
    if (!org_id) {
      console.error("No organization ID found.");
      return;
    }
    try {
      setLoading(true);
      const pageNumber = paginationModel.page + 1;
      const pageSize = paginationModel.pageSize;
      const dateQuery = buildDateQuery();

      const response: RewardsAPIResponse = await GetAirtimeRewards(org_id, pageNumber, pageSize, dateQuery);

      if (response.errors) {
        console.error("API error:", response.errors._error);
        setRows([]);
        setTotal(0);
        setLoading(false);
        return;
      }
      if (!response.data || !response.data.data || !Array.isArray(response.data.data)) {
        console.error("Unexpected API response:", response);
        setRows([]);
        setTotal(0);
        setLoading(false);
        return;
      }
      const rewardsArray = response.data.data;
      setTotal(response.data.count || 0);

      const finalRows = rewardsArray.map((item) => ({
        ...item,
        mobile_no: item.contact?.mobile_no || "",
      }));
      setRows(finalRows);

      const successRewards = finalRows.filter((r) => r.status === "SUCCESS");
      setRecipientsReached(successRewards.length);

      const totalConsumed = successRewards.reduce((sum, reward) => {
        return sum + Number(reward.airtime_amount);
      }, 0);
      setConsumedAirtime(totalConsumed);

      const recs = successRewards
        .filter((r) => r.contact && r.contact.mobile_no)
        .map((r) => r.contact);
      setRecipients(recs);

      setLoading(false);
    } catch (error) {
      console.error("Error fetching rewards:", error);
      setRows([]);
      setTotal(0);
      setRecipientsReached(0);
      setConsumedAirtime(0);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRewards();
  }, [selectedYear, selectedMonth, paginationModel.page, paginationModel.pageSize, org_id]);

  const handleHelp = () => {
    router.push("/apps/data/help");
  };
  const handleNotifications = () => {
    router.push("/apps/airtime/notification");
  };

  const generateYearOptions = (): { value: string; label: string }[] => {
    const options = [{ value: "", label: "All Years" }];
    const startYear = 2024;
    const currentYear = new Date().getFullYear();
    for (let year = startYear; year <= currentYear + 1; year++) {
      options.push({ value: String(year), label: String(year) });
    }
    return options;
  };

  const generateMonthOptions = (): { value: string; label: string }[] => {
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
      const monthValue = monthNumber < 10 ? `0${monthNumber}` : String(monthNumber);
      options.push({ value: monthValue, label: monthNames[i] });
    }
    return options;
  };

  const yearOptions = generateYearOptions();
  const monthOptions = generateMonthOptions();

  const fetchAllRewards = async () => {
    try {
      const dateQuery = buildDateQuery();
      const response: RewardsAPIResponse = await GetAirtimeRewards(org_id!, 1, total, dateQuery);
      if (!response || !response.data || !response.data.data) {
        return [];
      }
      return response.data.data.map((item) => ({
        "Request ID": item.id,
        "Date Created": item.created_at,
        "Airtime Amount": item.airtime_amount,
        "Phone Number": item.contact?.mobile_no || "",
        "Status ID": item.status,
        "Status Description": item.status_desc || "",
      }));
    } catch (error) {
      console.error("Failed to fetch rewards for export:", error);
      return [];
    }
  };

  return (
    <div className="flex flex-col sm:flex-row">
      <div className="flex-1 p-4 sm:ml-64 h-screen">
        <div className="p-4 h-full rounded-lg dark:border-gray-700">
          <div className="flex flex-col h-full">
            <h1 className="text-xl font-semibold mb-4">Airtime Rewards</h1>

            {/* Filter Section */}
            <div className="mb-4 p-4 border rounded-lg flex space-x-4 items-center">
              <div>
                <select
                  id="yearFilter"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="p-2 border rounded"
                >
                  {yearOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <select
                  id="monthFilter"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="p-2 border rounded"
                >
                  {monthOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Summary Tiles */}
            <div className="border-[1.5px] rounded-3xl mb-6">
              <div className="p-8">
                <p className="m-1 font-semibold text-lg">Summary Tiles</p>
                <p className="m-1 text-md">Airtime Rewards Summary</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-8">
                {/* Recipients Reached */}
                <div className="border-[1.5px] shadow-sm rounded-lg p-6 flex flex-col">
                  <span className="text-gray-500">Recipients Reached</span>
                  <div className="flex justify-between items-center mt-4">
                    <Image
                      className="w-12 h-12 rounded-lg"
                      width={60}
                      height={60}
                      src="/images/Icon-0.svg"
                      alt="Recipients reached"
                      priority
                    />
                    <div className="text-2xl font-bold">{recipientsReached}</div>
                  </div>
                </div>

                {/* Consumed Airtime */}
                <div className="border-[1.5px] shadow-sm rounded-lg p-6 flex flex-col">
                  <span className="text-gray-500">Consumed Airtime</span>
                  <div className="flex justify-between items-center mt-4">
                    <Image
                      className="w-12 h-12 rounded-lg"
                      width={60}
                      height={60}
                      src="/images/Icon-1.svg"
                      alt="Consumed Airtime"
                      priority
                    />
                    <div className="text-2xl font-bold">KES {consumedAirtime}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Airtime Rewards Table */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-8">
              <div className="col-span-1 sm:col-span-3 rounded-3xl border-[1.5px] font-semibold text-md p-6">
                <p className="mt-2 font-medium text-lg">Airtime Rewards</p>
                <div className="mt-4" style={{ height: 450, width: "100%" }}>
                  <DataGrid
                    rows={rows}
                    columns={columns}
                    loading={loading}
                    paginationMode="server"
                    rowCount={total}
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
                    slots={{
                      toolbar: () => (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "8px",
                          }}
                        >
                          <GridToolbar />
                          <DownloadAllButton
                            fetchAllData={fetchAllRewards}
                            filename="rewards_data.csv"
                          />
                        </div>
                      ),
                    }}
                  />
                </div>
              </div>

              {/* Side Buttons */}
              <div className="flex flex-col gap-4 col-span-1">
                <div
                  onClick={handleHelp}
                  className="rounded-3xl border-[1.5px] p-8 cursor-pointer"
                >
                  <Image
                    className="w-12 h-12 ml-4 rounded-lg"
                    width={60}
                    height={60}
                    src="/images/help.svg"
                    alt="Help"
                    priority
                  />
                  <p className="mt-2 mb-20 ml-4 text-3xl font-bold text-orange-400">
                    Help
                  </p>
                </div>
                <div
                  onClick={handleNotifications}
                  className="rounded-3xl border-[1.5px] p-8 cursor-pointer"
                >
                  <Image
                    className="w-12 h-12 ml-4 rounded-lg"
                    width={60}
                    height={60}
                    src="/images/noti.svg"
                    alt="Notification"
                    priority
                  />
                  <p className="mt-2 mb-20 ml-4 text-3xl font-bold text-red-600">
                    Notification
                  </p>
                </div>
              </div>
            </div>

            {/* Additional Sections */}
            <div className="flex flex-col">
              {/* Recent Recipients */}
              <div className="p-4 shadow-md rounded-lg">
                <div className="flex items-center justify-between">
                  <p className="mt-4 font-medium text-lg">Recent Recipients</p>
                  <Image
                    className="w-8 h-8 ml-4 rounded-lg"
                    width={60}
                    height={60}
                    src="/images/Expand.svg"
                    alt="Expand"
                    priority
                  />
                </div>
                <div className="mt-4">
                  <RecipientDashboard/>
                </div>
              </div>

              {/* Recent Groups */}
              <div className="p-4 shadow-md rounded-lg mt-4">
                <div className="flex items-center justify-between">
                  <p className="mt-4 font-medium text-lg">Recent Groups</p>
                  <Image
                    className="w-8 h-8 ml-4 rounded-lg"
                    width={60}
                    height={60}
                    src="/images/Expand.svg"
                    alt="Expand"
                    priority
                  />
                </div>
                <div className="mt-4">
                  <GroupDashboard />
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
