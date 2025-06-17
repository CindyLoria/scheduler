// import prisma from "@/app/(backend)/lib/db";
// import { NextResponse } from "next/server";

// export const dynamic = "force-dynamic";

// export async function GET(req) {
//   try {
//     const { searchParams } = new URL(req.url);
//     const dayId = searchParams.get("dayId");
//     const departmentId = searchParams.get("departmentId");
//     const academicPeriodId = searchParams.get("academicPeriodId");
//     const semesterTypeId = searchParams.get("semesterTypeId");

//     if (!dayId || !departmentId || !academicPeriodId || !semesterTypeId) {
//       return NextResponse.json(
//         { error: "dayId, academicPeriodId, departmentId, and semesterTypeId are required" },
//         { status: 400 }
//       );
//     }

//     const schedules = await prisma.schedule.findMany({
//       where: {
//         scheduleDayId: parseInt(dayId),
//         classLecturer: {
//           primaryLecturer: {
//             departmentId: parseInt(departmentId),
//           },
//           class: {
//             academicPeriod: {
//               id: parseInt(academicPeriodId),
//               semesterTypeId: parseInt(semesterTypeId),
//             },
//           },
//         },
//       },
//       include: {
//         classLecturer: {
//           select: {
//             primaryLecturerId: true,
//             primaryLecturer: {
//               select: { id: true, lecturerName: true, lecturerNIP: true },
//             },
//             secondaryLecturerId: true,
//             secondaryLecturer: {
//               select: { id: true, lecturerName: true, lecturerNIP: true },
//             },
//             class: {
//               select: {
//                 subSubject: {
//                   select: {
//                     subjectTypeId: true,
//                     subject: { select: { subjectName: true } },
//                     subjectType: { select: { typeName: true, id: true } },
//                   },
//                 },
//                 studyProgramClass: {
//                   select: {
//                     className: true,
//                   },
//                 },
//               },
//             },
//           },
//         },
//         scheduleDay: { select: { day: true, id: true } },
//         scheduleSession: {
//           select: {
//             startTime: true,
//             endTime: true,
//             id: true,
//           },
//         },
//         room: {
//           select: {
//             roomName: true,
//             roomCapacity: true,
//             isPracticum: true,
//             isTheory: true,
//           },
//         },
//       },
//     });

//     return NextResponse.json(schedules, { status: 200 });
//   } catch (error) {
//     console.error("Error fetching schedules:", error);
//     return NextResponse.json(
//       { error: "Something went wrong" },
//       { status: 500 }
//     );
//   }
// }


import prisma from "@/app/(backend)/lib/db";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    // 1. Parse URL dan validasi parameter
    const url = new URL(req.url);
    const dayId = url.searchParams.get("dayId");
    const departmentId = url.searchParams.get("departmentId");
    const academicPeriodId = url.searchParams.get("academicPeriodId");
    const semesterTypeId = url.searchParams.get("semesterTypeId");

    console.log("Received parameters:", {
      dayId,
      departmentId,
      academicPeriodId,
      semesterTypeId
    });

    // 2. Validasi parameter
    if (!dayId || !departmentId || !academicPeriodId || !semesterTypeId) {
      return NextResponse.json(
        { 
          error: "Missing required parameters",
          receivedParams: { dayId, departmentId, academicPeriodId, semesterTypeId }
        },
        { status: 400 }
      );
    }

    // 3. Konversi parameter ke integer dan validasi
    const parsedDayId = parseInt(dayId);
    const parsedDepartmentId = parseInt(departmentId);
    const parsedAcademicPeriodId = parseInt(academicPeriodId);
    const parsedSemesterTypeId = parseInt(semesterTypeId);

    if (isNaN(parsedDayId) || isNaN(parsedDepartmentId) || 
        isNaN(parsedAcademicPeriodId) || isNaN(parsedSemesterTypeId)) {
      return NextResponse.json(
        { error: "Invalid parameter values - must be numbers" },
        { status: 400 }
      );
    }

    // 4. Query Prisma dengan error handling
    const schedules = await prisma.schedule.findMany({
      where: {
        scheduleDayId: parsedDayId,
        classLecturer: {
          class: {
            academicPeriodId: parsedAcademicPeriodId,
            academicPeriod: {
              semesterTypeId: parsedSemesterTypeId
            },
            studyProgramClass: {
              studyProgram: {
                departmentId: parsedDepartmentId
              }
            }
          }
        }
      },
      include: {
        classLecturer: {
          include: {
            primaryLecturer: {
              select: {
                lecturerName: true,
              },
            },
            secondaryLecturer: {
              select: {
                lecturerName: true,
              },
            },
            class: {
              include: {
                subSubject: {
                  include: {
                    subject: {
                      include: {
                        semester: {
                          include: {
                            semesterType: true // Tambahkan ini untuk mendapatkan jenis semester
                          }
                        }
                      }
                    },
                    subjectType: true,
                  },
                },
                studyProgramClass: {
                  include: {
                    studyProgram: true
                  }
                },
                academicPeriod: true
              },
            },
          },
        },
        scheduleDay: true,
        scheduleSession: true,
        room: true,
      },
    });

    console.log(`Found ${schedules.length} schedules`);

    return NextResponse.json(schedules);

  } catch (error) {
    console.error("Detailed error:", {
      message: error.message,
      stack: error.stack,
      code: error.code
    });

    return NextResponse.json(
      { 
        error: "Failed to fetch schedules",
        details: error.message,
        code: error.code
      },
      { status: 500 }
    );
  }
}