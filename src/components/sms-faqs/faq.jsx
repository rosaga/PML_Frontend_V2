import React, { useState, useEffect } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Button } from '@mui/material';

export default function SMSFaqs() {
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
          What is the Bulk SMS platform, and how does it work?
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
          Our Bulk SMS platform allows businesses to send messages to multiple recipients instantly. You can compose messages, upload contacts, and schedule or send SMS campaigns through our web-based dashboard
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
          What formats can I use to upload my contact list?
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
          You can upload contacts in CSV, Excel, or manually enter numbers. Ensure the numbers are in the correct format (You can sue the template formarts provided on the platform).
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
          How do I purchase SMS credits?
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
          You can buy SMS credits through Mpesa, bank transfer, or card payments. Once payment is confirmed, SMS units will be added to your account instantly.
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
          How can I track the delivery of my messages?
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
          Our platform provides real-time delivery reports showing the status of each message—whether delivered, pending, or failed.
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
          Can I schedule SMS campaigns for later delivery?
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
          Yes, you can set a specific date and time for messages to be sent, allowing you to automate campaigns in advance.
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
          What sender ID will my messages display?
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
          You can apply for a custom sender ID to display your brand name instead of a phone number. Under settings click New Sender Id to register for a sender name.  
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
          Is there an API available for integration?
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
          Yes, we offer an API that allows businesses to integrate bulk SMS services into their applications, CRMs, or other systems.
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
          How many characters can I include in one SMS?
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
          A standard SMS contains 160 characters. If your message exceeds this limit, it will be split into multiple messages and charged accordingly.
          </Typography>
        </AccordionDetails>
      </Accordion>
      <Accordion
        expanded={expanded === "panel9"}
        onChange={handleChange("panel9")}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel9bh-content"
          id="panel9bh-header"
        >

          <Typography sx={{ color: "text.secondary" }}>
          Can I segment my contact list for targeted messaging?
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
          Yes, our platform allows you to create different contact groups based on customer data, making it easy to send targeted messages.
          </Typography>
        </AccordionDetails>
      </Accordion>
      <Accordion
        expanded={expanded === "panel10"}
        onChange={handleChange("panel10")}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel10bh-content"
          id="panel10bh-header"
        >
          <Typography sx={{ color: "text.secondary" }}>
          How secure is my data on the platform?
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
          We use encryption and secure servers to protect your data. We also comply with data protection regulations to ensure your information remains safe.
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
