import React, { useState, useEffect } from "react";
import { DataGrid } from "@mui/x-data-grid";
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import { format, parseISO } from "date-fns";
import { useSession } from 'next-auth/react';
import { GetContacts } from "../../app/api/actions/contact/contact";

const RecipientDashboard = () => {
  let org_id = null;
  if (typeof window !== 'undefined') {
    org_id = localStorage.getItem('selectedAccountId');
  }

  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 4,
    page: 1,
  });
  const [total,setTotal] = useState(0)

  const getContacts = async () => {
    try {
      const res = await GetContacts(org_id, paginationModel.page + 1, paginationModel.pageSize); 
      if (!res.errors) {
        setTotal(res.data.count)
        setContacts(res.data.data);
        setLoading(false);
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    getContacts();
  }, [ paginationModel.page, org_id,total]);
  const columns = [
    {
      field: "created_at",
      headerName: "Date of Onboarding",
      flex: 1,
      valueFormatter: (params) => {
        try {
          const date = parseISO(params);
          return format(date, "yyyy-MM-dd HH:mm");
        } catch (error) {
          return "Invalid Date";
        }
      },
    },
    { field: "mobile_no", headerName: "Phone Number", flex: 1 },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
      renderCell: (params) => {
        const getColor = (status) => {
          switch (status) {
            case "ACTIVE":
              return "green";
            case "Inactive":
              return "red";
            default:
              return "black";
          }
        };

        return (
          <span style={{ color: getColor(params.value) }}>{params.value}</span>
        );
      },
    },
    {
      field: "Action",
      headerName: "Action",
      flex: 0,
      renderCell: (params) => <DeleteIcon />,
    },
  ];

  return (
    <div className="mt-4">
      <div style={{ width: "100%" }}>
        <DataGrid
          rows={contacts}
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
  );
};

export default RecipientDashboard;