// app/api/dashboard/route.js
import { NextResponse } from 'next/server';
import prisma from "../../lib/db";

export async function GET() {
  try {
    // Hitung total dosen
    const totalDosen = await prisma.lecturer.count();
    
    // Jika perlu data lain (totalUnduh dan totalJadwal), tambahkan query-nya di sini
    // const totalUnduh = await prisma.download.count();
    const totalJadwal = await prisma.schedule.count();
    
    return NextResponse.json({
      totalDosen,
      // totalUnduh,
      totalJadwal
    }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}