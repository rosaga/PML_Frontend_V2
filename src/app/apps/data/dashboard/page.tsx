"use client";
import SidebarData from "@/components/sidebardata/sidebardata";
import React, { useEffect, useState } from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import Image from "next/image";
import Button from "@mui/material/Button";
import IosShareIcon from "@mui/icons-material/IosShare";
import LinearProgress from "@mui/material/LinearProgress";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import RecipientDashboard from "@/components/rewards-tables/recipientDashboard";
import RecentCampaigns from "@/components/rewards-tables/recentCampaigns";
import { getToken } from "@/utils/auth";
import GroupDashboard from "@/components/rewards-tables/groupDashboard";
import { GetDashboardSummary, GetDataBalance } from "@/app/api/actions/dashboard/dashboard";
import { useRouter } from "next/navigation";
import CircularProgress from "@mui/material/CircularProgress";

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
  if (typeof window !== "undefined") {
    org_id = localStorage.getItem("selectedAccountId");
  }

  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [rows, setRows] = useState([]);
  const [recipientsReached, setRecipientsReached] = useState("");
  const [consumedData, setConsumedData] = useState("");
  const [activeCampaigns, setActiveCampaigns] = useState("");
  const [loadingDataBalance, setLoadingDataBalance] = useState(true);

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
        {progress > 70 && (
          <Typography variant="body2" color="error" style={{ marginLeft: 8 }}>
            depleting
          </Typography>
        )}
      </Box>
    );
  };

  const [paginationModel, setPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  });

  const columns: GridColDef[] = [
    { field: "data_bundle", headerName: "Data Bundle", flex: 1, minWidth: 150 },
    { field: "units_bought", headerName: "Units Bought", flex: 1, minWidth: 150 },
    { field: "unit_balance", headerName: "Unit Balance", flex: 1, minWidth: 150 },
    {
      field: "progress",
      headerName: "Progress",
      flex: 2,
      renderCell: renderProgress,
      minWidth: 200,
    },
  ];

  const buildDateQuery = (forTable: "rewards" | "recharges") => {
    if (!selectedYear) return "";

    let startDate = "";
    let endDate = "";

    if (selectedYear && selectedMonth) {
      startDate = `${selectedYear}-${selectedMonth}-01`;
      const lastDayOfMonth = new Date(
        parseInt(selectedYear),
        parseInt(selectedMonth),
        0
      ).getDate();
      endDate = `${selectedYear}-${selectedMonth}-${lastDayOfMonth}`;
    } else if (selectedYear) {
      startDate = `${selectedYear}-01-01`;
      endDate = `${selectedYear}-12-31`;
    }

    if (forTable === "recharges") {
      return `&gte__recharges.created_at=${startDate}&lte__recharges.created_at=${endDate}`;
    }
    return `&gte__rewards.created_at=${startDate}&lte__rewards.created_at=${endDate}`;
  };

  const fetchDashboardSummary = async () => {
    const dateQuery = buildDateQuery("rewards");
    const summary = await GetDashboardSummary(org_id, dateQuery);
    if ("recipientsReached" in summary) {
      setRecipientsReached(summary.recipientsReached.toString());
      setConsumedData(summary.consumedData.toString());
      setActiveCampaigns(summary.activeCampaigns.toString());
    }
  };

  const fetchDataBundle = async () => {
    setLoadingDataBalance(true);
    try {
      const dateQuery = buildDateQuery("recharges");
      const dataBalance = await GetDataBalance(org_id);
      setRows(dataBalance);
    } catch (error) {
      console.error("Error fetching data bundle:", error);
    } finally {
      setLoadingDataBalance(false);
    }
  };

  useEffect(() => {
    fetchDashboardSummary();
    fetchDataBundle();
  }, [selectedYear, selectedMonth]);

  const handleHelp = () => {
    router.push("/apps/data/help");
  };

  const handleNotifications = () => {
    router.push("/apps/data/notification");
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

  const yearOptions = generateYearOptions();
  const monthOptions = generateMonthOptions();

  return (
    <div className="flex flex-col sm:flex-row">
      <div className="flex-1 p-4 sm:ml-64 h-screen">
        <div className="p-4 h-full rounded-lg dark:border-gray-700">
          <div className="flex flex-col h-full">
            {/* filter section start */}
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

            {/* summary start */}
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
                  <div className="text-2xl font-bold">
                    {recipientsReached ? recipientsReached : 0}
                  </div>
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
                          alt="Consumed Data"
                          priority
                        />
                      </span>
                    </div>
                  </div>
                  <div className="text-2xl font-bold">
                    {consumedData ? consumedData : 0} MBS
                  </div>
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
                          alt="Active Campaigns"
                          priority
                        />
                      </span>
                    </div>
                  </div>
                  <div className="text-2xl font-bold">
                    {activeCampaigns ? activeCampaigns : 0}
                  </div>
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
                          alt="Failed Campaigns"
                          priority
                        />
                      </span>
                    </div>
                  </div>
                  <div className="text-2xl font-bold">0</div>
                </div>
              </div>
            </div>

            {/* Data Balance start */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 my-4 p-1">
              <div className="col-span-1 sm:col-span-3 rounded-3xl border-[1.5px] font-semibold text-md p-6">
                <p className="mt-2 font-medium text-lg">Data Balance</p>
                <div className="mt-4" style={{ height: 350, width: "100%" }}>
                  {loadingDataBalance ? (
                    <Box className="flex justify-center items-center h-full">
                      <CircularProgress style={{ color: "#E88A17" }} />
                    </Box>
                  ) : (
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
                  )}
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
                <div
                  onClick={handleNotifications}
                  className="rounded-3xl border-[1.5px] p-8 cursor-pointer"
                >
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
                  <p className="mt-2 mb-20 ml-4 text-3xl font-bold text-wrap text-red-600">
                    Notification
                  </p>
                </div>
              </div>
            </div>

            {/* Additional */}
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
