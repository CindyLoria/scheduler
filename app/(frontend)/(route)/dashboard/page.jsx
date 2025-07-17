"use client";
import React, { useEffect, useState } from "react";
import { BarChart } from "@mui/x-charts/BarChart";
import { Table, message, Layout } from "antd";
import { FaBookmark, FaDownload, FaUser } from "react-icons/fa";
import DashboardCard from "../../(component)/DashboardCard";

const Dashboard = () => {
  const [data, setData] = useState({
    totalDosen: 0,
    totalUnduh: 0,
    totalJadwal: 0
  });
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/dashboard');
        if (!response.ok) throw new Error('Failed to fetch data');
        const result = await response.json();
        
        // Ensure we have default values if any data is missing
        setData({
          totalDosen: result.totalDosen || 0,
          totalUnduh: result.totalUnduh || 0,
          totalJadwal: result.totalJadwal || 0
        });
      } catch (error) {
        message.error('Gagal memuat data dashboard');
        console.error(error);
        // Set default values on error
        setData({
          totalDosen: 0,
          totalUnduh: 0,
          totalJadwal: 0
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  
  return (
    <>
      <div className="flex justify-between w-full gap-8 mb-12">
        <div className="w-1/3">
          <DashboardCard
            title={"Total Dosen"}
            icon={<FaUser />}
            content={loading ? "Loading..." : data.totalDosen.toString()}
            bgColor={"bg-pink-500"}
          />
        </div>
        <div className="w-1/3">
          <DashboardCard
            title={"Total Unduh"}
            icon={<FaDownload />}
            content={"0"}
            bgColor={"bg-green-500"}
          />
        </div>
        <div className="w-1/3">
          <DashboardCard
            title={"Total Jadwal"}
            icon={<FaBookmark />}
            content={loading ? "Loading..." : data.totalJadwal.toString()}
            bgColor={"bg-gray-800"}
          />
        </div>
      </div>

      <BarChart
        className="w-full"
        series={[
          { data: [35, 44, 24, 34] },
          { data: [51, 6, 49, 30] },
          { data: [15, 25, 30, 50] },
          { data: [60, 50, 15, 25] },
        ]}
        height={290}
        xAxis={[{ data: ["Q1", "Q2", "Q3", "Q4"], scaleType: "band" }]}
        margin={{ top: 10, bottom: 30, left: 40, right: 10 }}
      />
    </>
  );
};

export default Dashboard

