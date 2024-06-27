import * as React from "react";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

export default function Faqs() {
  const [expanded, setExpanded] = React.useState(false);

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
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
          <Typography sx={{ width: "33%", flexShrink: 0 }}>Peak</Typography>
          <Typography sx={{ color: "text.secondary" }}>
            What is Peak all about?
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            Peak is a data rewards platform that enables businesses to sign in
            and award their contacts with various rewards. It helps companies
            incentivize their contacts and enhance engagement through a
            streamlined reward distribution system.
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
          <Typography sx={{ width: "33%", flexShrink: 0 }}>Users</Typography>
          <Typography sx={{ color: "text.secondary" }}>
            Who can use Peak?
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            Peak is designed for businesses of all sizes that want to reward
            their contacts, whether they are customers, clients, or employees
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
          <Typography sx={{ width: "33%", flexShrink: 0 }}>Peak</Typography>
          <Typography sx={{ color: "text.secondary" }}>
            How does Peak work?
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            Businesses sign up on the platform, import their contact lists, and
            creates reward campaigns. Contacts can then be awarded based on the
            campaign criteria set by the business.
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
          <Typography sx={{ width: "33%", flexShrink: 0 }}>
            Information
          </Typography>
          <Typography sx={{ color: "text.secondary" }}>
            What information do I need to provide during sign-up?
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            You will need to provide your business name, email address, and a
            password. Additional steps, such as email verification, is required
            to fully activate your account.
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
          <Typography sx={{ width: "33%", flexShrink: 0 }}>Contacts</Typography>
          <Typography sx={{ color: "text.secondary" }}>
            How do I import my contacts ?
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            You can import your contacts by uploading a CSV or excel file,
            integrating with your CRM system, or manually adding contact Numbers
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
          <Typography sx={{ width: "33%", flexShrink: 0 }}>
            Campaigns
          </Typography>
          <Typography sx={{ color: "text.secondary" }}>
            Can I customize the reward campaigns?
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            Yes, Peak allows you to fully customize your reward campaigns. You
            can set specific criteria for awarding points, choose from different
            types of rewards, and personalize messages sent to your contacts.
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
          <Typography sx={{ width: "33%", flexShrink: 0 }}>Help</Typography>
          <Typography sx={{ color: "text.secondary" }}>
            What should I do if I encounter technical issues?
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            If you encounter any technical issues, you can reach out to our
            support team through the -Help- section on the platform, or email us
            at support@peak.co.ke. We also have a comprehensive help center with
            articles and tutorials.
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
          <Typography sx={{ width: "33%", flexShrink: 0 }}>
            Data Security
          </Typography>
          <Typography sx={{ color: "text.secondary" }}>
            Is my data secure on Peak?
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            Yes, Peak takes data security very seriously. We use advanced
            encryption and security protocols to ensure your data is safe and
            protected.
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
          <Typography sx={{ width: "33%", flexShrink: 0 }}>
            Payment Methods
          </Typography>
          <Typography sx={{ color: "text.secondary" }}>
            What payment methods does Peak accept?
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            Peak accepts major credit cards, including Visa, MasterCard, and
            Mpesa. Other payment methods may be available depending on your
            region.
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
          <Typography sx={{ width: "33%", flexShrink: 0 }}>Support</Typography>
          <Typography sx={{ color: "text.secondary" }}>
            How can I contact Peak support?
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            You can contact Peak support by emailing support@peak.co.ke or
            through the live chatbot available on our website during business
            hours.
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
          <Typography sx={{ width: "33%", flexShrink: 0 }}>Contacts</Typography>
          <Typography sx={{ color: "text.secondary" }}>
            How do I import my contacts ?
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            You can import your contacts by uploading a CSV or excel file,
            integrating with your CRM system, or manually adding contact Numbers
          </Typography>
        </AccordionDetails>
      </Accordion>
      <Accordion
        expanded={expanded === "panel12"}
        onChange={handleChange("panel12")}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel12bh-content"
          id="panel12bh-header"
        >
          <Typography sx={{ width: "33%", flexShrink: 0 }}>
            Purchase of Data
          </Typography>
          <Typography sx={{ color: "text.secondary" }}>
            How can I purchase data bundles for my contacts?
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            To purchase data bundles, navigate to the -Rewards- section of your
            dashboard, select -Data Units- , choose the desired bundle type, and
            specify the contact or group of contacts to receive the bundle.
          </Typography>
        </AccordionDetails>
      </Accordion>



      <Accordion
        expanded={expanded === "panel13"}
        onChange={handleChange("panel13")}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel13bh-content"
          id="panel13bh-header"
        >
          <Typography sx={{ width: "33%", flexShrink: 0 }}>Data Bundles</Typography>
          <Typography sx={{ color: "text.secondary" }}>
          What types of data bundles are available on Peak?

          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
          Peak offers a variety of data bundles to suit different needs. These include 20MB, 100MB, 500MB, 1GB which customers can use for various digital services such as internet browsing, streaming, and social media usage. 

          </Typography>
        </AccordionDetails>
      </Accordion>
      <Accordion
        expanded={expanded === "panel14"}
        onChange={handleChange("panel14")}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel14bh-content"
          id="panel14bh-header"
        >
          <Typography sx={{ width: "33%", flexShrink: 0 }}>Data Expiry</Typography>
          <Typography sx={{ color: "text.secondary" }}>
          Are there any expiration dates for the data bundles?

          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
          Yes, All data bundles typically have an expiration date. The data bundles on Peak expire within 60 days from the date of contacts issuance. 

          </Typography>
        </AccordionDetails>
      </Accordion>
      <Accordion
        expanded={expanded === "panel15"}
        onChange={handleChange("panel15")}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel15bh-content"
          id="panel15bh-header"
        >
          <Typography sx={{ width: "33%", flexShrink: 0 }}>Vouchers</Typography>
          <Typography sx={{ color: "text.secondary" }}>
          Can I create custom vouchers for my business?

          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
          Yes, Peak allows businesses to create custom vouchers tailored to your specific needs. This vouchers can be printed and distributed allowing customers to redeem data bundles. 

          </Typography>
        </AccordionDetails>
      </Accordion>
      <Accordion
        expanded={expanded === "panel16"}
        onChange={handleChange("panel16")}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel16bh-content"
          id="panel16bh-header"
        >
          <Typography sx={{ width: "33%", flexShrink: 0 }}>
            Vouchers
          </Typography>
          <Typography sx={{ color: "text.secondary" }}>
          How do I distribute vouchers to my contacts?

          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
          To distribute vouchers, go to the -Rewards- section, select -Vouchers-, choose the type of voucher you want to send, enter the contact details, and complete the purchase. Vouchers can be sent directly to the contacts email or mobile number

          </Typography>
        </AccordionDetails>
      </Accordion>
      <Accordion
        expanded={expanded === "panel17"}
        onChange={handleChange("panel17")}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel17bh-content"
          id="panel17bh-header"
        >
          <Typography sx={{ width: "33%", flexShrink: 0 }}>Contacts</Typography>
          <Typography sx={{ color: "text.secondary" }}>
            How do I import my contacts ?
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            You can import your contacts by uploading a CSV or excel file,
            integrating with your CRM system, or manually adding contact Numbers
          </Typography>
        </AccordionDetails>
      </Accordion>
      <Accordion
        expanded={expanded === "panel18"}
        onChange={handleChange("panel18")}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel18bh-content"
          id="panel18bh-header"
        >
          <Typography sx={{ width: "33%", flexShrink: 0 }}>
            Vouchers
          </Typography>
          <Typography sx={{ color: "text.secondary" }}>
          Can I print vouchers directly through the platform?

          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
          Yes, our platform allows you to print vouchers directly through the platform. Once you create the vouchers using your purchased data Units, you will have the option to download and print them for physical distribution.

          </Typography>
        </AccordionDetails>
      </Accordion>
      <Accordion
        expanded={expanded === "panel19"}
        onChange={handleChange("panel19")}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel19bh-content"
          id="panel19bh-header"
        >
          <Typography sx={{ width: "33%", flexShrink: 0 }}>Vouchers</Typography>
          <Typography sx={{ color: "text.secondary" }}>
          How can I ensure my contacts receive their vouchers?

          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
          Peak provides reliable delivery options for vouchers, including email and SMS. You can also monitor the delivery status and confirmation of receipt through the platform.

          </Typography>
        </AccordionDetails>
      </Accordion>
      <Accordion
        expanded={expanded === "panel20"}
        onChange={handleChange("panel20")}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel20bh-content"
          id="panel20bh-header"
        >
          <Typography sx={{ width: "33%", flexShrink: 0 }}>
Vouchers          </Typography>
          <Typography sx={{ color: "text.secondary" }}>
          Can I set up automated voucher distribution?

          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
          Yes, Peak offers automation features that allow you to set up rules for automatic voucher distribution based on specific triggers or events, such as achieving milestones, completing surveys, or other engagement activitie

          </Typography>
        </AccordionDetails>
      </Accordion>
      <Accordion
        expanded={expanded === "panel21"}
        onChange={handleChange("panel21")}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel21bh-content"
          id="panel21bh-header"
        >
          <Typography sx={{ width: "33%", flexShrink: 0 }}>
            Data Bundles
          </Typography>
          <Typography sx={{ color: "text.secondary" }}>
          What are the benefits of using data bundles as rewards?

          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
          Data bundles are a versatile and attractive reward option that can increase engagement and satisfaction among your contacts. They are especially valuable in regions with high mobile internet usage and can be used immediately, making them a practical and appreciated reward.

          </Typography>
        </AccordionDetails>
      </Accordion>
      <Accordion
        expanded={expanded === "panel22"}
        onChange={handleChange("panel22")}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel22bh-content"
          id="panel22bh-header"
        >
          <Typography sx={{ width: "33%", flexShrink: 0 }}>Messages</Typography>
          <Typography sx={{ color: "text.secondary" }}>
          Is there a complementary message sent to contacts when awarding them?

          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
          Yes, Peak automatically sends a complementary message to your contacts when they are awarded. This message includes details about the reward and how to redeem it. You can customize the message content to reflect and provide a personalized touch by clicking message icon before launching a campaign or reward.

          </Typography>
        </AccordionDetails>
      </Accordion>
      
    </div>
  );
}
