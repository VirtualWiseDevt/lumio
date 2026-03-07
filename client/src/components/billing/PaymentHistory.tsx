"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPaymentHistory } from "@/api/billing";
import { cn } from "@/lib/utils";
import type { PaymentStatus } from "@/types/billing";

const statusStyles: Record<PaymentStatus, string> = {
  SUCCESS: "bg-green-500/10 text-green-500",
  PENDING: "bg-yellow-500/10 text-yellow-500",
  FAILED: "bg-red-500/10 text-red-500",
  EXPIRED: "bg-white/10 text-white/40",
};

const PAGE_SIZE = 10;

export function PaymentHistory() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["payment-history", page],
    queryFn: () => getPaymentHistory(page, PAGE_SIZE),
  });

  const formatDate = (dateStr: string) =>
    new Intl.DateTimeFormat("en-KE", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(dateStr));

  if (isLoading) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">
          Payment History
        </h3>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-12 animate-pulse rounded-lg bg-white/5"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.payments.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">
          Payment History
        </h3>
        <p className="text-sm text-white/40">No payment history yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6">
      <h3 className="mb-4 text-lg font-semibold text-white">
        Payment History
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-white/50">
              <th className="pb-3 pr-4 font-medium">Date</th>
              <th className="pb-3 pr-4 font-medium">Amount</th>
              <th className="pb-3 pr-4 font-medium">Plan</th>
              <th className="pb-3 pr-4 font-medium">Receipt</th>
              <th className="pb-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.payments.map((payment) => (
              <tr
                key={payment.id}
                className="border-b border-white/5 text-white/80"
              >
                <td className="py-3 pr-4 whitespace-nowrap">
                  {formatDate(payment.createdAt)}
                </td>
                <td className="py-3 pr-4 whitespace-nowrap">
                  KES {payment.amount.toLocaleString()}
                </td>
                <td className="py-3 pr-4">{payment.plan.name}</td>
                <td className="py-3 pr-4 font-mono text-xs">
                  {payment.mpesaReceiptNumber || "-"}
                </td>
                <td className="py-3">
                  <span
                    className={cn(
                      "inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                      statusStyles[payment.status]
                    )}
                  >
                    {payment.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-lg px-3 py-1.5 text-sm text-white/60 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            Previous
          </button>
          <span className="text-sm text-white/40">
            Page {page} of {data.totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
            disabled={page >= data.totalPages}
            className="rounded-lg px-3 py-1.5 text-sm text-white/60 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
