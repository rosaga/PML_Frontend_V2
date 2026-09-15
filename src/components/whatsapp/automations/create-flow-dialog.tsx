"use client";

import React, { useState } from "react";
import { useConfig } from "@/lib/whatsapp/config-context";
import { FLOWBOT_BASE_URL, flowbotHeaders } from "@/lib/whatsapp/flowbot-api";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/whatsapp/ui/alert-dialog";
import { Button } from "@/components/whatsapp/ui/button";
import { Input } from "@/components/whatsapp/ui/input";
import { Label } from "@/components/whatsapp/ui/label";
import { Textarea } from "@/components/whatsapp/ui/textarea";
import { cn } from "@/lib/whatsapp/utils";
import { ArrowLeft, FileText, MessageSquare, List, GitBranch, Zap, HelpCircle, Calendar, ClipboardList, ShoppingCart } from "lucide-react";

interface FlowTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  nodes: Array<{
    name: string;
    node_type: "TEXT" | "LIST" | "ROUTE" | "NUMBER";
    header_text_template: { language: string; text: string };
    backend_enabled: boolean;
    exit_enabled: boolean;
    extra_data: { position: { x: number; y: number }; options?: { value: string; target_index?: number }[] };
    parent_index?: number;
    created_by: string;
    updated_by: string;
  }>;
}

const TEMPLATES: FlowTemplate[] = [
  {
    id: "blank",
    name: "Blank",
    description: "Start from scratch with an empty canvas",
    icon: <FileText className="w-6 h-6" />,
    nodes: [],
  },
  {
    id: "greeting",
    name: "Welcome Message",
    description: "A simple greeting that collects the customer's name",
    icon: <MessageSquare className="w-6 h-6" />,
    nodes: [
      {
        name: "Welcome",
        node_type: "TEXT",
        header_text_template: { language: "en", text: "Hello! Welcome. How can we help you today?" },
        backend_enabled: false,
        exit_enabled: false,
        extra_data: { position: { x: 100, y: 100 } },
        created_by: "",
        updated_by: "",
      },
      {
        name: "Get Name",
        node_type: "TEXT",
        header_text_template: { language: "en", text: "Please enter your full name:" },
        backend_enabled: false,
        exit_enabled: false,
        extra_data: { position: { x: 420, y: 100 } },
        parent_index: 0,
        created_by: "",
        updated_by: "",
      },
      {
        name: "Thank You",
        node_type: "TEXT",
        header_text_template: { language: "en", text: "Thank you! A team member will be in touch shortly." },
        backend_enabled: false,
        exit_enabled: true,
        extra_data: { position: { x: 740, y: 100 } },
        parent_index: 1,
        created_by: "",
        updated_by: "",
      },
    ],
  },
  {
    id: "menu",
    name: "Menu / Options",
    description: "Present a list of options and route based on selection",
    icon: <List className="w-6 h-6" />,
    nodes: [
      {
        name: "Menu",
        node_type: "ROUTE",
        header_text_template: { language: "en", text: "Please select an option:" },
        backend_enabled: false,
        exit_enabled: false,
        extra_data: {
          position: { x: 100, y: 150 },
          options: [
            { value: "Account Balance", target_index: 1 },
            { value: "Apply for Loan", target_index: 2 },
          ],
        },
        created_by: "",
        updated_by: "",
      },
      {
        name: "Account Balance",
        node_type: "TEXT",
        header_text_template: { language: "en", text: "Your account balance is being retrieved..." },
        backend_enabled: true,
        exit_enabled: false,
        extra_data: { position: { x: 420, y: 50 } },
        parent_index: 0,
        created_by: "",
        updated_by: "",
      },
      {
        name: "Loan Application",
        node_type: "NUMBER",
        header_text_template: { language: "en", text: "Enter the loan amount you wish to apply for:" },
        backend_enabled: false,
        exit_enabled: false,
        extra_data: { position: { x: 420, y: 230 } },
        parent_index: 0,
        created_by: "",
        updated_by: "",
      },
    ],
  },
  {
    id: "survey",
    name: "Survey / Feedback",
    description: "Collect customer feedback with rating and comments",
    icon: <HelpCircle className="w-6 h-6" />,
    nodes: [
      {
        name: "Intro",
        node_type: "TEXT",
        header_text_template: { language: "en", text: "We'd love your feedback! This will take less than a minute." },
        backend_enabled: false,
        exit_enabled: false,
        extra_data: { position: { x: 100, y: 100 } },
        created_by: "",
        updated_by: "",
      },
      {
        name: "Rating",
        node_type: "NUMBER",
        header_text_template: { language: "en", text: "Rate your experience from 1 (poor) to 5 (excellent):" },
        backend_enabled: false,
        exit_enabled: false,
        extra_data: { position: { x: 420, y: 100 } },
        parent_index: 0,
        created_by: "",
        updated_by: "",
      },
      {
        name: "Comments",
        node_type: "TEXT",
        header_text_template: { language: "en", text: "Any additional comments? (Type 'skip' to skip)" },
        backend_enabled: false,
        exit_enabled: false,
        extra_data: { position: { x: 740, y: 100 } },
        parent_index: 1,
        created_by: "",
        updated_by: "",
      },
      {
        name: "Thank You",
        node_type: "TEXT",
        header_text_template: { language: "en", text: "Thank you for your feedback! We really appreciate it." },
        backend_enabled: false,
        exit_enabled: true,
        extra_data: { position: { x: 1060, y: 100 } },
        parent_index: 2,
        created_by: "",
        updated_by: "",
      },
    ],
  },
  {
    id: "lead",
    name: "Lead Capture",
    description: "Capture lead details: name, phone and interest",
    icon: <Zap className="w-6 h-6" />,
    nodes: [
      {
        name: "Greeting",
        node_type: "TEXT",
        header_text_template: { language: "en", text: "Hi there! Thanks for reaching out. Let us get a few details." },
        backend_enabled: false,
        exit_enabled: false,
        extra_data: { position: { x: 100, y: 100 } },
        created_by: "",
        updated_by: "",
      },
      {
        name: "Full Name",
        node_type: "TEXT",
        header_text_template: { language: "en", text: "What is your full name?" },
        backend_enabled: false,
        exit_enabled: false,
        extra_data: { position: { x: 420, y: 100 } },
        parent_index: 0,
        created_by: "",
        updated_by: "",
      },
      {
        name: "Phone Number",
        node_type: "NUMBER",
        header_text_template: { language: "en", text: "What is your phone number?" },
        backend_enabled: false,
        exit_enabled: false,
        extra_data: { position: { x: 740, y: 100 } },
        parent_index: 1,
        created_by: "",
        updated_by: "",
      },
      {
        name: "Interest",
        node_type: "LIST",
        header_text_template: { language: "en", text: "What are you interested in?\n1. Product Demo\n2. Pricing\n3. Partnership" },
        backend_enabled: false,
        exit_enabled: false,
        extra_data: { position: { x: 1060, y: 100 } },
        parent_index: 2,
        created_by: "",
        updated_by: "",
      },
      {
        name: "Confirmation",
        node_type: "TEXT",
        header_text_template: { language: "en", text: "Great! Our team will contact you shortly." },
        backend_enabled: true,
        exit_enabled: true,
        extra_data: { position: { x: 1380, y: 100 } },
        parent_index: 3,
        created_by: "",
        updated_by: "",
      },
    ],
  },
  {
    id: "hotel-booking",
    name: "Hotel Booking",
    description: "Room booking flow: dates, room type, guest info and payment",
    icon: <Calendar className="w-6 h-6" />,
    nodes: [
      {
        name: "Main Menu",
        node_type: "LIST",
        header_text_template: {
          language: "en",
          text: "Welcome to Paradise Hotel!\nI'd be happy to help you book your stay. What would you like to do?",
        },
        backend_enabled: false,
        exit_enabled: false,
        extra_data: {
          position: { x: 100, y: 100 },
          options: [
            { value: "Book a Room" },
            { value: "View Room Rates" },
            { value: "Book Conference" },
            { value: "Restaurant" },
          ],
        },
        created_by: "",
        updated_by: "",
      },
      {
        name: "Check-in Date",
        node_type: "TEXT",
        header_text_template: {
          language: "en",
          text: "Great! Let's find the perfect room for you.\nPlease enter your Check-in Date (e.g. 20 June 2026):",
        },
        backend_enabled: false,
        exit_enabled: false,
        extra_data: { position: { x: 420, y: 100 } },
        parent_index: 0,
        created_by: "",
        updated_by: "",
      },
      {
        name: "Check-out Date",
        node_type: "TEXT",
        header_text_template: {
          language: "en",
          text: "When would you like to check out?",
        },
        backend_enabled: false,
        exit_enabled: false,
        extra_data: { position: { x: 740, y: 100 } },
        parent_index: 1,
        created_by: "",
        updated_by: "",
      },
      {
        name: "Number of Guests",
        node_type: "LIST",
        header_text_template: {
          language: "en",
          text: "How many guests will be staying?",
        },
        backend_enabled: false,
        exit_enabled: false,
        extra_data: {
          position: { x: 1060, y: 100 },
          options: [
            { value: "1 Guest" },
            { value: "2 Guests" },
            { value: "3 Guests" },
            { value: "4+ Guests" },
          ],
        },
        parent_index: 2,
        created_by: "",
        updated_by: "",
      },
      {
        name: "Room Type",
        node_type: "LIST",
        header_text_template: {
          language: "en",
          text: "Available rooms for your dates:\n\nStandard Room – KES 6,000/night\nDeluxe Room – KES 9,500/night\nExecutive Suite – KES 15,000/night\nFamily Room – KES 18,000/night\n\nPlease select a room.",
        },
        backend_enabled: false,
        exit_enabled: false,
        extra_data: {
          position: { x: 1380, y: 100 },
          options: [
            { value: "Standard Room" },
            { value: "Deluxe Room" },
            { value: "Executive Suite" },
            { value: "Family Room" },
          ],
        },
        parent_index: 3,
        created_by: "",
        updated_by: "",
      },
      {
        name: "Special Requests",
        node_type: "LIST",
        header_text_template: {
          language: "en",
          text: "Do you have any special requests?",
        },
        backend_enabled: false,
        exit_enabled: false,
        extra_data: {
          position: { x: 1700, y: 100 },
          options: [
            { value: "Airport Pickup" },
            { value: "Special Meals" },
            { value: "Baby Cot" },
            { value: "No Special Requests" },
          ],
        },
        parent_index: 4,
        created_by: "",
        updated_by: "",
      },
      {
        name: "Guest Name",
        node_type: "TEXT",
        header_text_template: {
          language: "en",
          text: "Please provide your full name:",
        },
        backend_enabled: false,
        exit_enabled: false,
        extra_data: { position: { x: 2020, y: 100 } },
        parent_index: 5,
        created_by: "",
        updated_by: "",
      },
      {
        name: "Phone Number",
        node_type: "NUMBER",
        header_text_template: {
          language: "en",
          text: "Please provide your phone number:",
        },
        backend_enabled: false,
        exit_enabled: false,
        extra_data: { position: { x: 2340, y: 100 } },
        parent_index: 6,
        created_by: "",
        updated_by: "",
      },
      {
        name: "Payment Method",
        node_type: "LIST",
        header_text_template: {
          language: "en",
          text: "How would you like to pay?",
        },
        backend_enabled: false,
        exit_enabled: false,
        extra_data: {
          position: { x: 2660, y: 100 },
          options: [
            { value: "M-Pesa" },
            { value: "Card Payment" },
            { value: "Pay at Hotel" },
          ],
        },
        parent_index: 7,
        created_by: "",
        updated_by: "",
      },
      {
        name: "Booking Confirmed",
        node_type: "TEXT",
        header_text_template: {
          language: "en",
          text: "Your reservation has been successfully created!\n\nA confirmation message has been sent to your phone.\n\nWhat would you like to do next?\n1. Make Another Reservation\n2. Contact Reception\n3. Exit",
        },
        backend_enabled: true,
        exit_enabled: true,
        extra_data: { position: { x: 2980, y: 100 } },
        parent_index: 8,
        created_by: "",
        updated_by: "",
      },
    ],
  },
  {
    id: "post-purchase-survey",
    name: "Post-Purchase Survey",
    description: "Collect post-purchase feedback: experience, staff, NPS score and open comments",
    icon: <ClipboardList className="w-6 h-6" />,
    nodes: [
      {
        name: "Survey Intro",
        node_type: "ROUTE",
        header_text_template: {
          language: "en",
          text: "Thank you for shopping with us today!\n\nWe'd love to hear about your experience. The survey takes less than 1 minute.\n\nWould you like to participate?\n1. Yes\n2. No",
        },
        backend_enabled: false,
        exit_enabled: false,
        extra_data: {
          position: { x: 100, y: 150 },
          options: [
            { value: "Yes", target_index: 1 },
            { value: "No", target_index: 7 },
          ],
        },
        created_by: "",
        updated_by: "",
      },
      {
        name: "Overall Experience",
        node_type: "LIST",
        header_text_template: {
          language: "en",
          text: "How would you rate your shopping experience today?",
        },
        backend_enabled: false,
        exit_enabled: false,
        extra_data: {
          position: { x: 420, y: 100 },
          options: [
            { value: "Excellent" },
            { value: "Good" },
            { value: "Average" },
            { value: "Poor" },
            { value: "Very Poor" },
          ],
        },
        parent_index: 0,
        created_by: "",
        updated_by: "",
      },
      {
        name: "Product Availability",
        node_type: "LIST",
        header_text_template: {
          language: "en",
          text: "Were you able to find everything you were looking for?",
        },
        backend_enabled: false,
        exit_enabled: false,
        extra_data: {
          position: { x: 740, y: 100 },
          options: [
            { value: "Yes, everything" },
            { value: "Most items" },
            { value: "Items unavailable" },
          ],
        },
        parent_index: 1,
        created_by: "",
        updated_by: "",
      },
      {
        name: "Staff Service",
        node_type: "LIST",
        header_text_template: {
          language: "en",
          text: "How would you rate the helpfulness of our staff?",
        },
        backend_enabled: false,
        exit_enabled: false,
        extra_data: {
          position: { x: 1060, y: 100 },
          options: [
            { value: "Excellent" },
            { value: "Good" },
            { value: "Average" },
            { value: "Poor" },
            { value: "Very Poor" },
          ],
        },
        parent_index: 2,
        created_by: "",
        updated_by: "",
      },
      {
        name: "Store Cleanliness",
        node_type: "LIST",
        header_text_template: {
          language: "en",
          text: "How satisfied were you with the cleanliness and organization of the store?",
        },
        backend_enabled: false,
        exit_enabled: false,
        extra_data: {
          position: { x: 1380, y: 100 },
          options: [
            { value: "Very Satisfied" },
            { value: "Satisfied" },
            { value: "Neutral" },
            { value: "Dissatisfied" },
            { value: "Very Dissatisfied" },
          ],
        },
        parent_index: 3,
        created_by: "",
        updated_by: "",
      },
      {
        name: "NPS Score",
        node_type: "NUMBER",
        header_text_template: {
          language: "en",
          text: "How likely are you to recommend us to friends and family?\n\n0 = Not Likely at All\n10 = Extremely Likely\n\nPlease enter a score from 0-10.",
        },
        backend_enabled: false,
        exit_enabled: false,
        extra_data: { position: { x: 1700, y: 100 } },
        parent_index: 4,
        created_by: "",
        updated_by: "",
      },
      {
        name: "Open Feedback",
        node_type: "TEXT",
        header_text_template: {
          language: "en",
          text: "Is there anything we can do to improve your experience?\n\nType your feedback below.",
        },
        backend_enabled: false,
        exit_enabled: false,
        extra_data: { position: { x: 2020, y: 100 } },
        parent_index: 5,
        created_by: "",
        updated_by: "",
      },
      {
        name: "Thank You",
        node_type: "TEXT",
        header_text_template: {
          language: "en",
          text: "Thank you for your feedback! We really appreciate your time.\n\nWould you like to:\n1. Continue Shopping\n2. View Current Offers\n3. Exit",
        },
        backend_enabled: false,
        exit_enabled: true,
        extra_data: { position: { x: 2340, y: 100 } },
        parent_index: 6,
        created_by: "",
        updated_by: "",
      },
    ],
  },
  {
    id: "supermarket-order",
    name: "Supermarket Order",
    description: "Full order flow: browse products, checkout, and M-Pesa payment",
    icon: <ShoppingCart className="w-6 h-6" />,
    nodes: [
      // ── Node 0: Main Menu (ROUTE → 1, 10, 12, 14) ──
      {
        name: "Main Menu",
        node_type: "ROUTE",
        header_text_template: {
          language: "en",
          text: "Welcome to PeakMart Supermarket!\nHow can I help you today?",
        },
        backend_enabled: false,
        exit_enabled: false,
        extra_data: {
          position: { x: 100, y: 300 },
          options: [
            { value: "Shop Products", target_index: 1 },
            { value: "Today's Offers", target_index: 10 },
            { value: "Track My Order", target_index: 12 },
            { value: "Customer Care", target_index: 14 },
          ],
        },
        created_by: "",
        updated_by: "",
      },
      // ── Shopping path: nodes 1-9 ──
      {
        name: "Product Categories",
        node_type: "LIST",
        header_text_template: {
          language: "en",
          text: "Great! What would you like to shop for today?",
        },
        backend_enabled: false,
        exit_enabled: false,
        extra_data: {
          position: { x: 420, y: 100 },
          options: [
            { value: "Dairy & Eggs" },
            { value: "Bread & Bakery" },
            { value: "Fruits & Vegetables" },
            { value: "Meat & Poultry" },
          ],
        },
        parent_index: 0,
        created_by: "",
        updated_by: "",
      },
      {
        name: "Product Selection",
        node_type: "LIST",
        header_text_template: {
          language: "en",
          text: "Fresh produce available today:\n\nAvocado - KES 30 each\nTomatoes - KES 120/kg\nPotatoes - KES 80/kg\nBananas - KES 150/dozen\n\nWhat would you like to add to your cart?",
        },
        backend_enabled: false,
        exit_enabled: false,
        extra_data: {
          position: { x: 740, y: 100 },
          options: [
            { value: "Avocado" },
            { value: "Tomatoes" },
            { value: "Potatoes" },
            { value: "Bananas" },
          ],
        },
        parent_index: 1,
        created_by: "",
        updated_by: "",
      },
      {
        name: "Quantity",
        node_type: "NUMBER",
        header_text_template: {
          language: "en",
          text: "How many would you like?",
        },
        backend_enabled: false,
        exit_enabled: false,
        extra_data: { position: { x: 1060, y: 100 } },
        parent_index: 2,
        created_by: "",
        updated_by: "",
      },
      {
        name: "Cart Actions",
        node_type: "LIST",
        header_text_template: {
          language: "en",
          text: "Item added to cart!\n\nWhat would you like to do next?",
        },
        backend_enabled: false,
        exit_enabled: false,
        extra_data: {
          position: { x: 1380, y: 100 },
          options: [
            { value: "Continue Shopping" },
            { value: "View Cart" },
            { value: "Checkout" },
          ],
        },
        parent_index: 3,
        created_by: "",
        updated_by: "",
      },
      {
        name: "Delivery Method",
        node_type: "LIST",
        header_text_template: {
          language: "en",
          text: "How would you like to receive your order?",
        },
        backend_enabled: false,
        exit_enabled: false,
        extra_data: {
          position: { x: 1700, y: 100 },
          options: [
            { value: "Home Delivery" },
            { value: "Store Pickup" },
          ],
        },
        parent_index: 4,
        created_by: "",
        updated_by: "",
      },
      {
        name: "Delivery Address",
        node_type: "TEXT",
        header_text_template: {
          language: "en",
          text: "Please share your delivery location:",
        },
        backend_enabled: false,
        exit_enabled: false,
        extra_data: { position: { x: 2020, y: 100 } },
        parent_index: 5,
        created_by: "",
        updated_by: "",
      },
      {
        name: "Payment Method",
        node_type: "LIST",
        header_text_template: {
          language: "en",
          text: "How would you like to pay?",
        },
        backend_enabled: false,
        exit_enabled: false,
        extra_data: {
          position: { x: 2340, y: 100 },
          options: [
            { value: "Pay via M-Pesa" },
            { value: "Pay on Delivery" },
          ],
        },
        parent_index: 6,
        created_by: "",
        updated_by: "",
      },
      {
        name: "M-Pesa Number",
        node_type: "NUMBER",
        header_text_template: {
          language: "en",
          text: "Please enter your M-Pesa number:",
        },
        backend_enabled: false,
        exit_enabled: false,
        extra_data: { position: { x: 2660, y: 100 } },
        parent_index: 7,
        created_by: "",
        updated_by: "",
      },
      {
        name: "Order Confirmed",
        node_type: "TEXT",
        header_text_template: {
          language: "en",
          text: "STK Push sent to your M-Pesa number.\n\nOnce payment is confirmed, we'll prepare your order.\n\nThank you for shopping with PeakMart!",
        },
        backend_enabled: true,
        exit_enabled: true,
        extra_data: { position: { x: 2980, y: 100 } },
        parent_index: 8,
        created_by: "",
        updated_by: "",
      },
      // ── Offers branch: nodes 10-11 ──
      {
        name: "Today's Offers",
        node_type: "LIST",
        header_text_template: {
          language: "en",
          text: "Here are today's special offers:\n\nBuy 2 Loaves of Bread, Get 1 Free\n2L Fresh Milk – KES 180 (Save KES 40)\nCooking Oil 5L – KES 850 (Save KES 150)\nSoda 500ml – Buy 2 Get 1 Free\n\nWhich offer would you like to explore?",
        },
        backend_enabled: false,
        exit_enabled: false,
        extra_data: {
          position: { x: 420, y: 350 },
          options: [
            { value: "Bread Offer" },
            { value: "Milk Offer" },
            { value: "Cooking Oil Offer" },
            { value: "Soda Offer" },
          ],
        },
        parent_index: 0,
        created_by: "",
        updated_by: "",
      },
      {
        name: "Offer Details",
        node_type: "TEXT",
        header_text_template: {
          language: "en",
          text: "Excellent choice!\n\nWould you like to add this offer to your cart?\n1. Yes – add to cart\n2. No – go back to offers",
        },
        backend_enabled: false,
        exit_enabled: true,
        extra_data: { position: { x: 740, y: 350 } },
        parent_index: 10,
        created_by: "",
        updated_by: "",
      },
      // ── Track Order branch: nodes 12-13 ──
      {
        name: "Track Order",
        node_type: "TEXT",
        header_text_template: {
          language: "en",
          text: "Please enter your Order Number:",
        },
        backend_enabled: false,
        exit_enabled: false,
        extra_data: { position: { x: 420, y: 570 } },
        parent_index: 0,
        created_by: "",
        updated_by: "",
      },
      {
        name: "Order Status",
        node_type: "TEXT",
        header_text_template: {
          language: "en",
          text: "Order Status:\n\nPayment Received\nPacking Complete\nOut for Delivery\n\nEstimated Arrival: 20 Minutes\n\nThank you for shopping with PeakMart!",
        },
        backend_enabled: true,
        exit_enabled: true,
        extra_data: { position: { x: 740, y: 570 } },
        parent_index: 12,
        created_by: "",
        updated_by: "",
      },
      // ── Customer Care branch: node 14 ──
      {
        name: "Customer Care",
        node_type: "TEXT",
        header_text_template: {
          language: "en",
          text: "Thank you for reaching out!\n\nOur customer care team will be in touch shortly.\n\nOperating hours: Mon–Sat, 8AM–6PM",
        },
        backend_enabled: false,
        exit_enabled: true,
        extra_data: { position: { x: 420, y: 790 } },
        parent_index: 0,
        created_by: "",
        updated_by: "",
      },
    ],
  },
];

interface CreateFlowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFlowCreated: (flowId: number, templateNodes: FlowTemplate["nodes"]) => void;
}

export function CreateFlowDialog({
  open,
  onOpenChange,
  onFlowCreated,
}: CreateFlowDialogProps) {
  const { organizationExternalId } = useConfig();
  const [step, setStep] = useState<"template" | "details">("template");
  const [selectedTemplate, setSelectedTemplate] = useState<FlowTemplate>(TEMPLATES[0]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: "", description: "" });

  const handleClose = () => {
    onOpenChange(false);
    setStep("template");
    setSelectedTemplate(TEMPLATES[0]);
    setFormData({ name: "", description: "" });
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      alert("Flow name is required");
      return;
    }
    if (!organizationExternalId) {
      alert("Organization ID not configured");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${FLOWBOT_BASE_URL}/flows`, {
        method: "POST",
        headers: flowbotHeaders,
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || selectedTemplate.description,
          type: "WHATSAPP",
          status: "DRAFT",
          organization_id: organizationExternalId,
        }),
      });

      if (!response.ok) throw new Error("Failed to create flow");

      // API returns 201 empty body — re-fetch to get the new ID
      const listResponse = await fetch(
        `${FLOWBOT_BASE_URL}/flows?eq__organization_id=${organizationExternalId}&page=1&size=1&orderby=created_at%20desc`,
        { headers: flowbotHeaders }
      );
      if (listResponse.ok) {
        const listData = await listResponse.json();
        const newFlow = (listData.results || [])[0];
        if (newFlow?.id) {
          handleClose();
          onFlowCreated(newFlow.id, selectedTemplate.nodes);
        }
      }
    } catch (err) {
      console.error("Failed to create flow:", err);
      alert("Failed to create flow. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {step === "template" ? "Choose a Template" : (
              <div className="flex items-center gap-2">
                <button onClick={() => setStep("template")} className="text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                Name your flow
              </div>
            )}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {step === "template"
              ? "Start from a template or build from scratch"
              : `Using template: ${selectedTemplate.name}`}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {step === "template" ? (
          <div className="grid grid-cols-2 gap-3 py-2 sm:grid-cols-3">
            {TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => {
                  setSelectedTemplate(tpl);
                  setFormData({ name: tpl.id === "blank" ? "" : tpl.name, description: "" });
                  setStep("details");
                }}
                className={cn(
                  "flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-colors hover:bg-accent hover:border-primary",
                  selectedTemplate.id === tpl.id && "border-primary bg-accent"
                )}
              >
                <div className="text-primary">{tpl.icon}</div>
                <div>
                  <p className="text-sm font-semibold">{tpl.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{tpl.description}</p>
                </div>
                {tpl.nodes.length > 0 && (
                  <span className="text-xs text-muted-foreground">{tpl.nodes.length} nodes</span>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="flow-name">Flow Name</Label>
              <Input
                id="flow-name"
                placeholder="e.g., Loan Application"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={loading}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="flow-desc">Description (Optional)</Label>
              <Textarea
                id="flow-desc"
                placeholder="Describe what this flow does..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={loading}
                rows={3}
              />
            </div>
          </div>
        )}

        <div className="flex gap-2 justify-end pt-2">
          <AlertDialogCancel onClick={handleClose} disabled={loading}>Cancel</AlertDialogCancel>
          {step === "details" && (
            <Button onClick={handleCreate} disabled={loading}>
              {loading ? "Creating..." : "Create Flow"}
            </Button>
          )}
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
