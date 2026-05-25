"use client";

import { useState } from "react";
import {
  CreditCard,
  Eye,
  EyeOff,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Copy,
  Lock,
  Unlock,
  RefreshCw,
  ShoppingBag,
  Utensils,
  Fuel,
  Wifi,
  MoreHorizontal,
  CheckCircle,
  X,
} from "lucide-react";

/* ─── Mock data ─────────────────────────────────────────── */
const cards = [
  {
    id: "1",
    label: "WePay Visa",
    number: "4291 •••• •••• 8847",
    fullNumber: "4291 5523 7741 8847",
    expiry: "09/27",
    cvv: "•••",
    fullCvv: "392",
    balance: 5240.0,
    currency: "ZMW",
    type: "VISA",
    gradient:
      "linear-gradient(135deg, #1a1f36 0%, #2d3561 50%, #1a1f36 100%)",
    active: true,
  },
];

const transactions = [
  {
    id: "1",
    merchant: "Shoprite Lusaka",
    category: "shopping",
    amount: -320.0,
    date: "Today, 10:42 AM",
    status: "completed",
  },
  {
    id: "2",
    merchant: "Salary Credit",
    category: "income",
    amount: 8500.0,
    date: "Today, 08:00 AM",
    status: "completed",
  },
  {
    id: "3",
    merchant: "KFC Manda Hill",
    category: "food",
    amount: -185.0,
    date: "Yesterday",
    status: "completed",
  },
];

export default function VirtualCardPage() {
  const [activeCard] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [cardLocked, setCardLocked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fundAmount, setFundAmount] = useState("");

  const card = cards[activeCard];

  function copyNumber() {
    if (typeof navigator === "undefined") return;

    navigator.clipboard.writeText(card.fullNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const totalIn = transactions
    .filter((t) => t.amount > 0)
    .reduce((s, t) => s + t.amount, 0);

  const totalOut = transactions
    .filter((t) => t.amount < 0)
    .reduce((s, t) => s + Math.abs(t.amount), 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-[#1a1f36]">
            Virtual Cards
          </h1>
          <p className="text-gray-500 text-sm">
            Manage your cards
          </p>
        </div>

        <button className="bg-[#1a1f36] text-white px-4 py-2 rounded-full flex items-center gap-2">
          <Plus size={16} /> Fund
        </button>
      </div>

      {/* CARD */}
      <div
        className="rounded-3xl p-6 text-white shadow-xl relative overflow-hidden"
        style={{ background: card.gradient }}
      >
        <div className="flex justify-between mb-6">
          <span className="font-bold">VISA</span>
          <Wifi size={18} />
        </div>

        <p className="text-sm opacity-70">Card Number</p>
        <p className="font-mono tracking-widest text-lg">
          {showDetails ? card.fullNumber : card.number}
        </p>

        <div className="flex justify-between mt-6 text-sm">
          <div>
            <p className="opacity-60">Holder</p>
            <p>{card.label}</p>
          </div>
          <div>
            <p className="opacity-60">Expiry</p>
            <p>{card.expiry}</p>
          </div>
          <div>
            <p className="opacity-60">CVV</p>
            <p>{showDetails ? card.fullCvv : card.cvv}</p>
          </div>
        </div>

        {cardLocked && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-3xl">
            <Lock />
          </div>
        )}
      </div>

      {/* BALANCE */}
      <div className="bg-white p-4 rounded-xl shadow">
        <p className="text-gray-500 text-sm">Balance</p>
        <p className="text-xl font-bold">
          ZMW {card.balance.toLocaleString()}
        </p>
      </div>

      {/* ACTIONS */}
      <div className="grid grid-cols-4 gap-3">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="p-3 bg-white rounded-xl"
        >
          {showDetails ? <EyeOff /> : <Eye />}
        </button>

        <button onClick={copyNumber} className="p-3 bg-white rounded-xl">
          {copied ? <CheckCircle /> : <Copy />}
        </button>

        <button
          onClick={() => setCardLocked(!cardLocked)}
          className="p-3 bg-white rounded-xl"
        >
          {cardLocked ? <Unlock /> : <Lock />}
        </button>

        <button className="p-3 bg-white rounded-xl">
          <RefreshCw />
        </button>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-100 p-4 rounded-xl">
          <p>Money In</p>
          <p className="font-bold">
            +ZMW {totalIn.toLocaleString()}
          </p>
        </div>

        <div className="bg-red-100 p-4 rounded-xl">
          <p>Money Out</p>
          <p className="font-bold">
            -ZMW {totalOut.toLocaleString()}
          </p>
        </div>
      </div>

      {/* TRANSACTIONS */}
      <div className="bg-white rounded-xl p-4">
        <h2 className="font-bold mb-3">Transactions</h2>

        {transactions.map((tx) => (
          <div
            key={tx.id}
            className="flex justify-between py-2 border-b"
          >
            <div>
              <p className="font-semibold">{tx.merchant}</p>
              <p className="text-xs text-gray-400">{tx.date}</p>
            </div>

            <p
              className={
                tx.amount > 0 ? "text-green-600" : "text-red-600"
              }
            >
              ZMW {tx.amount}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}