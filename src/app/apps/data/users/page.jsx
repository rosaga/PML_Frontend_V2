"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import Box from "@mui/material/Box";
import { DataGrid, GridRowsProp, GridColDef, GridToolbar } from "@mui/x-data-grid";
import Button from "@mui/material/Button";
import IosShareIcon from "@mui/icons-material/IosShare";
import AddIcon from "@mui/icons-material/Add";
import PeakButton from "../../../../components/button/button";
import PeakSearch from "../../../../components/search/search";
import InviteUserModal from "../../../../components/modal/inviteUser";
import apiUrl from "../../../api/utils/apiUtils/apiUrl";
import { getToken } from "@/utils/auth";
import { getUserInfo } from "@/utils/decodeToken";
import CircularProgress from "@mui/material/CircularProgress";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const getOrganizationCreatorEmail = (organization) => {
  const creator =
    organization?.created_by ||
    organization?.createdby ||
    organization?.createdBy ||
    organization?.creator_email ||
    organization?.creatorEmail ||
    organization?.creator ||
    organization?.owner;

  const creatorEmail =
    typeof creator === "string" ? creator : creator?.email;

  return creatorEmail?.includes("@") ? creatorEmail : null;
};

const Users = () => {
  let org_id = null;
  let token = null;
  let currentUserEmail = "";
  if (typeof window !== "undefined") {
    org_id = localStorage.getItem("selectedAccountId");
    token = getToken();
    currentUserEmail = getUserInfo(token)?.email?.trim().toLowerCase() || "";
  }

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useState({});
  const [isOrganizationCreator, setIsOrganizationCreator] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState(null);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const filterOptions = [
    { value: "ilike__firstName", label: "First Name" },
    { value: "ilike__lastName", label: "Last Name" },
    { value: "ilike__email", label: "Email" },
  ];

  const handleSearch = (filter, value) => {
    setSearchParams({ [filter]: value });
  };

  const handleClearSearch = () => {
    setSearchParams({});
  };

  useEffect(() => {
    fetchUsers();
  }, [isModalOpen, searchParams]);

  useEffect(() => {
    fetchOrganizationCreator();
  }, []);

  const fetchOrganizationCreator = async () => {
    try {
      const response = await axios.get(apiUrl.GET_ACCOUNTS, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const organizations = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];
      const selectedOrganization = organizations.find((organization) => {
        const organizationId =
          organization.id || organization.external_id || organization.externalId;

        return String(organizationId) === String(org_id);
      });
      const creatorEmail = getOrganizationCreatorEmail(selectedOrganization)
        ?.trim()
        .toLowerCase();

      if (!currentUserEmail || !creatorEmail) {
        setIsOrganizationCreator(null);
        return;
      }

      setIsOrganizationCreator(
        Boolean(currentUserEmail && creatorEmail === currentUserEmail)
      );
    } catch (error) {
      console.error("Error fetching organization creator:", error);
      setIsOrganizationCreator(null);
    }
  };

  const fetchUsers = async () => {
    let usersUrl = `${apiUrl.USERS}/${org_id}/users?page=1&size=20&orderby=id DESC`;

    if (searchParams) {
      const searchParamsString = new URLSearchParams(searchParams).toString();
      usersUrl += `&${searchParamsString}`;
    }

    try {
      const usersResponse = await axios.get(usersUrl, {
        headers: {
          Accept: "application/json",
          "content-type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const users = usersResponse.data.data.map((user) => ({
        id: user.id,
        first_name: user.firstName,
        last_name: user.lastName,
        email: user.email,
        verified: user.emailVerified,
      }));

      setRows(users);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching users data:", error);
      setLoading(false);
    }
  };

  const openDeleteModal = (user) => {
    setUserToDelete(user);
  };

  const closeDeleteModal = () => {
    if (deletingUserId === null) {
      setUserToDelete(null);
    }
  };

  const deleteUser = async () => {
    if (!userToDelete) return;

    const userId = userToDelete.id;
    setDeletingUserId(userId);

    try {
      const response = await axios.delete(
        `${apiUrl.USERS}/users/${encodeURIComponent(userId)}`,
        {
          headers: {
            "X-Organization-ID": org_id,
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 204) {
        setRows((currentRows) =>
          currentRows.filter((user) => user.id !== userId)
        );
        setUserToDelete(null);
        toast.success("User removed from the organization.", {
          containerId: "user-removal",
        });
      } else {
        toast.error("Failed to remove user", {
          containerId: "user-removal",
        });
      }
    } catch (error) {
      const status = error.response?.status;

      if (status === 403) {
        setUserToDelete(null);
        setIsOrganizationCreator(false);
        toast.error("Only the organization creator can remove users.", {
          containerId: "user-removal",
        });
      } else if (status === 404) {
        setUserToDelete(null);
        await fetchUsers();
        toast.error("Organization or member was not found.", {
          containerId: "user-removal",
        });
      } else {
        toast.error(error.response?.data?.error || "Failed to remove user", {
          containerId: "user-removal",
        });
      }
    } finally {
      setDeletingUserId(null);
    }
  };

  const columns = [
    { field: "first_name", headerName: "First Name", flex: 1, minWidth: 150 },
    { field: "last_name", headerName: "Last Name", flex: 1, minWidth: 150 },
    { field: "email", headerName: "Email", flex: 1, minWidth: 200 },
    { field: "verified", headerName: "Verified", flex: 1, minWidth: 150 },
    {
      field: "actions",
      headerName: "Actions",
      width: 100,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => {
        const isCurrentUser =
          params.row.email?.trim().toLowerCase() === currentUserEmail;

        if (isOrganizationCreator === false || isCurrentUser) return null;

        return (
          <Tooltip title="Remove user">
            <IconButton
              aria-label={`Remove ${params.row.email}`}
              color="error"
              size="small"
              onClick={() => openDeleteModal(params.row)}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        );
      },
    },
  ];

  return (
    <div className="p-4 lg:ml-64 h-screen ">
      <ToastContainer containerId="user-removal" />
      <div className="flex flex-col h-full">
        <div className="flex flex-col">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <p className="mt-4 font-medium text-lg">Users</p>
              <div className="ml-auto flex space-x-4">
                <PeakSearch
                  filterOptions={filterOptions}
                  selectedFilter=""
                  onSearch={handleSearch}
                  onClearSearch={handleClearSearch}
                />
                <PeakButton
                  buttonText="Invite User"
                  icon={AddIcon}
                  className="bg-[#090A29] text-gray-100 text-sm rounded-[2px] px-2 shadow-sm outline-none"
                  onClick={openModal}
                />
              </div>
            </div>

            <div className="mt-4">
              <div style={{ height: 350, width: "100%" }}>
                {loading ? (
                  <Box className="flex justify-center items-center h-full">
                    <CircularProgress style={{ color: "#E88A17" }} />
                  </Box>
                ) : (
                  <DataGrid
                    rows={rows}
                    columns={columns}
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
      {isModalOpen && <InviteUserModal closeModal={closeModal} />}
      {userToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-user-title"
          className="fixed inset-0 z-50 flex h-screen w-full items-center justify-center bg-black bg-opacity-50"
        >
          <div className="w-full max-w-md p-4">
            <div className="rounded-lg bg-white shadow">
              <div className="flex items-center justify-between border-b p-4">
                <h3
                  id="delete-user-title"
                  className="text-xl font-semibold text-gray-900"
                >
                  Remove User
                </h3>
                <button
                  type="button"
                  aria-label="Close confirmation"
                  disabled={deletingUserId !== null}
                  onClick={closeDeleteModal}
                  className="text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  ✕
                </button>
              </div>
              <div className="p-6">
                <p className="text-gray-900">
                  Are you sure you want to remove {userToDelete.email} from this
                  organization?
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  This removes their access to this organization. Their
                  account and access to other organizations will remain.
                </p>
                <div className="mt-6 flex space-x-2">
                  <button
                    type="button"
                    disabled={deletingUserId !== null}
                    onClick={closeDeleteModal}
                    className="w-full rounded-lg bg-gray-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={deletingUserId !== null}
                    onClick={deleteUser}
                    className="flex w-full items-center justify-center rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deletingUserId !== null ? (
                      <>
                        <CircularProgress
                          size={18}
                          color="inherit"
                          className="mr-2"
                        />
                        Deleting...
                      </>
                    ) : (
                      "Delete User"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
