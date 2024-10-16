"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import Image from "next/image";
import { DataGrid, GridRowsProp, GridColDef , GridToolbar} from "@mui/x-data-grid";
import IosShareIcon from "@mui/icons-material/IosShare";
import AddIcon from "@mui/icons-material/Add";
import PeakButton from "../../../../components/button/button";
import PeakSearch from "../../../../components/search/search";
import RequestUnitsModal from "../../../../components/modal/requestUnits";
import * as XLSX from 'xlsx';
import { GetRecharges, GetBalance } from "@/app/api/actions/reward/reward";
import { format,parseISO } from "date-fns";
import { getToken } from "@/utils/auth";
import { hasRole } from "../../../../utils/decodeToken"
import apiUrl from "../../../api/utils/apiUtils/apiUrl"
import { ToastContainer, toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";


const DataUnits = () => {

  let org_id = null;
  let token = null;
  if (typeof window !== 'undefined') {
    org_id = localStorage.getItem('selectedAccountId');
    token = getToken();
  }
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [balances, setBalances] = useState([]);
  const [recharges, setRecharges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(true);
  const [isApproved, setIsApproved] = useState(false);
  const [total, setTotal] = useState(0);
  const [searchParams, setSearchParams] = useState({});

  const [columns, setColumns] = useState([]);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };
  const [paginationModel, setPaginationModel] = React.useState({
    pageSize: 10,
    page: 0,
  });

  const filterOptions = [
    { value: "ilike__created_by", label: "Created By" },
    { value: "eq__package", label: "Package" },
    { value: "eq__status", label: "Status" },
  ];

  const handleSearch = (filter, value) => {
    setSearchParams({ [filter]: value });
  };

  const handleClearSearch = () => {
    setSearchParams({});
  };


  const handleApprove = async (id) => {
    const approvalUrl = `${apiUrl.APPROVE_UNITS}/${id}`;
    try {
      const response = await axios.put(approvalUrl, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
  
      if (response.status === 202) {
        toast.success("APPROVE SUCCESS!!!");
        setIsApproved(true);
      } else {
        toast.error("APPROVE FAILED");
        setIsApproved(true);
      }
    } catch (error) {
      toast.error("APPROVE FAILED");
      setIsApproved(true);
    }
  };

 

  useEffect(() => {
    const baseColumns = [
      { field: "id", headerName: "Transaction Reference", flex: 1, minWidth: 150 },
      { field: "created_by", headerName: "Created By", flex: 1, minWidth:200 },
      {
        field: "expires_on",
        headerName: "End Date",
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
      { field: "package", headerName: "Data Bundle", flex: 1, minWidth: 150 },
      { field: "units", headerName: "Units", flex: 1, minWidth: 150 },
      {
        field: "status",
        headerName: "Status",
        flex: 1,
        minWidth: 150,
        renderCell: (params) => {
          const getStatusLabel = (status) => {
            switch (status) {
              case "APPROVED":
                return { label: "Approved", color: "green" };
              case "PENDING":
                return { label: "Pending", color: "orange" };
              default:
                return { label: status, color: "black" }; 
            }
          };

          const statusInfo = getStatusLabel(params.value);

          return <span style={{ color: statusInfo.color }}>{statusInfo.label}</span>;
        },
      },
    ];

    if (hasRole(token, 'SuperAdmin')) {
      baseColumns.push({
        field: "approve",
        headerName: "Review",
        flex: 1,
        minWidth: 150,
        renderCell: (params) => {
          if (params.row.status === 'PENDING') {
            return <button className="bg-green-400 text-white border-1 text-sm rounded-[2px] px-2 shadow-sm outline-none" onClick={() => handleApprove(params.row.id)}>Approve</button>;
          }else{
            return <button className="bg-gray-100 text-gray-600 text-sm rounded-[2px] px-2 shadow-sm outline-none" >Approved</button>;
          }
          return null;
        },
      });
    }

    setColumns(baseColumns);
  }, [token]);

  const refreshPage = () => {
    setIsModalOpen(false);
    setLoadingData(true);

  }

  

  async function fetchBalance() {
    const balanceData = await GetBalance(org_id);
    if (balanceData) {
      setBalances(balanceData.data.data);
    }
  }
  const getRecharges = async () => {
    try {
      const res = await GetRecharges(org_id, paginationModel.page+1, paginationModel.pageSize, searchParams);
      if (res.errors) {
        console.log("AN ERROR HAS OCCURRED");
      } else {
        setTotal(res.data.count);
        setRecharges(res.data.data);
        setLoading(false);
        setLoadingData(false);
      
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
      getRecharges();
      fetchBalance()
  }, [isModalOpen, org_id, isApproved, paginationModel.page, paginationModel.pageSize, searchParams]);

  return (
    <>
      <ToastContainer />
      <div className="p-4 sm:ml-64 h-screen">
        <div className="p-4 h-full rounded-lg dark:border-gray-700">
          <div className="flex flex-col h-full">
            <div className="p-8">
              <p className="m-1 font-semibold text-lg">Data Bundle Balance</p>
            </div>

            <div className="p-2">
              <div className="flex flex-wrap justify-left">
                {loading ? (
                  <p>Loading...</p>
                ) : (
                  balances.map((balance, index) => (
                    <div key={index} className="border-[1.5px] shadow-sm rounded-lg p-6 flex-shrink-0 w-60 m-2">
                      <div className="flex justify-between items-center mb-4">
                        <div className="text-gray-500">{balance.module} MBs</div>
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
            </div>

            <div className="flex flex-col">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <p className="mt-4 font-medium text-lg">Data Units</p>
                  <div className="ml-auto flex space-x-4">
                    <PeakSearch filterOptions={filterOptions} selectedFilter="" onSearch={handleSearch} onClearSearch={handleClearSearch} />
                    <PeakButton
                      buttonText="Request Data Units"
                      icon={AddIcon}
                      className="bg-[#090A29] text-gray-100 text-sm rounded-[2px] px-2 shadow-sm outline-none"
                      onClick={openModal}
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <div style={{ width: "100%" }}>
                    {loadingData ? (
                      <p>Loading...</p>
                    ) : (
                      <DataGrid
                        rows={recharges}
                        columns={columns}
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
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {isModalOpen && <RequestUnitsModal closeModal={refreshPage} />}
      </div>
    </>
  );
};
export default DataUnits;
