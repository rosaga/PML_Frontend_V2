import React, { useState, useEffect } from "react";
import { DataGrid, GridRowsProp, GridColDef } from "@mui/x-data-grid";
import IosShareIcon from "@mui/icons-material/IosShare";
import AddIcon from "@mui/icons-material/Add";
import PeakButton from "../button/button";
import PeakSearch from "../search/search";
import RequestUnitsModal from "../modal/requestUnits";
import axios from "axios";
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import { format } from "date-fns";


const RecipientsTable = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(0); // Pagination state
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const fetchToken = async () => {
    try {
      const authResponse = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/public/token`, {
        username: process.env.NEXT_PUBLIC_USERNAME,
        password: process.env.NEXT_PUBLIC_PASSWORD,
      });

      const fetchedToken = authResponse.data.token;
      return fetchedToken;
    } catch (error) {
      console.error("Error fetching token:", error);
    }
  };

  const fetchData = async (page) => {
    setLoading(true);
    try {
      const token = await fetchToken();
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/organization/${process.env.NEXT_PUBLIC_ORG_ID}/contact/list`, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      const transformedData = response.data.map((item) => ({
        id: item.id,
        date: format(new Date(item.createdAt), "dd-MM-yyyy, h:mm a"),
        phone: item.mobile_no,
        status: item.status_id === "9" ? "Active" : "Inactive",
      }));
      setData(transformedData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(page);
  }, [page]);

  const filterOptions = [
    // { value: "eq__external_id", label: "" },
    { value: "ilike__first_name", label: "Date of Onboarding" },
    { value: "ilike__phone", label: "Phone Number" },
    { value: "ilike_status", label: "Status" },
    // { value: "ilike__first_name", label: "Units" },
    // { value: "ilike__last_name", label: "Status" },
  ];
  const columns = [
    { field: "date", headerName: "Date of Onboarding", flex: 1 },
    { field: "phone", headerName: "Phone Number", flex: 1 },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
      renderCell: (params) => {
        const getColor = (status) => {
          switch (status) {
            case "Active":
              return "green";
            case "Inactive":
              return "red";
            default:
              return "black"; // Default color if needed
          }
        };

        return (
          <span style={{ color: getColor(params.value) }}>{params.value}</span>
        );
      },
    },
    { field: "Action", headerName: "Action", flex: 0, renderCell: (params) => <DeleteIcon /> },
  ];

  return (
    <>
      {isModalOpen && <RequestUnitsModal closeModal={closeModal} />}
      <div className="flex items-center justify-between">
        <p className="mt-4 font-medium text-lg">All Contacts</p>
        <div className="ml-auto flex space-x-4">
          <PeakSearch filterOptions={filterOptions} selectedFilter="" />
          <PeakButton
            buttonText="Upload CSV File"
            icon={AddIcon}
            className="bg-[#090A29] text-gray-100 text-sm rounded-[2px] px-2 shadow-sm outline-none"
            onClick={openModal}
          />
          <PeakButton
            buttonText="New Contact"
            icon={AddIcon}
            className="bg-[#090A29] text-gray-100 text-sm rounded-[2px] px-2 shadow-sm outline-none"
            onClick={openModal}
          />
          <PeakButton
            buttonText="Export"
            icon={IosShareIcon}
            className="rounded-[2px] border-2 text-sm px-2 py-1 shadow-sm outline-none"
            onClick={openModal}
          />
        </div>
      </div>

      <div className="mt-4">
        <div style={{ width: "100%" }}>
          <DataGrid
            rows={data}
            columns={columns}
            loading={loading}
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
          />
        </div>
      </div>
    </>
  );
};

export default RecipientsTable;