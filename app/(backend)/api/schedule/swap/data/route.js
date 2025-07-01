// import prisma from "@/app/(backend)/lib/db";
// import { NextResponse } from "next/server";

// // PATCH: Swap schedule details between two schedules
// export async function PATCH(req) {
//   try {
//     const { scheduleId1, scheduleId2 } = await req.json(); // Read from request body

//     // Ensure both schedule IDs are provided
//     if (!scheduleId1 || !scheduleId2) {
//       return NextResponse.json(
//         { error: "Both scheduleId1 and scheduleId2 are required" },
//         { status: 400 }
//       );
//     }

//     const id1 = parseInt(scheduleId1);
//     const id2 = parseInt(scheduleId2);

//     // Fetch both schedules
//     const schedules = await prisma.schedule.findMany({
//       where: { id: { in: [id1, id2] } },
//     });

//     if (schedules.length !== 2) {
//       return NextResponse.json(
//         { error: "One or both schedules not found" },
//         { status: 404 }
//       );
//     }

//     const [schedule1, schedule2] = schedules;

//     // Swap schedule details using a transaction
//     await prisma.$transaction([
//       prisma.schedule.update({
//         where: { id: id1 },
//         data: {
//           scheduleDayId: schedule2.scheduleDayId,
//           classLecturerId: schedule2.classLecturerId,
//           scheduleSessionId: schedule2.scheduleSessionId,
//           roomId: schedule2.roomId,
//         },
//       }),
//       prisma.schedule.update({
//         where: { id: id2 },
//         data: {
//           scheduleDayId: schedule1.scheduleDayId,
//           classLecturerId: schedule1.classLecturerId,
//           scheduleSessionId: schedule1.scheduleSessionId,
//           roomId: schedule1.roomId,
//         },
//       }),
//     ]);

//     return NextResponse.json(
//       { message: "Schedules swapped successfully" },
//       { status: 200 }
//     );
//   } catch (error) {
//     console.error("Error swapping schedules:", error);
//     return NextResponse.json(
//       { error: "Something went wrong. Please try again later." },
//       { status: 500 }
//     );
//   }
// }

// import prisma from "@/app/(backend)/lib/db";
// import { NextResponse } from "next/server";

// export async function PATCH(req) {
//   try {
//     const { scheduleId1, scheduleId2 } = await req.json();

//     if (!scheduleId1 || !scheduleId2) {
//       return NextResponse.json(
//         { error: "Both scheduleId1 and scheduleId2 are required" },
//         { status: 400 }
//       );
//     }

//     const id1 = parseInt(scheduleId1);
//     const id2 = parseInt(scheduleId2);

//     // Validasi ID
//     if (isNaN(id1) || isNaN(id2)) {
//       return NextResponse.json(
//         { error: "Invalid schedule ID format" },
//         { status: 400 }
//       );
//     }

//     // Verifikasi schedule exist sebelum swap
//     const schedule1 = await prisma.schedule.findUnique({
//       where: { id: id1 },
//     });
//     const schedule2 = await prisma.schedule.findUnique({
//       where: { id: id2 },
//     });

//     if (!schedule1 || !schedule2) {
//       return NextResponse.json(
//         { error: "One or both schedules not found" },
//         { status: 404 }
//       );
//     }

//     // Lakukan swap dengan transaction
//     const result = await prisma.$transaction(async (prisma) => {
//       // Simpan data sementara
//       const temp = {
//         dayId: schedule1.scheduleDayId,
//         sessionId: schedule1.scheduleSessionId,
//         roomId: schedule1.roomId,
//       };

//       // Update schedule pertama dengan data schedule kedua
//       await prisma.schedule.update({
//         where: { id: id1 },
//         data: {
//           scheduleDayId: schedule2.scheduleDayId,
//           scheduleSessionId: schedule2.scheduleSessionId,
//           roomId: schedule2.roomId,
//         },
//       });

//       // Update schedule kedua dengan data sementara
//       await prisma.schedule.update({
//         where: { id: id2 },
//         data: {
//           scheduleDayId: temp.dayId,
//           scheduleSessionId: temp.sessionId,
//           roomId: temp.roomId,
//         },
//       });

//       return { success: true };
//     });

//     return NextResponse.json(
//       { 
//         message: "Schedules swapped successfully",
//         data: {
//           schedule1: { id: id1, newData: schedule2 },
//           schedule2: { id: id2, newData: schedule1 }
//         }
//       },
//       { status: 200 }
//     );
//   } catch (error) {
//     console.error("Error swapping schedules:", error);
//     return NextResponse.json(
//       { 
//         error: "Failed to swap schedules",
//         details: error.message 
//       },
//       { status: 500 }
//     );
//   }
// }

// app/(backend)/api/schedule/swap/data/route.js
import prisma from "@/app/(backend)/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(req) {
  try {
    const { scheduleId1, scheduleId2 } = await req.json();

    // Validasi input
    if (!scheduleId1 || !scheduleId2) {
      return NextResponse.json(
        { error: "Both schedule IDs are required" },
        { status: 400 }
      );
    }

    // Dapatkan data lengkap kedua jadwal
    const schedule1 = await prisma.schedule.findUnique({
      where: { id: parseInt(scheduleId1) },
      include: {
        classLecturer: {
          include: {
            primaryLecturer: true,
            secondaryLecturer: true,
            class: true
          }
        },
        scheduleDay: true,
        scheduleSession: true,
        room: true
      }
    });

    const schedule2 = await prisma.schedule.findUnique({
      where: { id: parseInt(scheduleId2) },
      include: {
        classLecturer: {
          include: {
            primaryLecturer: true,
            secondaryLecturer: true,
            class: true
          }
        },
        scheduleDay: true,
        scheduleSession: true,
        room: true
      }
    });

    // Validasi data
    if (!schedule1 || !schedule2) {
      return NextResponse.json(
        { error: "One or both schedules not found" },
        { status: 404 }
      );
    }

    // 1. Cek bentrok dosen (HANYA di hari yang sama)
    const checkLecturerConflict = async (lecturerId, dayId, sessionId, excludeId) => {
      if (!lecturerId) return false;
      
      const conflict = await prisma.schedule.findFirst({
        where: {
          NOT: { id: excludeId },
          scheduleDayId: dayId,
          scheduleSessionId: sessionId,
          classLecturer: {
            OR: [
              { primaryLecturerId: lecturerId },
              { secondaryLecturerId: lecturerId }
            ]
          }
        }
      });
      return conflict;
    };

    // Cek untuk semua dosen yang terlibat
    const lecturersToCheck = [
      { 
        id: schedule1.classLecturer.primaryLecturer?.id,
        name: schedule1.classLecturer.primaryLecturer?.lecturerName,
        newDay: schedule2.scheduleDayId,
        newSession: schedule2.scheduleSessionId
      },
      {
        id: schedule1.classLecturer.secondaryLecturer?.id,
        name: schedule1.classLecturer.secondaryLecturer?.lecturerName,
        newDay: schedule2.scheduleDayId,
        newSession: schedule2.scheduleSessionId
      },
      {
        id: schedule2.classLecturer.primaryLecturer?.id,
        name: schedule2.classLecturer.primaryLecturer?.lecturerName,
        newDay: schedule1.scheduleDayId,
        newSession: schedule1.scheduleSessionId
      },
      {
        id: schedule2.classLecturer.secondaryLecturer?.id,
        name: schedule2.classLecturer.secondaryLecturer?.lecturerName,
        newDay: schedule1.scheduleDayId,
        newSession: schedule1.scheduleSessionId
      }
    ];

    for (const lecturer of lecturersToCheck) {
      if (lecturer.id) {
        const conflict = await checkLecturerConflict(
          lecturer.id,
          lecturer.newDay,
          lecturer.newSession,
          lecturer.id === schedule1.classLecturer.primaryLecturer?.id ? 
            schedule1.id : schedule2.id
        );
        
        if (conflict) {
          return NextResponse.json(
            { 
              error: `Dosen ${lecturer.name} sudah memiliki jadwal di hari ${conflict.scheduleDay.day} sesi ${conflict.scheduleSession.sessionNumber}`,
              constraint: "lecturer_conflict"
            },
            { status: 400 }
          );
        }
      }
    }

    // 2. Cek kapasitas ruangan
    if (schedule1.classLecturer.class.classCapacity > schedule2.room.roomCapacity) {
      return NextResponse.json(
        { 
          error: `Ruangan ${schedule2.room.roomName} tidak cukup (Kapasitas: ${schedule2.room.roomCapacity}, Dibutuhkan: ${schedule1.classLecturer.class.classCapacity})`,
          constraint: "room_capacity"
        },
        { status: 400 }
      );
    }

    if (schedule2.classLecturer.class.classCapacity > schedule1.room.roomCapacity) {
      return NextResponse.json(
        { 
          error: `Ruangan ${schedule1.room.roomName} tidak cukup (Kapasitas: ${schedule1.room.roomCapacity}, Dibutuhkan: ${schedule2.classLecturer.class.classCapacity})`,
          constraint: "room_capacity"
        },
        { status: 400 }
      );
    }

    // 3. Lakukan swap jika semua validasi passed
    const result = await prisma.$transaction([
      prisma.schedule.update({
        where: { id: schedule1.id },
        data: {
          scheduleDayId: schedule2.scheduleDayId,
          scheduleSessionId: schedule2.scheduleSessionId,
          roomId: schedule2.roomId
        }
      }),
      prisma.schedule.update({
        where: { id: schedule2.id },
        data: {
          scheduleDayId: schedule1.scheduleDayId,
          scheduleSessionId: schedule1.scheduleSessionId,
          roomId: schedule1.roomId
        }
      })
    ]);

    return NextResponse.json(
      { 
        success: true,
        message: "Jadwal berhasil ditukar",
        data: {
          schedule1: result[0],
          schedule2: result[1]
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error in swap:", error);
    return NextResponse.json(
      { 
        error: "Gagal menukar jadwal",
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}