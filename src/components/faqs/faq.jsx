import React, { useState, useEffect } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Button } from '@mui/material';

export default function Faqs() {
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
            What is Peak Bulk Data Platform?
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
          Peak Bulk Data Platform  provides you with a unified solution to manage customer rewards or incentives specifically mobile data.
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
          How do I get started?
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
          Getting started is simple. Register on app.peakmobile.co.ke with your email and password
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
          How do I disburse Mobile Data?
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
        <Typography>
          1. Log into your account.<br />
          2. Top up your account with Data Units.<br />
          3. Upload the list of contacts you want to reward.<br />
          4. Choose the data bundle you would like to disburse.<br />
          The data will be sent directly to your contacts&apos; mobile numbers in less than 2 seconds!
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
          How much Mobile Data can I disburse?
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
          You can disburse mobile data from as low as  10MB to upto 10GB.
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
          Does the Mobile Data expire?
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
          Bulk data on your account expires 90 days after purchase, while mobile data disbursed to a customer&apos;s number is valid for 30 days.
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
          How much does it cost?
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
          We offer tiered pricing based on data volume, starting at Ksh 0.19 per MB. For example, 1GB = 1000 * 0.19 = Ksh 190. Contact our sales team at chat@peakmobile.co.ke for a custom quote.
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
          Is it free to use the platform?
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
          Yes. We only charge you for the Mobile data you will distribute.
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
          Is my customer data safe?
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
          Yes. We use secure cloud hosting, advanced authentication, and comply with data protection regulations to ensure the safety and privacy of your data.
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
          What types of businesses can benefit from using the Peak Bulk Data Platform?
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
          Our platform is perfect for businesses seeking customer acquisition or retention, and for IT/HR managers to equip their field teams with mobile data. 
          </Typography>
        </AccordionDetails>
      </Accordion>

      {showMore && (
        <>
     
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
          Can I integrate Peak Bulk Data Platform with my existing systems
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
          Yes. We have built APIs that allow you to integrate into our Bulk Data platform
          </Typography>
        </AccordionDetails>
      </Accordion>
      <Accordion
        expanded={expanded === "panel11"}
        onChange={handleChange("panel11")}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel11bh-content"
          id="panel11bh-header"
        >
          <Typography sx={{ color: "text.secondary" }}>
          What should I do if I encounter technical issues?
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
          You can reach out to us on support@peakmobile.co.ke
          </Typography>
        </AccordionDetails>
      </Accordion>
      </>
      )}
      <Button onClick={handleShowMore} variant="contained" sx={{ marginTop: 2 , backgroundColor: "#F58426", alignContent: "centre"}}>
        {showMore ? "Show Less" : "Load More"}
      </Button>
    </div>
  );
}
