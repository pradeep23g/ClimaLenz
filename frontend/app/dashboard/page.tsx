"use client";

import dynamic from "next/dynamic";

const DashboardApp = dynamic(
  () => import("../../components/dashboard/App"),
  { ssr: false } // Crucial for MapLibre
);

export default function DashboardPage() {
  return <DashboardApp />;
}
