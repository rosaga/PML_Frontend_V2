import React, { useState, useEffect } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Button } from '@mui/material';

export default function AirtimeFaqs() {
  const [expanded, setExpanded] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const handleShowMore = () => {
    setShowMore(!showMore);
  };

  return (
    <div>
      <Accordion
        expanded={expanded === "panel1"}
        onChange={handleChange("panel1")}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1bh-content"
          id="panel1bh-header"
        >
          <Typography sx={{ color: "text.secondary" }}>
          What is the Airtime Rewards platform, and how does it work?
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
          Our platform allows businesses to purchase airtime in bulk and distribute it to employees, customers, or partners instantly.
          You can upload contact lists, set amounts, and send airtime in just a few clicks.
          </Typography>
        </AccordionDetails>
      </Accordion>
      <Accordion
        expanded={expanded === "panel2"}
        onChange={handleChange("panel2")}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel2bh-content"
          id="panel2bh-header"
        >
          <Typography sx={{ color: "text.secondary" }}>
          How do I top up my account to buy airtime?
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
          You can fund your account through mobile money, bank transfers, or card payments. Your airtime balance will be updated once payment is confirmed.
          </Typography>
        </AccordionDetails>
      </Accordion>
      <Accordion
        expanded={expanded === "panel3"}
        onChange={handleChange("panel3")}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel3bh-content"
          id="panel3bh-header"
        >
          <Typography sx={{ color: "text.secondary" }}>
          Can I send airtime to multiple contacts at once?
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
          Yes, the platform supports bulk airtime distribution, allowing you to send to hundreds in one transaction.
          </Typography>
        </AccordionDetails>
      </Accordion>
      <Accordion
        expanded={expanded === "panel4"}
        onChange={handleChange("panel4")}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel4bh-content"
          id="panel4bh-header"
        >

          <Typography sx={{ color: "text.secondary" }}>
          Is there a minimum or maximum amount of airtime I can send?
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
          You can send from as little as 10sh worth of airtime to as much as 5000
          </Typography>
        </AccordionDetails>
      </Accordion>
      <Accordion
        expanded={expanded === "panel5"}
        onChange={handleChange("panel5")}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel5bh-content"
          id="panel5bh-header"
        >
          <Typography sx={{ color: "text.secondary" }}>
          Can I integrate the airtime rewards system with my own platform?
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
          Yes, we offer an API that allows businesses to automate airtime disbursement within their own systems, CRMs, or apps.
          </Typography>
        </AccordionDetails>
      </Accordion>
      <Accordion
        expanded={expanded === "panel6"}
        onChange={handleChange("panel6")}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel6bh-content"
          id="panel6bh-header"
        >

          <Typography sx={{ color: "text.secondary" }}>
          What happens if a transaction fails?
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
          If an airtime transaction fails due to an invalid number or network issue, the system will attempt a retry. If it remains unsuccessful, the airtime is refunded to your account
          </Typography>
        </AccordionDetails>
      </Accordion>
      <Accordion
        expanded={expanded === "panel7"}
        onChange={handleChange("panel7")}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel7bh-content"
          id="panel7bh-header"
        >
          <Typography sx={{ color: "text.secondary" }}>
          How long does it take for the airtime to be received?
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
          Airtime is usually delivered instantly or within a few minutes, depending on the recipient's network.
          </Typography>
        </AccordionDetails>
      </Accordion>
      <Accordion
        expanded={expanded === "panel8"}
        onChange={handleChange("panel8")}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel8bh-content"
          id="panel8bh-header"
        >

          <Typography sx={{ color: "text.secondary" }}>
          Is there an option for automated recurring airtime rewards?
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
          Yes, you can set up automated disbursements to reward employees, customers, or agents at regular intervals (e.g., weekly, monthly).
          </Typography>
        </AccordionDetails>
      </Accordion>
     

      {showMore && (
        <>
      
      </>
      )}
      <Button onClick={handleShowMore} variant="contained" sx={{ marginTop: 2 , backgroundColor: "#F58426", alignContent: "centre"}}>
        {showMore ? "Show Less" : "Load More"}
      </Button>
    </div>
  );
}
