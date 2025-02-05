import React from "react";
import Button from "@mui/material/Button";
import IosShareIcon from "@mui/icons-material/IosShare";

const DownloadAllButton = ({ fetchAllData, filename }: { fetchAllData: () => Promise<any[]>, filename: string }) => {
  
  const downloadAllData = async () => {
    const allData = await fetchAllData(); // Fetch all data dynamically
    if (!allData.length) {
      alert("No data available to download.");
      return;
    }

    const csvRows = [];

    // Add headers
    const headers = Object.keys(allData[0] || {});
    csvRows.push(headers.join(","));

    // Add data rows
    allData.forEach((row) => {
      const values = headers.map((header) => `"${row[header] || ""}"`);
      csvRows.push(values.join(","));
    });

    // Create a Blob and trigger download
    const csvData = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(csvData);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename || "data.csv";
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Button
      variant="outlined"
      color="primary"
      size="small"
      startIcon={<IosShareIcon />}
      onClick={downloadAllData}
      style={{ marginLeft: "8px" }}
    >
      Download All
    </Button>
  );
};

export default DownloadAllButton;
