import { NextRequest, NextResponse } from "next/server";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { monthDateRange, slipCategoryLabels, slipPaymentMethodLabels } from "@/lib/slips";
import { hasSlipsAccess } from "@/lib/slips-auth";

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(request: NextRequest) {
  if (!hasSlipsAccess()) {
    return new NextResponse("Slips access required.", { status: 401 });
  }

  const month = request.nextUrl.searchParams.get("month") ?? "";
  const { start, end } = monthDateRange(month);
  const receipts = await prisma.slipReceipt.findMany({
    where: {
      receiptDate: {
        gte: start,
        lt: end,
      },
    },
    include: { items: true },
    orderBy: { receiptDate: "desc" },
  });

  const rows = [
    ["date", "merchant", "category", "paymentMethod", "totalAmount", "vatAmount", "capturedBy", "notes", "items"],
    ...receipts.map((receipt) => [
      formatDate(receipt.receiptDate),
      receipt.merchant,
      slipCategoryLabels[receipt.category],
      slipPaymentMethodLabels[receipt.paymentMethod],
      receipt.totalAmount.toFixed(2),
      receipt.vatAmount?.toFixed(2) ?? "",
      receipt.capturedBy ?? "",
      receipt.notes ?? "",
      receipt.items.map((item) => item.description).join("; "),
    ]),
  ];

  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="personal-slips-${month || "export"}.csv"`,
    },
  });
}
