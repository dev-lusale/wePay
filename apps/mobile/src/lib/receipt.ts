import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { formatDateTime, formatZMW } from "./format";
import type { Transaction } from "./types";

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const TYPE_LABEL: Record<string, string> = {
  DISBURSEMENT: "Loan disbursement",
  REPAYMENT: "Loan repayment",
  FEE: "Fee",
};

/**
 * Builds a PDF record of a transaction exactly as stored on the server and
 * opens the Android share sheet. It is labelled as a statement of the
 * record — not a bank-issued payment confirmation.
 */
export async function shareTransactionReceipt(tx: Transaction, holder: string) {
  const html = `<!doctype html><html><head><meta charset="utf-8"/>
  <style>
    body{font-family:-apple-system,Roboto,Arial,sans-serif;color:#0B1F33;padding:32px}
    .brand{font-size:24px;font-weight:700}.brand span{color:#14C8C8}
    .amt{font-size:32px;font-weight:700;margin:24px 0 4px}
    table{width:100%;border-collapse:collapse;margin-top:24px}
    td{padding:10px 0;border-bottom:1px solid #E3E8EF;font-size:14px}
    td:first-child{color:#5D6B7E;width:40%}
    .note{margin-top:32px;font-size:11px;color:#93A0B1}
  </style></head><body>
  <div class="brand">We<span>Pay</span></div>
  <div style="color:#5D6B7E;margin-top:4px">Transaction record</div>
  <div class="amt">${esc(formatZMW(tx.amount))}</div>
  <div>${esc(TYPE_LABEL[tx.type] ?? tx.type)}</div>
  <table>
    <tr><td>Description</td><td>${esc(tx.description)}</td></tr>
    <tr><td>Date</td><td>${esc(formatDateTime(tx.createdAt))}</td></tr>
    <tr><td>Reference</td><td>${esc(tx.id)}</td></tr>
    <tr><td>Account holder</td><td>${esc(holder)}</td></tr>
  </table>
  <div class="note">Generated from your WePay account records on ${esc(formatDateTime(new Date()))}.</div>
  </body></html>`;
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: "Share receipt", UTI: "com.adobe.pdf" });
  }
}
