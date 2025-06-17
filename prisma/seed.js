const { PrismaClient } = require('@prisma/client');
const xlsx = require('xlsx');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Seeding data...");
    
    const filePath = path.resolve(__dirname, '../public/database/DATA.xlsx');
    const workbook = xlsx.readFile(filePath);

    // Faculties
    console.log("Creating faculty...");
    const faculty = await prisma.faculty.create({
      data: {
        facultyName: 'Matematika dan Ilmu Pengetahuan Alam',
      },
    });
    console.log("Faculty created:", faculty.id);

    // Departments
    console.log("Creating department...");
    const department = await prisma.department.create({
      data: {
        departmentName: 'Ilmu Komputer',
        facultyId: faculty.id,
      },
    });
    console.log("Department created:", department.id);

    // Curriculum
    console.log("Creating curriculum...");
    const curriculum = await prisma.curriculum.create({
      data: {
        curriculumName: '2020',
      },
    });
    console.log("Curriculum created:", curriculum.id);

    // Semester Types 
    console.log("Creating semester types...");
    const ganjil = await prisma.semesterType.create({
      data: {
        typeName: 'Ganjil'
      }
    });
    console.log("Created Ganjil semester type:", ganjil.id);

    const genap = await prisma.semesterType.create({
      data: {
        typeName: 'Genap'
      }
    });
    console.log("Created Genap semester type:", genap.id);

    // Process Excel sheets
    for (const sheetName of workbook.SheetNames) {
      const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
      console.log(`Processing sheet: ${sheetName}`);

      try {
        switch (sheetName) {
          case 'studyProgram':
            for (const row of sheetData) {
              await prisma.studyProgram.create({
                data: {
                  studyProgramName: row.studyProgramName,
                  departmentId: department.id,
                },
              });
            }
            console.log("Study programs created");
            break;

          case 'semester':
            for (const row of sheetData) {
              await prisma.semester.create({
                data: {
                  semesterName: row.semesterName,
                  semesterTypeId: row.semesterTypeId,
                },
              });
            }
            console.log("Semesters created");
            break;

          case 'studyProgramClass':
            for (const row of sheetData) {
              await prisma.studyProgramClass.create({
                data: {
                  className: row.className,
                  studyProgramId: row.studyProgramId,
                },
              });
            }
            console.log("Study program classes created");
            break;

          case 'subject':
            for (const row of sheetData) {
              await prisma.subject.create({
                data: {
                  subjectCode: row.subjectCode,
                  subjectName: row.subjectName,
                  subjectSKS: row.subjectSKS,
                  subjectCategory: row.subjectCategory,
                  curriculumId: curriculum.id,
                  studyProgramId: row.studyProgramId,
                  semesterId: row.semesterId,
                },
              });
            }
            console.log("Subjects created");
            break;

          case 'subjectType':
            for (const row of sheetData) {
              await prisma.subjectType.create({
                data: {
                  typeName: row.typeName,
                },
              });
            }
            console.log("Subject types created");
            break;

          case 'subSubject':
            for (const row of sheetData) {
              await prisma.subSubject.create({
                data: {
                  subjectTypeId: row.subjectTypeId,
                  subjectId: row.subjectId,
                },
              });
            }
            console.log("Sub subjects created");
            break;

          case 'room':
            for (const row of sheetData) {
              await prisma.room.create({
                data: {
                  roomName: row.roomName,
                  roomCapacity: row.roomCapacity,
                  isPracticum: Boolean(row.isPracticum),
                  isTheory: Boolean(row.isTheory),
                  isResponse: Boolean(row.isResponse),
                  departmentId: department.id,
                },
              });
            }
            console.log("Rooms created");
            break;

          case 'academicPeriod':
            for (const row of sheetData) {
              await prisma.academicPeriod.create({
                data: {
                  academicYear: row.academicYear,
                  curriculumId: curriculum.id,
                  semesterTypeId: row.semesterTypeId,
                },
              });
            }
            console.log("Academic periods created");
            break;

          case 'class':
            for (const row of sheetData) {
              await prisma.class.create({
                data: {
                  classCapacity: row.classCapacity,
                  studyProgramClassId: row.studyProgramClassId,
                  subSubjectId: row.subSubjectId,
                  academicPeriodId: row.academicPeriodId,
                },
              });
            }
            console.log("Classes created");
            break;

          case 'lecturer':
            for (const row of sheetData) {
              await prisma.lecturer.create({
                data: {
                  lecturerName: row.lecturerName,
                  lecturerNIP: row.lecturerNIP || null,
                  lecturerEmail: row.lecturerEmail || null,
                  departmentId: department.id,
                },
              });
            }
            console.log("Lecturers created");
            break;

          case 'classLecturer':
            for (const row of sheetData) {
              await prisma.classLecturer.create({
                data: {
                  classId: row.classId,
                  primaryLecturerId: row.primaryLecturerId,
                  secondaryLecturerId: row.secondaryLecturerId || null,
                  primaryAssistantId: row.primaryAssistantId || null,
                  secondaryAssistantId: row.secondaryAssistantId || null,
                },
              });
            }
            console.log("Class lecturers created");
            break;

          case 'scheduleSession':
            for (const row of sheetData) {
              await prisma.scheduleSession.create({
                data: {
                  startTime: row.startTime,
                  endTime: row.endTime,
                  sessionNumber: row.sessionNumber,
                },
              });
            }
            console.log("Schedule sessions created");
            break;

          case 'scheduleDay':
            for (const row of sheetData) {
              await prisma.scheduleDay.create({
                data: {
                  day: row.day,
                },
              });
            }
            console.log("Schedule days created");
            break;

          case 'schedule':
            for (const row of sheetData) {
              await prisma.schedule.create({
                data: {
                  scheduleDayId: row.scheduleDayId,
                  classLecturerId: row.classLecturerId,
                  scheduleSessionId: row.scheduleSessionId,
                  roomId: row.roomId,
                },
              });
            }
            console.log("Schedules created");
            break;

          default:
            console.log(`Skipping unknown sheet: ${sheetName}`);
        }
      } catch (error) {
        console.error(`Error processing sheet ${sheetName}:`, error);
        throw error;
      }
    }

    // buat admin user
    console.log("Creating admin user...");
    const user = await prisma.user.create({
      data: {
        username: 'admin',
        password: '$2a$12$zZeNjPxjEyWsvU78f7MlOuPIxTI9fjGmjNqgtrZpILGxUdpXlHUGu',
        role: 'admin',
        lecturerId: 1,
      },
    });
    console.log("Admin user created:", user.id);

    console.log("Seeding complete!");
  } catch (error) {
    console.error("Error during seeding:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });