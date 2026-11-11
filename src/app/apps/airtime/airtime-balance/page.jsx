"use client";
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Image from "next/image";
import { DataGrid, GridRowsProp, GridColDef , GridToolbar} from "@mui/x-data-grid";
import IosShareIcon from "@mui/icons-material/IosShare";
import AddIcon from "@mui/icons-material/Add";
import PeakButton from "../../../../components/button/button";
import PeakSearch from "../../../../components/search/search";
import RequestAirtimeUnitsModal from "../../../../components/modal/requestAirtime";
import * as XLSX from 'xlsx';
import { GetAirtimeRecharges } from "@/app/api/actions/airtimeReward/airtimeReward";
import { format, parseISO } from "date-fns";
import { getToken } from "@/utils/auth";
import { hasRole } from "../../../../utils/decodeToken"
import apiUrl from "../../../api/utils/apiUtils/apiUrl"
import { ToastContainer, toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
import { GetAirtimeAccounts } from "@/app/api/actions/airtimeReward/airtimeSettings";
import { useOrganizationQuery } from "@/lib/airtime/useOrganizationQuery";
import AirtimeThreshold from "@/components/airtime-rewards/airtimeThreshold";


const AirtimeBalance = () => {

  const token = typeof window !== "undefined" ? getToken() : null;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchParams, setSearchParams] = useState({});

  const [columns, setColumns] = useState([]);

  const [thresholdOpen, setThresholdOpen] = useState(false);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const [paginationModel, setPaginationModel] = React.useState({
    pageSize: 10,
    page: 0,
  });

  const filterOptions = [
    { value: "ilike__created_by", label: "Created By" },
    { value: "eq__units", label: "Units" },
    { value: "eq__status", label: "Status" },
  ];

  const handleSearch = (filter, value) => {
    setSearchParams({ [filter]: value });
  };

  const handleClearSearch = () => {
    setSearchParams({});
  };


  const loadAccounts = useCallback((id) => GetAirtimeAccounts(id), []);
  const accountQuery = useOrganizationQuery(loadAccounts, { events: "airtime-updated airtime-threshold-updated" });
  const account = accountQuery.data?.[0];
  const loadRecharges = useCallback(async (id) => {
    const response = await GetAirtimeRecharges(id, paginationModel.page + 1, paginationModel.pageSize, searchParams);
    if (response.errors) throw new Error(response.errors._error);
    return response.data;
  }, [paginationModel.page, paginationModel.pageSize, searchParams]);
  const rechargeQuery = useOrganizationQuery(loadRecharges, { events: "airtime-updated" });
  const recharges = rechargeQuery.data?.data || [];
  const total = rechargeQuery.data?.count || 0;
  const refreshRecharges = rechargeQuery.refresh;

  const handleApprove = useCallback(async (id) => {
    const approvalUrl = `${apiUrl.APPROVE_UNITS}/${id}`;
    try {
      const response = await axios.put(approvalUrl, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
  
      if (response.status === 202) {
        toast.success("APPROVE SUCCESS!!!");
        refreshRecharges();
      } else {
        toast.error("APPROVE FAILED");
        refreshRecharges();
      }
    } catch (error) {
      toast.error("APPROVE FAILED");
      refreshRecharges();
    }
  }, [token, refreshRecharges]);

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
      { field: "units", headerName: "Airtime Amount", flex: 1, minWidth: 150 },
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
          } else {
            return <button className="bg-gray-100 text-gray-600 text-sm rounded-[2px] px-2 shadow-sm outline-none" >Approved</button>;
          }
          return null;
        },
      });
    }

    setColumns(baseColumns);
  }, [token, handleApprove]);

  return (
    <>
      <ToastContainer />
      {thresholdOpen && <AirtimeThreshold threshold={account} closeModal={() => setThresholdOpen(false)} />}
      <div className="p-4 lg:ml-64 h-screen">
        <div className="p-4 h-full rounded-lg dark:border-gray-700">
          <div className="flex flex-col h-full">
            <div className="p-8">
              <p className="m-1 font-semibold text-lg">Airtime Balance</p>
            </div>

            {(accountQuery.error || rechargeQuery.error) && <p role="alert" className="text-red-500 px-4">{accountQuery.error || rechargeQuery.error}</p>}
            <div className="p-2">
              <div className="flex flex-wrap justify-left">
                {accountQuery.loading && !accountQuery.data ? (
                  <p>Loading...</p>
                ) : (
                    <div className="border-[1.5px] shadow-sm rounded-lg p-6 flex-shrink-0 w-60 m-2">
                      <div className="flex justify-between items-center mb-4">
                        <div className="text-gray-500">Balance</div>
                        <div>
                          <span>
                            <Image
                              style={{ color: "#F58426" }}
                              className="w-12 h-12 rounded-lg"
                              width={60}
                              height={60}
                              src={`/images/airtime.svg`}
                              blurDataURL="/bluriconloader.png"
                              placeholder="blur"
                              alt="Icon"
                              priority
                            />
                          </span>
                        </div>
                      </div>
                      {/* Updated balance: dynamic airtime balance fetched from the API */}
                      <div className="text-2xl font-bold">KES {account?.units ?? "—"}</div>
                      <p className="text-sm text-gray-500 mt-2">Alert threshold: {account ? Number(account.threshold) === 0 ? "Disabled" : `KES ${account.threshold ?? "—"}` : "—"}</p>
                      <button type="button" disabled={!account} onClick={() => setThresholdOpen(true)} className="mt-3 text-orange-600 underline text-sm disabled:opacity-50">Set notification threshold</button>
                    </div>
                )}
              </div>
            </div>

            <div className="flex flex-col">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <p className="mt-4 font-medium text-lg">Latest Requests</p>
                  <div className="ml-auto flex space-x-4">
                    <PeakSearch filterOptions={filterOptions} selectedFilter="" onSearch={handleSearch} onClearSearch={handleClearSearch} />
                    <PeakButton
                      buttonText="Request Airtime"
                      icon={AddIcon}
                      className="bg-[#090A29] text-gray-100 text-sm rounded-[2px] px-2 shadow-sm outline-none"
                      onClick={openModal}
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <div style={{ width: "100%" }}>
                    {rechargeQuery.loading && !rechargeQuery.data ? (
                      <p>Loading...</p>
                    ) : (
                      <DataGrid
                        rows={recharges}
                        loading={rechargeQuery.loading}
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
        {isModalOpen && <RequestAirtimeUnitsModal closeModal={() => { setIsModalOpen(false); accountQuery.refresh(); rechargeQuery.refresh(); }} />}
      </div>
    </>
  );
};
export default AirtimeBalance;
