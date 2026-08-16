import "../../components/dashboard/App.css";
import "maplibre-gl/dist/maplibre-gl.css";

export const metadata = {
  title: "ClimaLenz Dashboard",
  description: "Operational Climate Intelligence",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen w-screen overflow-hidden text-slate-100 bg-[#060911]">
      {children}
    </div>
  );
}
