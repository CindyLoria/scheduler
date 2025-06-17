// import prisma from "@/app/(backend)/lib/db";
// import { NextResponse } from "next/server";
// import axios from "axios";
// import fs from 'fs';
// import path from 'path';

// export async function GET(req) {
//   try {
//     const url = new URL(req.url);
//     const params = {
//       departmentId: url.searchParams.get("departmentId"),
//       curriculumId: url.searchParams.get("curriculumId"),
//       semesterTypeId: url.searchParams.get("semesterTypeId"),
//       academicPeriodId: url.searchParams.get("academicPeriodId")
//     };

//     const missingParams = Object.entries(params)
//       .filter(([_, value]) => !value)
//       .map(([key]) => key);

//     if (missingParams.length > 0) {
//       return NextResponse.json(
//         { error: `Missing parameters: ${missingParams.join(", ")}` },
//         { status: 400 }
//       );
//     }

//     try {
//       const pythonServiceResponse = await axios.post(
//         process.env.PYTHON_SERVICE_URL + "/generate-schedule",
//         params
//       );

//       return NextResponse.json(pythonServiceResponse.data);
//     } catch (pythonError) {
//       console.error("Python service error:", pythonError.response?.data);
//       return NextResponse.json(
//         { error: pythonError.response?.data?.detail || "Python service error" },
//         { status: pythonError.response?.status || 500 }
//       );
//     }
//   } catch (error) {
//     console.error("API error:", error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }

// export async function POST(req) {
//   // Aktifkan logging yang lebih detail
//   const logFilePath = path.join(process.cwd(), 'schedule-creation.log');
//   const logger = {
//     log: (message) => {
//       const timestamp = new Date().toISOString();
//       const logMessage = `[${timestamp}] ${message}\n`;
//       fs.appendFileSync(logFilePath, logMessage);
//       console.log(message);
//     },
//     error: (message) => {
//       const timestamp = new Date().toISOString();
//       const errorMessage = `[ERROR][${timestamp}] ${message}\n`;
//       fs.appendFileSync(logFilePath, errorMessage);
//       console.error(message);
//     }
//   };

//   try {
//     const { schedules } = await req.json();
//     logger.log(`Menerima request dengan ${schedules.length} jadwal`);

//     if (!Array.isArray(schedules)) {
//       logger.error("Data schedules harus berupa array");
//       return NextResponse.json(
//         { error: "Data schedules harus berupa array" },
//         { status: 400 }
//       );
//     }

//     const createdSchedules = [];
//     const failedSchedules = [];

//     // Proses setiap jadwal dengan logging mendalam
//     for (const schedule of schedules) {
//       try {
//         // Logging detail setiap jadwal yang akan diproses
//         logger.log(`Memproses jadwal: ${JSON.stringify(schedule)}`);

//         // Validasi data secara menyeluruh
//         const [day, session, room, classLecturer] = await Promise.all([
//           prisma.scheduleDay.findUnique({ 
//             where: { id: schedule.scheduleDayId },
//             select: { id: true }
//           }),
//           prisma.scheduleSession.findUnique({ 
//             where: { id: schedule.scheduleSessionId },
//             select: { id: true }
//           }),
//           prisma.room.findUnique({ 
//             where: { id: schedule.roomId },
//             select: { id: true }
//           }),
//           prisma.classLecturer.findUnique({ 
//             where: { id: schedule.classLecturerId },
//             select: { id: true }
//           })
//         ]);

//         // Logging hasil validasi referensi
//         logger.log(`Validasi referensi: 
//           Day: ${!!day}, 
//           Session: ${!!session}, 
//           Room: ${!!room}, 
//           ClassLecturer: ${!!classLecturer}`
//         );

//         // Cek apakah semua referensi valid
//         if (!day || !session || !room || !classLecturer) {
//           failedSchedules.push({
//             schedule,
//             reason: "Invalid reference data",
//             details: {
//               dayExists: !!day,
//               sessionExists: !!session,
//               roomExists: !!room,
//               classLecturerExists: !!classLecturer
//             }
//           });
//           continue;
//         }

//         // Cek duplikasi jadwal
//         const existingSchedule = await prisma.schedule.findFirst({
//           where: {
//             scheduleDayId: schedule.scheduleDayId,
//             scheduleSessionId: schedule.scheduleSessionId,
//             roomId: schedule.roomId
//           }
//         });

//         if (existingSchedule) {
//           logger.log(`Jadwal duplikat ditemukan: ${JSON.stringify(existingSchedule)}`);
//           failedSchedules.push({
//             schedule,
//             reason: "Duplicate schedule",
//             existingScheduleId: existingSchedule.id
//           });
//           continue;
//         }

//         // Buat jadwal
//         const createdSchedule = await prisma.schedule.create({
//           data: {
//             scheduleDayId: schedule.scheduleDayId,
//             scheduleSessionId: schedule.scheduleSessionId,
//             roomId: schedule.roomId,
//             classLecturerId: schedule.classLecturerId
//           }
//         });

//         createdSchedules.push(createdSchedule);
//         logger.log(`Jadwal berhasil dibuat: ${createdSchedule.id}`);

//       } catch (error) {
//         logger.error(`Gagal membuat jadwal: ${error.message}`);
//         failedSchedules.push({
//           schedule,
//           reason: "Creation error",
//           errorMessage: error.message
//         });
//       }
//     }

//     // Tulis ringkasan ke file log
//     logger.log(`Ringkasan Pembuatan Jadwal:
//       Total Jadwal Diterima: ${schedules.length}
//       Jadwal Berhasil: ${createdSchedules.length}
//       Jadwal Gagal: ${failedSchedules.length}`
//     );

//     // Simpan detail jadwal gagal ke file log terpisah
//     if (failedSchedules.length > 0) {
//       const failedSchedulesLogPath = path.join(process.cwd(), 'failed-schedules.json');
//       fs.writeFileSync(failedSchedulesLogPath, JSON.stringify(failedSchedules, null, 2));
//       logger.log(`Detail jadwal gagal disimpan di: ${failedSchedulesLogPath}`);
//     }

//     return NextResponse.json(
//       { 
//         message: `Berhasil membuat ${createdSchedules.length} jadwal`, 
//         totalSchedules: schedules.length,
//         successCount: createdSchedules.length,
//         failedCount: failedSchedules.length,
//         schedules: createdSchedules 
//       },
//       { status: 200 }
//     );

//   } catch (error) {
//     logger.error(`Error server: ${error.message}`);
//     return NextResponse.json(
//       { 
//         error: "Gagal membuat jadwal", 
//         detail: error.message 
//       },
//       { status: 500 }
//     );
//   }
// }

// export async function POST(req) {
//   try {
//     const { schedules } = await req.json();
//     console.log(`Menerima ${schedules.length} data jadwal`);

//     if (!Array.isArray(schedules)) {
//       return NextResponse.json(
//         { error: "Data schedules harus berupa array" },
//         { status: 400 }
//       );
//     }

//     // Validasi data
//     for (const schedule of schedules) {
//       if (!schedule.scheduleDayId || 
//           !schedule.scheduleSessionId || 
//           !schedule.roomId || 
//           !schedule.classLecturerId ||
//           schedule.scheduleDayId <= 0 ||
//           schedule.scheduleSessionId <= 0 ||
//           schedule.roomId <= 0 ||
//           schedule.classLecturerId <= 0
//       ) {
//         console.error("Data jadwal tidak valid:", schedule);
//         return NextResponse.json(
//           { error: "Format data jadwal tidak valid" },
//           { status: 400 }
//         );
//       }
//     }

//     // Proses dalam transaksi
//     const createdSchedules = await prisma.$transaction(async (tx) => {
//       const results = [];
      
//       for (const schedule of schedules) {
//         try {
//           // Cek duplikasi jadwal
//           const existingSchedule = await tx.schedule.findFirst({
//             where: {
//               scheduleDayId: schedule.scheduleDayId,
//               scheduleSessionId: schedule.scheduleSessionId,
//               roomId: schedule.roomId,
//             },
//           });

//           if (existingSchedule) {
//             console.log(`Jadwal sudah ada untuk kombinasi day:${schedule.scheduleDayId} session:${schedule.scheduleSessionId} room:${schedule.roomId}`);
//             continue;
//           }

//           const result = await tx.schedule.create({
//             data: {
//               scheduleDayId: schedule.scheduleDayId,
//               scheduleSessionId: schedule.scheduleSessionId,
//               roomId: schedule.roomId,
//               classLecturerId: schedule.classLecturerId,
//             },
//             include: {
//               classLecturer: {
//                 include: {
//                   class: true,
//                   lecturer: true,
//                   secondaryLecturer: true,
//                 },
//               },
//               scheduleDay: true,
//               scheduleSession: true,
//               room: true,
//             },
//           });
          
//           results.push(result);
//         } catch (error) {
//           console.error("Error membuat jadwal:", error, schedule);
//           throw new Error(`Gagal membuat jadwal: ${error.message}`);
//         }
//       }
      
//       return results;
//     });

//     // Update kapasitas kelas setelah semua jadwal berhasil dibuat
//     await Promise.all(
//       createdSchedules.map(async (schedule) => {
//         if (schedule.classLecturer?.class && schedule.room) {
//           await prisma.class.update({
//             where: { id: schedule.classLecturer.class.id },
//             data: {
//               classCapacity: {
//                 decrement: schedule.room.roomCapacity,
//               },
//             },
//           });
//         }
//       })
//     );

//     return NextResponse.json(
//       { 
//         message: `Berhasil membuat ${createdSchedules.length} jadwal`, 
//         schedules: createdSchedules 
//       },
//       { status: 200 }
//     );

//   } catch (error) {
//     console.error("Error server:", error);
//     return NextResponse.json(
//       { 
//         error: "Gagal membuat jadwal", 
//         detail: error.message 
//       },
//       { status: 500 }
//     );
//   }
// }

// export async function POST(req) {
//   try {
//     const { schedules } = await req.json();
//     console.log("Data yang diterima di Next.js API:", schedules);

//     if (!Array.isArray(schedules)) {
//       return NextResponse.json(
//         { error: "Schedules harus berupa array" },
//         { status: 400 }
//       );
//     }

//     // Validasi struktur data sebelum simpan ke database
//     for (const schedule of schedules) {
//       if (!schedule.dayId || !schedule.sessionId || !schedule.roomId || !schedule.classLecturerId) {
//         console.error("Invalid schedule data:", schedule);
//         return NextResponse.json(
//           { error: "Invalid schedule data structure" },
//           { status: 400 }
//         );
//       }
//     }

//     // buat schedule
//     const createdSchedules = await prisma.$transaction(
//       async (tx) => {
//         const results = [];
//         for (const schedule of schedules) {
//           try {
//             const result = await tx.schedule.create({
//               data: {
//                 scheduleDayId: schedule.dayId,
//                 classLecturerId: schedule.classLecturerId,
//                 scheduleSessionId: schedule.sessionId,
//                 roomId: schedule.roomId,
//               },
//               include: {
//                 classLecturer: {
//                   include: {
//                     class: true,
//                     lecturer: true,
//                     secondaryLecturer: true,
//                   },
//                 },
//                 scheduleDay: true,
//                 scheduleSession: true,
//                 room: true,
//               },
//             });
//             results.push(result);
//           } catch (error) {
//             console.error("Error creating schedule:", error, schedule);
//             throw error;
//           }
//         }
//         return results;
//       }
//     );

//     // Update kapasitas kelass
//     await Promise.all(
//       createdSchedules.map(async (schedule) => {
//         try {
//           const room = await prisma.room.findUnique({
//             where: { id: schedule.roomId },
//             select: { roomCapacity: true },
//           });

//           if (room && schedule.classLecturer.class) {
//             await prisma.class.update({
//               where: { id: schedule.classLecturer.class.id },
//               data: {
//                 classCapacity: {
//                   decrement: room.roomCapacity,
//                 },
//               },
//             });
//           }
//         } catch (error) {
//           console.error("Error updating class capacity:", error, schedule);
//           throw error;
//         }
//       })
//     );

//     return NextResponse.json(
//       { message: "Schedules generated successfully", schedules: createdSchedules },
//       { status: 200 }
//     );
//   } catch (error) {
//     console.error("Error generating schedules:", error);
//     return NextResponse.json(
//       { 
//         error: "Failed to generate schedules",
//         details: error.message 
//       },
//       { status: 500 }
//     );
//   }
// }

// export async function POST(req) {
//   try {
//     const { schedules } = await req.json();

//     if (!Array.isArray(schedules)) {
//       return NextResponse.json(
//         { error: "Schedules must be an array" },
//         { status: 400 }
//       );
//     }

//     // Create all schedules in the database using a transaction
//     const createdSchedules = await prisma.$transaction(
//       schedules.map((schedule) =>
//         prisma.schedule.create({
//           data: {
//             scheduleDayId: schedule.dayId,
//             classLecturerId: schedule.classLecturerId,
//             scheduleSessionId: schedule.sessionId,
//             roomId: schedule.roomId,
//           },
//           include: {
//             classLecturer: {
//               include: {
//                 class: true,
//                 lecturer: true,
//                 secondaryLecturer: true,
//               },
//             },
//             scheduleDay: true,
//             scheduleSession: true,
//             room: true,
//           },
//         })
//       )
//     );

//     // Update class capacities
//     await Promise.all(
//       createdSchedules.map(async (schedule) => {
//         const room = await prisma.room.findUnique({
//           where: { id: schedule.roomId },
//           select: { roomCapacity: true },
//         });

//         if (room && schedule.classLecturer.class) {
//           await prisma.class.update({
//             where: { id: schedule.classLecturer.class.id },
//             data: {
//               classCapacity: {
//                 decrement: room.roomCapacity,
//               },
//             },
//           });
//         }
//       })
//     );

//     return NextResponse.json(
//       { message: "Schedules generated successfully", schedules: createdSchedules },
//       { status: 200 }
//     );
//   } catch (error) {
//     console.error("Error generating schedules:", error);
//     return NextResponse.json(
//       { error: "Failed to generate schedules" },
//       { status: 500 }
//     );
//   }
// }

import prisma from "@/app/(backend)/lib/db";
import { NextResponse } from "next/server";
import axios from "axios";
import fs from 'fs';
import path from 'path';

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const params = {
      departmentId: url.searchParams.get("departmentId"),
      curriculumId: url.searchParams.get("curriculumId"),
      semesterTypeId: url.searchParams.get("semesterTypeId"),
      academicPeriodId: url.searchParams.get("academicPeriodId")
    };

    const missingParams = Object.entries(params)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingParams.length > 0) {
      return NextResponse.json(
        { error: `Missing parameters: ${missingParams.join(", ")}` },
        { status: 400 }
      );
    }

    try {
      const pythonServiceResponse = await axios.post(
        process.env.PYTHON_SERVICE_URL + "/generate-schedule",
        params
      );

      return NextResponse.json(pythonServiceResponse.data);
    } catch (pythonError) {
      console.error("Python service error:", pythonError.response?.data);
      return NextResponse.json(
        { error: pythonError.response?.data?.detail || "Python service error" },
        { status: pythonError.response?.status || 500 }
      );
    }
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  // Aktifkan logging yang lebih detail
  const logFilePath = path.join(process.cwd(), 'schedule-creation.log');
  const logger = {
    log: (message) => {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] ${message}\n`;
      fs.appendFileSync(logFilePath, logMessage);
      console.log(message);
    },
    error: (message) => {
      const timestamp = new Date().toISOString();
      const errorMessage = `[ERROR][${timestamp}] ${message}\n`;
      fs.appendFileSync(logFilePath, errorMessage);
      console.error(message);
    }
  };

  try {
    const { schedules, academicPeriodId, semesterTypeId } = await req.json();
    logger.log(`Menerima request dengan ${schedules.length} jadwal`);

    if (!Array.isArray(schedules)) {
      logger.error("Data schedules harus berupa array");
      return NextResponse.json(
        { error: "Data schedules harus berupa array" },
        { status: 400 }
      );
    }

    if (!schedules || !Array.isArray(schedules)) {
      return NextResponse.json(
        { error: "Data schedules harus berupa array" },
        { status: 400 }
      );
    }
  
    if (schedules.length === 0) {
      return NextResponse.json(
        { error: "Data schedules tidak boleh kosong" },
        { status: 400 }
      );
    }

    const createdSchedules = [];
    const failedSchedules = [];

    for (const schedule of schedules) {
      try {
        logger.log(`Memproses jadwal: ${JSON.stringify(schedule)}`);

        const classLecturer = await prisma.classLecturer.findUnique({
          where: { id: schedule.classLecturerId },
          include: {
            class: {
              select: {
                academicPeriodId: true
              }
            }
          }
        });

        // Validasi data secara menyeluruh
        const [day, session, room] = await Promise.all([
          prisma.scheduleDay.findUnique({ 
            where: { id: schedule.scheduleDayId },
            select: { id: true }
          }),
          prisma.scheduleSession.findUnique({ 
            where: { id: schedule.scheduleSessionId },
            select: { id: true }
          }),
          prisma.room.findUnique({ 
            where: { id: schedule.roomId },
            select: { id: true }
          }),
         
        ]);

        // Logging hasil validasi referensi
        logger.log(`Validasi referensi: 
          Day: ${!!day}, 
          Session: ${!!session}, 
          Room: ${!!room}, 
          ClassLecturer: ${!!classLecturer}`
        );

        if (!classLecturer || classLecturer.class.academicPeriodId !== academicPeriodId) {
          failedSchedules.push({
            schedule,
            reason: "Invalid academic period",
            details: {
              expectedPeriod: academicPeriodId,
              actualPeriod: classLecturer?.class?.academicPeriodId
            }
          });
          continue;
        }
  

        // Cek apakah semua referensi valid
        if (!day || !session || !room || !classLecturer) {
          failedSchedules.push({
            schedule,
            reason: "Invalid reference data",
            details: {
              dayExists: !!day,
              sessionExists: !!session,
              roomExists: !!room,
              classLecturerExists: !!classLecturer
            }
          });
          continue;
        }

        // Cek duplikasi jadwal
        const existingSchedule = await prisma.schedule.findFirst({
          where: {
            scheduleDayId: schedule.scheduleDayId,
            scheduleSessionId: schedule.scheduleSessionId,
            roomId: schedule.roomId
          }
        });

        if (existingSchedule) {
          logger.log(`Jadwal duplikat ditemukan: ${JSON.stringify(existingSchedule)}`);
          failedSchedules.push({
            schedule,
            reason: "Duplicate schedule",
            existingScheduleId: existingSchedule.id
          });
          continue;
        }

        // Buat jadwal
        const createdSchedule = await prisma.schedule.create({
          data: {
            scheduleDayId: schedule.scheduleDayId,
            scheduleSessionId: schedule.scheduleSessionId,
            roomId: schedule.roomId,
            classLecturerId: schedule.classLecturerId
          }
        });

        createdSchedules.push(createdSchedule);
        logger.log(`Jadwal berhasil dibuat: ${createdSchedule.id}`);

      } catch (error) {
        logger.error(`Gagal membuat jadwal: ${error.message}`);
        failedSchedules.push({
          schedule,
          reason: "Creation error",
          errorMessage: error.message
        });
      }
    }

    // Tulis ringkasan ke file log
    logger.log(`Ringkasan Pembuatan Jadwal:
      Total Jadwal Diterima: ${schedules.length}
      Jadwal Berhasil: ${createdSchedules.length}
      Jadwal Gagal: ${failedSchedules.length}`
    );

    // Simpan detail jadwal gagal ke file log terpisah
    if (failedSchedules.length > 0) {
      const failedSchedulesLogPath = path.join(process.cwd(), 'failed-schedules.json');
      fs.writeFileSync(failedSchedulesLogPath, JSON.stringify(failedSchedules, null, 2));
      logger.log(`Detail jadwal gagal disimpan di: ${failedSchedulesLogPath}`);
    }

    return NextResponse.json(
      { 
        message: `Berhasil membuat ${createdSchedules.length} jadwal`, 
        totalSchedules: schedules.length,
        successCount: createdSchedules.length,
        failedCount: failedSchedules.length,
        schedules: createdSchedules 
      },
      { status: 200 }
    );

  } catch (error) {
    logger.error(`Error server: ${error.message}`);
    return NextResponse.json(
      { 
        error: "Gagal membuat jadwal", 
        detail: error.message 
      },
      { status: 500 }
    );
  }
}
