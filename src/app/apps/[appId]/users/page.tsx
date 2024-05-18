// Users.js
import React from "react";
import Box from "@mui/material/Box";
import { DataGrid, GridRowsProp, GridColDef } from "@mui/x-data-grid";
import {
  FormControl,
  InputAdornment,
  TextField,
  createStyles,
  makeStyles,
} from "@material-ui/core";
import SearchIcon from "@material-ui/icons/Search";

const Users = () => {
  const rows: GridRowsProp = [
    {
      id: 1,
      first_name: "Allan",
      last_name: "Oluoch",
      email: "allan@gmail.com",
    },
    {
      id: 2,
      first_name: "Richard",
      last_name: "Osaga",
      email: "osaga@gmail.com",
    },
    {
      id: 3,
      first_name: "Victor",
      last_name: "Siderra",
      email: "siderra@gmail.com",
    },
    {
      id: 3,
      first_name: "Ryan",
      last_name: "Ashiruma",
      email: "ashiruma@gmail.com",
    },
  ];

  const columns: GridColDef[] = [
    { field: "first_name", headerName: "First Name", flex: 1 },
    { field: "last_name", headerName: "Last Name", flex: 1 },
    { field: "email", headerName: "Email", flex: 1 },
  ];

  const data = [
    ["Allan", "Oluoch", "allan@gmail.com"],
    ["Richard", "Osaga", "osaga@gmail.com"],
    ["Victor", "Siderra", "siderra@gmail.com"],
    ["Ryan", "Ashiruma", "ashiruma@gmail.com"],
  ];

  //   const handleKeyDown = (event:any) => {
  //     if (event.key === 'Enter') {
  //     handleClick(event);
  // }};

  return (
    <div className="p-4 sm:ml-64 h-screen ">
      <div className="flex flex-col h-full">
        <div className="flex flex-col">
          <div className="p-4">
            <p className="mt-4 font-medium text-lg">Users</p>

            <div className="mt-4">
              <div style={{ height: 350, width: "100%" }}>
                <DataGrid
                  rows={rows}
                  columns={columns}
                  sx={{
                    "& .MuiDataGrid-columnHeader": {
                      backgroundColor: "#E5E4E2",
                    },
                    "&.MuiDataGrid-root": {
                      border: "none",
                    },
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Users;
