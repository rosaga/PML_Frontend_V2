"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import Image from "next/image";
import { DataGrid, GridRowsProp, GridColDef } from "@mui/x-data-grid";
import IosShareIcon from "@mui/icons-material/IosShare";
import AddIcon from "@mui/icons-material/Add";
import PeakButton from "../../../../components/button/button";
import PeakSearch from "../../../../components/search/search";
import RequestUnitsModal from "../../../../components/modal/requestUnits";
import * as XLSX from 'xlsx';

interface Balance {
  package: string;
  units: string;
}

interface RechargeData {
  id: string;
  expireson: string;
  startDate: string;
  package: string;
  units: string;
  status: string;
}

const DataUnits: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [rechargeData, setRechargeData] = useState<RechargeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingToken, setLoadingToken] = useState(true);
  const [token, setToken] = useState("");
  const [loadingData, setLoadingData] = useState(true);

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

  const columns: GridColDef[] = [
    { field: "id", headerName: "Transaction Reference", flex: 1 },
    { field: "startDate", headerName: "Start Date", flex: 1 },
    { field: "expireson", headerName: "End Date", flex: 1 },
    { field: "package", headerName: "Data Bundle", flex: 1 },
    { field: "units", headerName: "Units", flex: 1 },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
      renderCell: (params) => {
        const getStatusLabel = (status: string) => {
          switch (status) {
            case "TOPUP_APPROVED":
              return { label: "Approved", color: "green" };
            case "TOPUP_SUBMITTED":
              return { label: "Pending", color: "orange" };
            default:
              return { label: status, color: "black" }; // Default color if needed
          }
        };

        const statusInfo = getStatusLabel(params.value);

        return <span style={{ color: statusInfo.color }}>{statusInfo.label}</span>;
      },
    },
  ];
  const refreshPage = () => {
    setLoadingData(true);
    fetchRechargeData();
  }

  const fetchToken = async () => {
    try {
      const authResponse = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/public/token`, {
        username: process.env.NEXT_PUBLIC_USERNAME,
        password: process.env.NEXT_PUBLIC_PASSWORD,
      });

      const fetchedToken = authResponse.data.token;
      setToken(fetchedToken);
      setLoadingToken(false);
    } catch (error) {
      console.error("Error fetching token:", error);
      setLoadingToken(false);
    }
  };

  const fetchBalances = async () => {
    try {
      const balancesResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/organization/${process.env.NEXT_PUBLIC_ORG_ID}/balance`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const fetchedBalances = balancesResponse.data as Balance[];

      const defaultBalances: Balance[] = [
        { package: "0", units: "0" },
        { package: "0", units: "0" },
        { package: "0", units: "0" },
        { package: "0", units: "0" },
      ];

      const combinedBalances = defaultBalances.map((item, index) => fetchedBalances[index] || item);
      setLoading(false);
      setBalances(combinedBalances);
    } catch (error) {
      console.error("Error fetching balances data:", error);
      setLoading(false);
    }
  };

  const convertToLocalDateTime = (datetime: string) => {
    const date = new Date(datetime);
    return date.toLocaleString();
  };

  const fetchRechargeData = async () => {
    try {
      const rechargeResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/organization/${process.env.NEXT_PUBLIC_ORG_ID}/recharge/list`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const fetchedRechargeData = rechargeResponse.data.map((item: any) => ({
        id: item.id,
        expireson: convertToLocalDateTime(item.expireson),
        startDate: convertToLocalDateTime(item.expireson), // Change to start date
        package: item.package,
        units: item.units,
        status: item.status,
      }));

      setRechargeData(fetchedRechargeData);
      setLoadingData(false);
    } catch (error) {
      console.error("Error fetching recharge data:", error);
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (loadingToken) {
      fetchToken();
    }
    if (!loadingToken && token) {
      fetchBalances();
      fetchRechargeData();
    }
  }, [loadingToken]);

  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rechargeData);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Units");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
    const excelBlob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });
    const url = URL.createObjectURL(excelBlob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "data_units.xlsx");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:ml-64 h-screen">
      <div className="p-4 h-full rounded-lg dark:border-gray-700">
        <div className="flex flex-col h-full">
          <div className="p-8">
            <p className="m-1 font-semibold text-lg">Data Bundle Balance</p>
          </div>

          <div className="grid grid-cols-4 gap-4 p-8">
            {loading ? (
              <p>Loading...</p>
            ) : (
              balances.map((balance, index) => (
                <div key={index} className="border-1 shadow-sm rounded-lg p-6 flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-gray-500">{balance.package} MBs</div>
                    <div>
                      <span>
                        <Image
                          style={{ color: "#F58426" }}
                          className="w-12 h-12 rounded-lg"
                          width={60}
                          height={60}
                          src={`/images/Icon-${index % 4}.svg`}
                          blurDataURL="/bluriconloader.png"
                          placeholder="blur"
                          alt="Icon"
                          priority
                        />
                      </span>
                    </div>
                  </div>
                  <div className="text-2xl font-bold">{balance.units} Units</div>
                </div>
              ))
            )}
          </div>

          <div className="flex flex-col">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <p className="mt-4 font-medium text-lg">Data Units</p>
                <div className="ml-auto flex space-x-4">
                  <PeakSearch filterOptions={filterOptions} selectedFilter="" />
                  <PeakButton
                    buttonText="Request Data Units"
                    icon={AddIcon}
                    className="bg-[#090A29] text-gray-100 text-sm rounded-[2px] px-2 shadow-sm outline-none"
                    onClick={openModal}
                  />
                  <PeakButton
                    buttonText="Export"
                    icon={IosShareIcon}
                    className="rounded-[2px] border-2 text-sm px-2 py-1 shadow-sm outline-none"
                    onClick={exportToExcel}
                  />
                </div>
              </div>
                
              <div className="mt-4">
                <div style={{ width: "100%" }}>
                  {loadingData ? <p>Loading...</p> : 
                  <DataGrid
                    rows={rechargeData}
                    columns={columns}
                    sx={{
                      "& .MuiDataGrid-columnHeader": {
                        backgroundColor: "#F1F2F3",
                      },
                      "&.MuiDataGrid-root": {
                        border: "none",
                      },
                    }}
                  />}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {isModalOpen && <RequestUnitsModal closeModal={closeModal} onRequest={refreshPage} />}
    </div>
  );
};

export default DataUnits;
