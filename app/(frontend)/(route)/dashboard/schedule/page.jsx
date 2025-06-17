

"use client";
import React, { useState, useEffect } from "react";
import {
  Button,
  Table,
  Spin,
  message,
  ConfigProvider,
  Select,
  Form,
  Popconfirm,
} from "antd";
import axios from "axios";

// Your API endpoints
import {
  API_SCHEDULE_SESSION,
  API_SCHEDULE_DAY,
  API_FACULTY,
  API_ACADEMIC_PERIOD_BY_CURRICULUM,
  API_DEPARTMENT_BY_FACULTY,
  API_ROOM_BY_DEPARTMENT,
  API_SCHEDULE_BY_SCHEDULE_DAY_BY_DEPARTMENT_BY_PERIOD,
  API_CURRICULUM,
  API_SCHEDULE_BY_ID,
  API_SEMESTER_TYPE,
  AUTO_GENERATE_SERVICE,
  API_SCHEDULE_SWAP,
} from "@/app/(backend)/lib/endpoint";
// import PostSchedule from "@/app/(frontend)/(component)/PostSchedule";
import SwapModal from "@/app/(frontend)/(component)/SwapModal";


const ScheduleMatrix = () => {
  const [roomOptions, setRoomOptions] = useState([]);
  const [sessionOptions, setSessionOptions] = useState([]);
  const [dayOptions, setDayOptions] = useState([]);
  const [academicPeriodOptions, setAcademicPeriodOptions] = useState([]);
  const [semesterTypeOptions, setSemesterTypeOptions] = useState([]);
  const [departmentOptions, setDepartmentOptions] = useState(null);
  const [curriculumOptions, setCurriculumOptions] = useState([]);
  const [scheduleData, setScheduleData] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [facultyOptions, setFacultyOptions] = useState([]);
  const [isDepartmentLoading, setIsDepartmentLoading] = useState(false);
  const [isFacultyLoading, setIsFacultyLoading] = useState(false);
  const [isPeriodLoading, setIsPeriodLoading] = useState(false);
  const [isSemesterLoading, setIsCurrentSemesterLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentDayId, setCurrentDayId] = useState(null);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [currentRoomId, setCurrentRoomId] = useState(null);
  const [currentRoomName, setCurrentRoomName] = useState(null);
  const [currentSemesterId, setCurrentSemesterId] = useState(null);
  const [currentRoomCapacity, setCurrentRoomCapacity] = useState(null);
  const [currentPeriodId, setCurrentPeriodId] = useState(null);
  const [currentCurriculumId, setCurrentCurriculumId] = useState(null);
  const [isTheory, setIsTheory] = useState(null);
  const [isPracticum, setIsPracticum] = useState(null);
  const [executionTime, setExecutionTime] = useState(null);
  const [isSwapOpen, setIsSwapOpen] = useState(false);
  const [swapData, setSwapData] = useState(null);

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        const [sessionResponse, dayResponse, curriculumResponse] =
          await Promise.all([
            axios.get(API_SCHEDULE_SESSION),
            axios.get(API_SCHEDULE_DAY),
            axios.get(API_CURRICULUM),
          ]);
        setSessionOptions(sessionResponse.data);
        setDayOptions(dayResponse.data);
        setCurriculumOptions(curriculumResponse.data);
        setIsLoading(false);
        setIsCurrentSemesterLoading(false);
      } catch (error) {
        message.error("Error fetching data");
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, []);

  // const handleAddButtonClick = (
  //   dayId,
  //   sessionId,
  //   roomId,
  //   isTheory,
  //   isPracticum,
  //   roomName,
  //   roomCapacity
  // ) => {
  //   setCurrentDayId(dayId);
  //   setCurrentSessionId(sessionId);
  //   setCurrentRoomId(roomId);
  //   setIsTheory(isTheory);
  //   setIsPracticum(isPracticum);
  //   setCurrentRoomName(roomName);
  //   setCurrentRoomCapacity(roomCapacity);
  //   setIsModalOpen(true); // Show modal when button is clicked
  // };

  
  // const handleModalClose = () => {
  //   setIsModalOpen(false);
  // };

  const loadSchedule = async (
    departmentId,
    academicPeriodId,
    semesterTypeId
  ) => {
    try {
      const response = await axios.get(
        API_SCHEDULE_SWAP(departmentId, academicPeriodId, semesterTypeId)
      );
      const sched = response.data.map((sch) => ({
        value: sch.id,
        label: sch.id,
      }));
      setSwapData(sched);
    } catch (error) {
      message.error("Gagal memuat data!");
    }
  };

  // Fetch departments based on selected faculty
  const loadDepartmentsByFaculty = async (facultyId) => {
    setIsDepartmentLoading(true);
    try {
      const response = await axios.get(API_DEPARTMENT_BY_FACULTY(facultyId));
      const departments = response.data.map((dept) => ({
        value: dept.id,
        label: dept.departmentName,
      }));
      setDepartmentOptions(departments);
      setIsDepartmentLoading(false);
    } catch (error) {
      message.error("Gagal memuat data jurusan data!");
      setIsDepartmentLoading(false);
    }
  };

  // Fetch period
  const loadPeriod = async (curriculumId) => {
    setIsPeriodLoading(true);
    try {
      const response = await axios.get(
        API_ACADEMIC_PERIOD_BY_CURRICULUM(curriculumId)
      );
      const periods = response.data.map((per) => ({
        value: per.id,
        label: per.academicYear,
      }));
      setAcademicPeriodOptions(periods);
      setIsPeriodLoading(false);
    } catch (error) {
      message.error("Gagal memuat data fakultas!");
      setIsPeriodLoading(false);
    }
  };

  const fetchSemesterTypes = async () => {
    setIsCurrentSemesterLoading(true);
    try {
      const response = await axios.get(API_SEMESTER_TYPE);
      const semester = response.data.map((per) => ({
        value: per.id,
        label: per.typeName,
      }));
      setSemesterTypeOptions(semester);
      setIsCurrentSemesterLoading(false);
    } catch (error) {
      message.error("Gagal memuat data semester!");
      setIsCurrentSemesterLoading(false);
    }
  };

  // Fetch faculties
  const loadFaculties = async () => {
    setIsFacultyLoading(true);
    try {
      const response = await axios.get(API_FACULTY);
      const faculties = response.data.map((fac) => ({
        value: fac.id,
        label: fac.facultyName,
      }));
      setFacultyOptions(faculties);
      setIsFacultyLoading(false);
    } catch (error) {
      message.error("Gagal memuat data fakultas!");
      setIsFacultyLoading(false);
    }
  };

  // Fetch rooms based on selected department
  const loadRoomsByDepartment = async (departmentId) => {
    setIsLoading(true);
    try {
      const roomResponse = await axios.get(
        API_ROOM_BY_DEPARTMENT(departmentId)
      );
      setRoomOptions(roomResponse.data);
      setIsLoading(false);
    } catch (error) {
      message.error("Error fetching rooms");
      setIsLoading(false);
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    try {
      const response = await axios.delete(API_SCHEDULE_BY_ID(scheduleId));
      message.success("Schedule deleted successfully!");
      loadScheduleByDay(currentDayId); // Reload the schedule data
    } catch (error) {
      message.error("Failed to delete schedule.");
    }
  };

  // yang ini
  // const handlePostSchedule = async (
  //   departmentId,
  //   curriculumId,
  //   semesterTypeId,
  //   academicPeriodId,
  //   selectedDay
  // ) => {
  //   setIsLoading(true);
  //   try {
  //     // Ambil semua data yang diperlukan secara parallel
  //     const [classLecturersRes, roomsRes, scheduleDaysRes, scheduleSessionsRes] = 
  //       await Promise.all([
  //         axios.get(`/api/class-lecturer?departmentId=${departmentId}`),
  //         axios.get('/api/room'),
  //         axios.get('/api/schedule-day'),
  //         axios.get('/api/schedule-session')
  //       ]);
      
  //     const payload = {
  //       rooms: roomsRes.data,
  //       scheduleDays: scheduleDaysRes.data,
  //       scheduleSessions: scheduleSessionsRes.data,
  //       classLecturers: classLecturersRes.data,
  //       departmentId,
  //       curriculumId,
  //       semesterTypeId,
  //       academicPeriodId,
  //     };
      
  //     // Validasi payload
  //     if (!payload.rooms?.length) throw new Error('Data ruangan tidak tersedia');
  //     if (!payload.scheduleDays?.length) throw new Error('Data hari tidak tersedia');
  //     if (!payload.scheduleSessions?.length) throw new Error('Data sesi tidak tersedia');
  //     if (!payload.classLecturers?.length) throw new Error('Data kelas dan dosen tidak tersedia');
      
  //     // Kirim ke Python service
  //     const { data: generatedSchedule } = await axios.post(
  //       AUTO_GENERATE_SERVICE(departmentId, curriculumId, semesterTypeId, academicPeriodId),
  //       payload,
  //       {
  //           headers: {
  //               'Content-Type': 'application/json'
  //           }
  //       }
  //     );

  //     console.log("Full Python response:", {
  //       scheduleLength: generatedSchedule.schedule?.length,
  //       sampleSchedule: generatedSchedule.schedule?.[0],
  //       fitness: generatedSchedule.fitness
  //     });
      
  //     console.log("Data mentah dari Python:", generatedSchedule.schedule);
      
  //     // Validasi response dari Python service
  //     // if (!generatedSchedule.schedule || !Array.isArray(generatedSchedule.schedule)) {
  //     //   throw new Error('Response dari generator jadwal tidak valid: schedule harus berupa array');
  //     // }
  
  //     // Filter dan transformasi data
  //       const batchSize = 10;
  //       const formattedSchedules = generatedSchedule.schedule.filter(schedule => {
  //         // Filter data yang tidak valid
  //         const isValid = 
  //           schedule.scheduleDayId > 0 && 
  //           schedule.scheduleSessionId > 0 && 
  //           schedule.roomId > 0 && 
  //           schedule.classLecturerId > 0;

  //         if (!isValid) {
  //           console.log("Data jadwal dilewati karena tidak valid:", schedule);
  //         }
          
  //         return isValid;
  //       })
  //       // .map(schedule => ({
  //       //   scheduleDayId: Number(schedule.dayId),
  //       //   scheduleSessionId: Number(schedule.sessionId),
  //       //   roomId: Number(schedule.roomId),
  //       //   classIdLecturer: Number(schedule.classLecturerId)
  //       // }));

  //       if (formattedSchedules.length === 0) {
  //         throw new Error('Tidak ada jadwal valid yang bisa diproses');
  //       }

  //       console.log(`Mengirim ${formattedSchedules.length} jadwal ke API`);
  //       console.log("Contoh data jadwal:", formattedSchedules[0]);

  //       // Kirim dalam batch untuk menghindari request terlalu besar
  //       const batches = [];
  //       for (let i = 0; i < formattedSchedules.length; i += batchSize) {
  //         batches.push(formattedSchedules.slice(i, i + batchSize));
  //       }

  //       console.log(`Membagi ${formattedSchedules.length} data menjadi ${batches.length} batch`);

  //       // Proses setiap batch secara berurutan
  //       let successCount = 0;
  //       let failedBatches = 0;
  //       for (let i = 0; i < batches.length; i++) {
  //         const batch = batches[i];
  //         try {
  //           console.log(`Memproses batch ${i + 1}/${batches.length}`);
            
  //           const response = await axios.post('/api/schedule/generate', {
  //             schedules: batch
  //           });
        
  //       successCount += response.data.schedules?.length || 0;
  //       console.log(`Batch ${i + 1} berhasil: ${response.data.schedules?.length} jadwal`);
  //       } catch (error) {
  //         console.error(`Error pada batch ${i + 1}:`, error.response?.data || error.message);
  //         failedBatches++;
  //         // Continue with next batch instead of throwing
  //         continue;
  //       }
  //   }

  //   if (successCount > 0) {
  //     message.success(`Berhasil generate ${successCount} jadwal!`);
  //   }
  //   if (failedBatches > 0) {
  //     message.warning(`${failedBatches} batch gagal diproses. Total jadwal berhasil: ${successCount}`);
  //   }

  //   message.success(`Berhasil generate ${successCount} jadwal!`);
  
  //     } catch (error) {
  //       console.error("Error detail:", {
  //         message: error.message,
  //         status: error.response?.status,
  //         data: error.response?.data
  //       });
        
  //       let errorMessage = "Jadwal gagal di generate! ";
  //   if (error.response?.data?.error) {
  //     errorMessage += error.response.data.error;
  //   } else if (error.response?.data?.detail) {
  //     errorMessage += error.response.data.detail;
  //   } else if (error.message) {
  //     errorMessage += error.message;
  //   }
        
  //       message.error(errorMessage);
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };

  // end yang iini

  const loadScheduleByDay = async (dayId) => {
    setIsLoading(true);
    try {
      console.log("Loading schedule with params:", {
        dayId,
        selectedDepartment,
        currentPeriodId,
        currentSemesterId
      });
  
      const response = await axios.get(
        API_SCHEDULE_BY_SCHEDULE_DAY_BY_DEPARTMENT_BY_PERIOD(
          dayId,
          selectedDepartment,
          currentPeriodId,
          currentSemesterId
        )
      );
  
      const schedules = response.data;
      console.log(`Received ${schedules.length} schedules`);
  
      setScheduleData(schedules);
      setIsLoading(false);
    } catch (error) {
      console.error("Error detail:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
  
      message.error(
        error.response?.data?.error || 
        error.response?.data?.details || 
        "Error fetching schedule"
      );
      
      setIsLoading(false);
    }
  };

  const handlePostSchedule = async (
    departmentId,
    curriculumId,
    semesterTypeId,
    academicPeriodId,
    selectedDay
  ) => {
    setIsLoading(true);
    setExecutionTime(null);
    const startTime = performance.now();
    try {
      // Ambil semua data yang diperlukan secara parallel
      const [classLecturersRes, roomsRes, scheduleDaysRes, scheduleSessionsRes] = 
        await Promise.all([
          axios.get('/api/class-lecturer', {
            params: {
              departmentId,
              academicPeriodId,
              semesterTypeId
            }
          }),
          axios.get('/api/room'),
          axios.get('/api/schedule-day'),
          axios.get('/api/schedule-session')
        ]);

        const payload = {
          rooms: roomsRes.data,
          scheduleDays: scheduleDaysRes.data,
          scheduleSessions: scheduleSessionsRes.data,
          classLecturers: classLecturersRes.data,
          departmentId,
          curriculumId,
          semesterTypeId,
          academicPeriodId,
        };

        console.log("Payload yang dikirim:", payload);
      
      // Validasi payload
      if (!payload.rooms?.length) throw new Error('Data ruangan tidak tersedia');
      if (!payload.scheduleDays?.length) throw new Error('Data hari tidak tersedia');
      if (!payload.scheduleSessions?.length) throw new Error('Data sesi tidak tersedia');
      if (!payload.classLecturers?.length) throw new Error('Data kelas dan dosen tidak tersedia');
      
      // Kirim ke Python service
      const { data: generatedSchedule } = await axios.post(
        AUTO_GENERATE_SERVICE(departmentId, curriculumId, semesterTypeId, academicPeriodId),
        payload,
        {
            headers: {
                'Content-Type': 'application/json'
            }
        }
      );

      const endTime = performance.now();
      setExecutionTime(((endTime - startTime) / 1000).toFixed(2)); // Simpan waktu eksekusi dalam detik

      message.success(`Jadwal berhasil digenerate dalam ${executionTime} detik!`);

      console.log("Full Python response:", {
        scheduleLength: generatedSchedule.schedule?.length,
        sampleSchedule: generatedSchedule.schedule?.[0],
        fitness: generatedSchedule.fitness
      });
      
      console.log("Data mentah dari Python:", generatedSchedule.schedule);
      
      // Filter dan transformasi data
        const batchSize = 10;
        const formattedSchedules = generatedSchedule.schedule.filter(schedule => {
          // Filter data yang tidak valid
          const isValid = 
            schedule.scheduleDayId > 0 && 
            schedule.scheduleSessionId > 0 && 
            schedule.roomId > 0 && 
            schedule.classLecturerId > 0;

          if (!isValid) {
            console.log("Data jadwal dilewati karena tidak valid:", schedule);
          }
          
          return isValid;
        });

        if (formattedSchedules.length === 0) {
          throw new Error('Tidak ada jadwal valid yang bisa diproses');
        }

        console.log(`Mengirim ${formattedSchedules.length} jadwal ke API`);
        console.log("Contoh data jadwal:", formattedSchedules[0]);

        // Kirim dalam batch untuk menghindari request terlalu besar
        const batches = [];
        for (let i = 0; i < formattedSchedules.length; i += batchSize) {
          batches.push(formattedSchedules.slice(i, i + batchSize));
        }

        console.log(`Membagi ${formattedSchedules.length} data menjadi ${batches.length} batch`);

        // Proses setiap batch secara berurutan
        let successCount = 0;
        let failedBatches = 0;
        for (let i = 0; i < batches.length; i++) {
          const batch = batches[i];
          try {
            console.log(`Memproses batch ${i + 1}/${batches.length}`);
            
            const response = await axios.post('/api/schedule/generate', {
              schedules: batch,
              academicPeriodId, 
              semesterTypeId    
            });
        
        successCount += response.data.schedules?.length || 0;
        console.log(`Batch ${i + 1} berhasil: ${response.data.schedules?.length} jadwal`);
        } catch (error) {
          console.error(`Error pada batch ${i + 1}:`, error.response?.data || error.message);
          failedBatches++;
          continue;
        }
    }

    if (successCount > 0) {
      message.success(`Berhasil generate ${successCount} jadwal!`);
    }
    if (failedBatches > 0) {
      message.warning(`${failedBatches} batch gagal diproses. Total jadwal berhasil: ${successCount}`);
    }

      } catch (error) {
        console.error("Error detail:", {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          payload: error.config?.data
        });
        
        let errorMessage = "Jadwal gagal di generate! ";
        if (error.response?.data?.error) {
          errorMessage += error.response.data.error;
        } else if (error.response?.data?.detail) {
          errorMessage += error.response.data.detail;
        } else if (error.message) {
          errorMessage += error.message;
        }
        
        message.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
};

  // Handle department selection and fetch rooms
  const handleDepartmentChange = (departmentId) => {
    setSelectedDepartment(departmentId);
    setSelectedDay(null); // Reset selected day when department changes
    loadRoomsByDepartment(departmentId); // Fetch rooms for the selected department
  };

  // Handle day selection and fetch schedule
  const handleDaySelection = (day) => {
    setSelectedDay(day);
    loadScheduleByDay(day.id); // Fetch the schedule for the selected day
  };

  // Generate table columns dynamically based on rooms
  const columns = [
    {
      title: <div className="text-center">Waktu/Sesi</div>,
      dataIndex: "sessionNumber",
      width: 150,
      key: "sessionNumber",
      fixed: "left",
      render: (_, record) => <div className="text-center">{record.time}</div>,
    },
    ...roomOptions.map((room) => ({
      title: <div className="text-center">{room.roomName}</div>,
      dataIndex: room.id,
      width: 300,
      key: room.id,
      render: (_, record) => {
        const scheduleItem = record.schedules.find(
          (sch) => sch.roomId === room.id
        );
        return scheduleItem ? (
          <div className="flex flex-col justify-center h-32 text-center items-center">
            <div className="text-lg font-bold">
              {scheduleItem.classLecturer.class.subSubject.subject?.subjectName}{" "}
              {scheduleItem.classLecturer.class.subSubject.subjectType?.typeName}{" "}
              {scheduleItem.classLecturer.class.studyProgramClass?.className}
              <div className="text-xs font-normal text-blue-600">
                Semester: {scheduleItem.classLecturer.class.subSubject.subject?.semester 
                  ? `Semester ${scheduleItem.classLecturer.class.subSubject.subject.semester.semesterName}`
                  : 'Tidak tersedia'}
              </div>
            </div>
            <div className="text-gray-500 text-sm">
              Dosen Pengampu:
              <div>
                1. {scheduleItem.classLecturer.primaryLecturer?.lecturerName}
              </div>
              <div>
                 {!scheduleItem.classLecturer.secondaryLecturer ? null : `2. ${scheduleItem.classLecturer.secondaryLecturer?.lecturerName}`}
              </div>
            </div>
            <Popconfirm
              title="Apakah anda yakin?"
              onConfirm={() => handleDeleteSchedule(scheduleItem.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button className="mt-2" size="small" danger>
                Hapus
              </Button>
            </Popconfirm>
          </div>
        ) : (
          <div className="flex justify-center items-center rounded-lg h-32">
            {/* <Button
              onClick={() =>
                handleAddButtonClick(
                  selectedDay.id,
                  record.sessionNumber,
                  room.id,
                  room.isTheory,
                  room.isPracticum,
                  room.roomName,
                  room.roomCapacity
                )
              }
            >
              Tambah Data
            </Button> */}
            <Button>Kosong</Button>
          </div>
        );
      },
    })),
  ];
  // Prepare data for the table
  const dataSource = sessionOptions
    .sort((a, b) => a.sessionNumber - b.sessionNumber) // Sort by sessionNumber
    .map((session) => {
      const rowData = {
        key: session.id,
        sessionNumber: session.sessionNumber, // Add session number for indexing
        time: `${session.startTime} - ${session.endTime}`,
        schedules: scheduleData.filter(
          (sch) => sch.scheduleSessionId === session.id
        ), // Filter schedules for this session
      };

      return rowData;
    });

  return (
    <ConfigProvider
      theme={{
        components: {
          Table: {
            headerBg: "#1677ff",
            headerColor: "#fff",
            borderColor: "#bfbfbf",
          },
        },
      }}
    >
      <div>
        <div className="flex items-center">
          <h1 className="text-2xl font-bold mb-8 flex">
            <div className="bg-blue-500 px-1 mr-2">&nbsp;</div>Kelola Jadwal
          </h1>
        </div>

        <div className="mb-8 lg:flex gap-8">
          <Select
            className="mb-2 w-full shadow-lg border-b-4 border-blue-500"
            showSearch
            placeholder="Kurikulum"
            value={currentCurriculumId}
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            options={curriculumOptions.map((curr) => ({
              value: curr.id,
              label: curr.curriculumName,
            }))}
            notFoundContent={
              isLoading ? <Spin size="small" /> : "Tidak ada data!"
            }
            onChange={(value) => {
              setCurrentCurriculumId(value);
              setCurrentPeriodId(null);
              setSelectedFaculty(null);
              setSelectedDepartment(null);
              setSelectedDay(null);
              loadPeriod(value);
            }}
          />
          <Select
            className="mb-2 w-full shadow-lg border-b-4 border-blue-500"
            showSearch
            placeholder={"Tahun Akademik"}
            value={currentPeriodId} // Show selected period
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            options={academicPeriodOptions}
            onChange={(value) => {
              setCurrentPeriodId(value);
              setSelectedFaculty(null);
              setSelectedDepartment(null);
              setSelectedDay(null);
              fetchSemesterTypes();
              loadFaculties();
            }}
            notFoundContent={
              isPeriodLoading ? <Spin size="small" /> : "Tidak ada data!"
            }
            loading={isPeriodLoading}
            disabled={currentCurriculumId === null}
          />
          <Select
            className="mb-2 w-full shadow-lg border-b-4 border-blue-500"
            showSearch
            placeholder={"Semester"}
            value={currentSemesterId} // Show selected period
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            options={semesterTypeOptions}
            onChange={(value) => {
              setCurrentSemesterId(value);
            }}
            notFoundContent={
              isSemesterLoading ? <Spin size="small" /> : "Tidak ada data!"
            }
            loading={isSemesterLoading}
            disabled={currentPeriodId === null}
          />
          <Select
            notFoundContent={
              isFacultyLoading ? <Spin size="small" /> : "Tidak ada data!"
            }
            className="mb-2 w-full shadow-lg border-b-4 border-blue-500"
            showSearch
            placeholder={"Fakultas"}
            value={selectedFaculty}
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            options={facultyOptions}
            onChange={(value) => {
              setSelectedFaculty(value);
              loadDepartmentsByFaculty(value);
              setSelectedDepartment(null);
              setSelectedDay(null);
            }}
            loading={isFacultyLoading}
            disabled={currentPeriodId === null} // Disable when periodId is null
          />
          <Select
            showSearch
            className="mb-2 w-full shadow-lg border-b-4 border-blue-500"
            disabled={!selectedFaculty}
            placeholder={"Jurusan"}
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            options={departmentOptions}
            value={selectedDepartment} // Set the selected department value
            notFoundContent={
              isDepartmentLoading ? <Spin size="small" /> : "Tidak ada data!"
            }
            onSelect={(value) => {
              setSelectedDay(null); // Clear selected day when department is changed
              handleDepartmentChange(value); // Set department and fetch rooms
            }}
          />
        </div>

        {isLoading ? (
          <Spin />
        ) : (
          <>
            {/* Day buttons */}
            {selectedDepartment && (
              <>
                <div className="mb-4 justify-between flex">
                  {dayOptions.map((day) => (
                    <Button
                      key={day.id}
                      type={selectedDay?.id === day.id ? "primary" : "text"}
                      onClick={() => handleDaySelection(day)}
                      className="mr-2 mb-2 border-b-4 border-gray-600"
                    >
                      {day.day}
                    </Button>
                  ))}
                   <Button
                    onClick={() => {
                      loadSchedule(
                        selectedDepartment,
                        currentPeriodId,
                        currentSemesterId
                      );
                      setIsSwapOpen(true);
                    }}
                    className="mr-2 mb-2 border-b-4 border-gray-600"
                    type="primary"
                  >
                    Tukar Jadwal
                  </Button>

                  <Button
                    onClick={() => handlePostSchedule(
                      selectedDepartment,
                      currentCurriculumId,
                      currentSemesterId,
                      currentPeriodId,
                      selectedDay
                    )}
                    className="mr-2 mb-2 border-b-4 border-gray-600"
                    type="primary"
                    loading={isLoading}
                    disabled={!scheduleData || scheduleData?.length > 1 || !selectedDay}
                  >
                    {isLoading ? 'Sedang Memproses...' : 'Buat Jadwal Otomatis'}
                  </Button>
                </div>
                {executionTime && (
                  <p className="mt-4 text-green-600">
                    Jadwal berhasil digenerate dalam {executionTime} detik.
                  </p>
                )}
                {/* Show the table only when a day is selected */}
                {!selectedDay && (
                  <>
                    <h2 className="text-xl text-gray-500 font-semibold mb-2">
                      Pilih Hari!
                    </h2>
                  </>
                )}
                {selectedDay && (
                  <>
                    
                    <Table
                      className="shadow-xl rounded-xl"
                      columns={columns}
                      dataSource={dataSource}
                      bordered
                      pagination={false}
                      scroll={{ x: "max-content", y: 500 }} // Horizontal scroll enabled
                    />
                  </>
                )}
              </>
            )}

            {/* {executionTime && (
              <p className="mt-4 text-green-600">
                Jadwal berhasil digenerate dalam {executionTime} detik.
              </p>
            )} */}

            {!selectedDepartment && (
              <>
                <h2 className="text-xl text-gray-500 font-semibold mb-2">
                  Pilih Jurusan Terlebih Dahulu!
                </h2>
              </>
            )}
          </>
        )}

        {/* <PostSchedule
          open={isModalOpen}
          onClose={handleModalClose}
          scheduleDayId={currentDayId}
          scheduleSessionId={currentSessionId}
          roomId={currentRoomId}
          departmentId={selectedDepartment}
          curriculumId={currentCurriculumId}
          isTheory={isTheory}
          isPracticum={isPracticum}
          roomName={currentRoomName}
          roomCapacity={currentRoomCapacity}
          scheduleData={scheduleData}
          onSuccess={() => loadScheduleByDay(currentDayId)}
        /> */}
      </div>
      <SwapModal
        isSwapOpen={isSwapOpen}
        setIsSwapOpen={setIsSwapOpen}
        title="Tukar Jadwal"
      >
        <Form.Item
          label="Pertemuan 1"
          name="scheduleId1"
          rules={[{ required: true, message: "Pilih pertemuan pertama" }]}
        >
          <Select>
            {swapData?.map((sch) => (
              <Select.Option key={sch.value} value={sch.value}>
                {sch.label}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="Pertemuan 2"
          name="scheduleId2"
          rules={[{ required: true, message: "Pilih pertemuan kedua" }]}
        >
          <Select>
            {swapData?.map((sch) => (
              <Select.Option key={sch.value} value={sch.value}>
                {sch.label}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      </SwapModal>
      ;
    </ConfigProvider>
  );
};

export default ScheduleMatrix;

// // "use client";
// // import React, { useState, useEffect } from "react";
// // import {
// //   Button,
// //   Table,
// //   Spin,
// //   message,
// //   ConfigProvider,
// //   Select,
// //   Popconfirm,
// // } from "antd";
// // import axios from "axios";

// // // Your API endpoints
// // import {
// //   API_SCHEDULE_SESSION,
// //   API_SCHEDULE_DAY,
// //   API_FACULTY,
// //   API_ACADEMIC_PERIOD_BY_CURRICULUM,
// //   API_DEPARTMENT_BY_FACULTY,
// //   API_ROOM_BY_DEPARTMENT,
// //   API_SCHEDULE_BY_SCHEDULE_DAY_BY_DEPARTMENT_BY_PERIOD,
// //   API_CURRICULUM,
// //   API_SCHEDULE_BY_ID,
// //   API_SEMESTER_TYPE,
// //   AUTO_GENERATE_SERVICE,
// // } from "@/app/(backend)/lib/endpoint";
// // import PostSchedule from "@/app/(frontend)/(component)/PostSchedule";

// // const ScheduleMatrix = () => {
// //   const [roomOptions, setRoomOptions] = useState([]);
// //   const [sessionOptions, setSessionOptions] = useState([]);
// //   const [dayOptions, setDayOptions] = useState([]);
// //   const [academicPeriodOptions, setAcademicPeriodOptions] = useState([]);
// //   const [semesterTypeOptions, setSemesterTypeOptions] = useState([]);
// //   const [departmentOptions, setDepartmentOptions] = useState(null);
// //   const [curriculumOptions, setCurriculumOptions] = useState([]);
// //   const [scheduleData, setScheduleData] = useState([]);
// //   const [selectedDay, setSelectedDay] = useState(null);
// //   const [isLoading, setIsLoading] = useState(true);
// //   const [selectedDepartment, setSelectedDepartment] = useState(null);
// //   const [selectedFaculty, setSelectedFaculty] = useState(null);
// //   const [facultyOptions, setFacultyOptions] = useState([]);
// //   const [isDepartmentLoading, setIsDepartmentLoading] = useState(false);
// //   const [isFacultyLoading, setIsFacultyLoading] = useState(false);
// //   const [isPeriodLoading, setIsPeriodLoading] = useState(false);
// //   const [isSemesterLoading, setIsCurrentSemesterLoading] = useState(false);
// //   const [isModalOpen, setIsModalOpen] = useState(false);
// //   const [currentDayId, setCurrentDayId] = useState(null);
// //   const [currentSessionId, setCurrentSessionId] = useState(null);
// //   const [currentRoomId, setCurrentRoomId] = useState(null);
// //   const [currentRoomName, setCurrentRoomName] = useState(null);
// //   const [currentSemesterId, setCurrentSemesterId] = useState(null);
// //   const [currentRoomCapacity, setCurrentRoomCapacity] = useState(null);
// //   const [currentPeriodId, setCurrentPeriodId] = useState(null);
// //   const [currentCurriculumId, setCurrentCurriculumId] = useState(null);
// //   const [isTheory, setIsTheory] = useState(null);
// //   const [isPracticum, setIsPracticum] = useState(null);

// //   useEffect(() => {
// //     const loadInitialData = async () => {
// //       setIsLoading(true);
// //       try {
// //         const [sessionResponse, dayResponse, curriculumResponse] =
// //           await Promise.all([
// //             axios.get(API_SCHEDULE_SESSION),
// //             axios.get(API_SCHEDULE_DAY),
// //             axios.get(API_CURRICULUM),
// //           ]);
// //         setSessionOptions(sessionResponse.data);
// //         setDayOptions(dayResponse.data);
// //         setCurriculumOptions(curriculumResponse.data);
// //         setIsLoading(false);
// //         setIsCurrentSemesterLoading(false);
// //       } catch (error) {
// //         message.error("Error fetching data");
// //         setIsLoading(false);
// //       }
// //     };
// //     loadInitialData();
// //   }, []);

// //   const handleAddButtonClick = (
// //     dayId,
// //     sessionId,
// //     roomId,
// //     isTheory,
// //     isPracticum,
// //     roomName,
// //     roomCapacity
// //   ) => {
// //     setCurrentDayId(dayId);
// //     setCurrentSessionId(sessionId);
// //     setCurrentRoomId(roomId);
// //     setIsTheory(isTheory);
// //     setIsPracticum(isPracticum);
// //     setCurrentRoomName(roomName);
// //     setCurrentRoomCapacity(roomCapacity);
// //     setIsModalOpen(true); // Show modal when button is clicked
// //   };

// //   const handleModalClose = () => {
// //     setIsModalOpen(false);
// //   };

// //   // Fetch departments based on selected faculty
// //   const loadDepartmentsByFaculty = async (facultyId) => {
// //     setIsDepartmentLoading(true);
// //     try {
// //       const response = await axios.get(API_DEPARTMENT_BY_FACULTY(facultyId));
// //       const departments = response.data.map((dept) => ({
// //         value: dept.id,
// //         label: dept.departmentName,
// //       }));
// //       setDepartmentOptions(departments);
// //       setIsDepartmentLoading(false);
// //     } catch (error) {
// //       message.error("Gagal memuat data jurusan data!");
// //       setIsDepartmentLoading(false);
// //     }
// //   };

// //   // Fetch period
// //   const loadPeriod = async (curriculumId) => {
// //     setIsPeriodLoading(true);
// //     try {
// //       const response = await axios.get(
// //         API_ACADEMIC_PERIOD_BY_CURRICULUM(curriculumId)
// //       );
// //       const periods = response.data.map((per) => ({
// //         value: per.id,
// //         label: per.academicYear,
// //       }));
// //       setAcademicPeriodOptions(periods);
// //       setIsPeriodLoading(false);
// //     } catch (error) {
// //       message.error("Gagal memuat data fakultas!");
// //       setIsPeriodLoading(false);
// //     }
// //   };

// //   const fetchSemesterTypes = async () => {
// //     setIsCurrentSemesterLoading(true);
// //     try {
// //       const response = await axios.get(API_SEMESTER_TYPE);
// //       const semester = response.data.map((per) => ({
// //         value: per.id,
// //         label: per.typeName,
// //       }));
// //       setSemesterTypeOptions(semester);
// //       setIsCurrentSemesterLoading(false);
// //     } catch (error) {
// //       message.error("Gagal memuat data semester!");
// //       setIsCurrentSemesterLoading(false);
// //     }
// //   };

// //   // Fetch faculties
// //   const loadFaculties = async () => {
// //     setIsFacultyLoading(true);
// //     try {
// //       const response = await axios.get(API_FACULTY);
// //       const faculties = response.data.map((fac) => ({
// //         value: fac.id,
// //         label: fac.facultyName,
// //       }));
// //       setFacultyOptions(faculties);
// //       setIsFacultyLoading(false);
// //     } catch (error) {
// //       message.error("Gagal memuat data fakultas!");
// //       setIsFacultyLoading(false);
// //     }
// //   };

// //   // Fetch rooms based on selected department
// //   const loadRoomsByDepartment = async (departmentId) => {
// //     setIsLoading(true);
// //     try {
// //       const roomResponse = await axios.get(
// //         API_ROOM_BY_DEPARTMENT(departmentId)
// //       );
// //       setRoomOptions(roomResponse.data);
// //       setIsLoading(false);
// //     } catch (error) {
// //       message.error("Error fetching rooms");
// //       setIsLoading(false);
// //     }
// //   };

// //   // Fetch the schedule for a selected day
// //   const loadScheduleByDay = async (dayId) => {
// //     setIsLoading(true);
// //     try {
// //       const scheduleResponse = await axios.get(
// //         API_SCHEDULE_BY_SCHEDULE_DAY_BY_DEPARTMENT_BY_PERIOD(
// //           dayId,
// //           selectedDepartment,
// //           currentPeriodId
// //         )
// //       );
// //       setScheduleData(scheduleResponse.data);
// //       setIsLoading(false);
// //     } catch (error) {
// //       message.error("Error fetching schedule");
// //       setIsLoading(false);
// //     }
// //   };

// //   const handleDeleteSchedule = async (scheduleId) => {
// //     try {
// //       const response = await axios.delete(API_SCHEDULE_BY_ID(scheduleId));
// //       message.success("Schedule deleted successfully!");
// //       loadScheduleByDay(currentDayId); // Reload the schedule data
// //     } catch (error) {
// //       message.error("Failed to delete schedule.");
// //     }
// //   };

// //   const handlePostSchedule = async (
// //     departmentId,
// //     curriculumId,
// //     semesterTypeId,
// //     academicPeriodId
// //   ) => {
// //     setIsLoading(true);
// //     try {
// //       const postSchedule = await axios.get(
// //         AUTO_GENERATE_SERVICE(
// //           departmentId,
// //           curriculumId,
// //           semesterTypeId,
// //           academicPeriodId
// //         )
// //       );
// //       setIsLoading(false);
// //       message.success("Jadwal berhasil di generate!");
// //     } catch (error) {
// //       setIsLoading(false);
// //       message.error("Jadwal gagal di generate!");
// //     }
// //   };

// //   // Handle department selection and fetch rooms
// //   const handleDepartmentChange = (departmentId) => {
// //     setSelectedDepartment(departmentId);
// //     setSelectedDay(null); // Reset selected day when department changes
// //     loadRoomsByDepartment(departmentId); // Fetch rooms for the selected department
// //   };

// //   // Handle day selection and fetch schedule
// //   const handleDaySelection = (day) => {
// //     setSelectedDay(day);
// //     loadScheduleByDay(day.id); // Fetch the schedule for the selected day
// //   };

// //   // Generate table columns dynamically based on rooms
// //   const columns = [
// //     {
// //       title: <div className="text-center">Waktu/Sesi</div>,
// //       dataIndex: "sessionNumber",
// //       width: 150,
// //       key: "sessionNumber",
// //       fixed: "left",
// //       render: (_, record) => <div className="text-center">{record.time}</div>,
// //     },
// //     ...roomOptions.map((room) => ({
// //       title: <div className="text-center">{room.roomName}</div>,
// //       dataIndex: room.id,
// //       width: 300,
// //       key: room.id,
// //       render: (_, record) => {
// //         const scheduleItem = record.schedules.find(
// //           (sch) => sch.roomId === room.id
// //         );
// //         return scheduleItem ? (
// //           <div className="flex flex-col justify-center h-32 text-center items-center">
// //             <div className="text-lg font-bold">
// //               {scheduleItem.classLecturer.class.subSubject.subject?.subjectName}{" "}
// //               {scheduleItem.classLecturer.class.subSubject.subjectType?.typeName}{" "}
// //               {scheduleItem.classLecturer.class.studyProgramClass?.className}
// //             </div>
// //             <div className="text-gray-500 text-sm">
// //               Dosen Pengampu:
// //               <div>
// //                 1. {scheduleItem.classLecturer.primaryLecturer?.lecturerName}
// //               </div>
// //               <div>
// //                  {!scheduleItem.classLecturer.secondaryLecturer ? null : `2. ${scheduleItem.classLecturer.secondaryLecturer?.lecturerName}`}
// //               </div>
// //             </div>
// //             <Popconfirm
// //               title="Apakah anda yakin?"
// //               onConfirm={() => handleDeleteSchedule(scheduleItem.id)}
// //               okText="Yes"
// //               cancelText="No"
// //             >
// //               <Button className="mt-2" size="small" danger>
// //                 Hapus
// //               </Button>
// //             </Popconfirm>
// //           </div>
// //         ) : (
// //           <div className="flex justify-center items-center rounded-lg h-32">
// //             {/* <Button
// //               onClick={() =>
// //                 handleAddButtonClick(
// //                   selectedDay.id,
// //                   record.sessionNumber,
// //                   room.id,
// //                   room.isTheory,
// //                   room.isPracticum,
// //                   room.roomName,
// //                   room.roomCapacity
// //                 )
// //               }
// //             >
// //               Tambah Data
// //             </Button> */}
// //             <Button>Kosong</Button>
// //           </div>
// //         );
// //       },
// //     })),
// //   ];
// //   // Prepare data for the table
// //   const dataSource = sessionOptions
// //     .sort((a, b) => a.sessionNumber - b.sessionNumber) // Sort by sessionNumber
// //     .map((session) => {
// //       const rowData = {
// //         key: session.id,
// //         sessionNumber: session.sessionNumber, // Add session number for indexing
// //         time: `${session.startTime} - ${session.endTime}`,
// //         schedules: scheduleData.filter(
// //           (sch) => sch.scheduleSessionId === session.id
// //         ), // Filter schedules for this session
// //       };

// //       return rowData;
// //     });

// //   return (
// //     <ConfigProvider
// //       theme={{
// //         components: {
// //           Table: {
// //             headerBg: "#1677ff",
// //             headerColor: "#fff",
// //             borderColor: "#bfbfbf",
// //           },
// //         },
// //       }}
// //     >
// //       <div>
// //         <div className="flex items-center">
// //           <h1 className="text-2xl font-bold mb-8 flex">
// //             <div className="bg-blue-500 px-1 mr-2">&nbsp;</div>Kelola Jadwal
// //           </h1>
// //         </div>

// //         <div className="mb-8 lg:flex gap-8">
// //           <Select
// //             className="mb-2 w-full shadow-lg border-b-4 border-blue-500"
// //             showSearch
// //             placeholder="Kurikulum"
// //             value={currentCurriculumId}
// //             filterOption={(input, option) =>
// //               (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
// //             }
// //             options={curriculumOptions.map((curr) => ({
// //               value: curr.id,
// //               label: curr.curriculumName,
// //             }))}
// //             notFoundContent={
// //               isLoading ? <Spin size="small" /> : "Tidak ada data!"
// //             }
// //             onChange={(value) => {
// //               setCurrentCurriculumId(value);
// //               setCurrentPeriodId(null);
// //               setSelectedFaculty(null);
// //               setSelectedDepartment(null);
// //               setSelectedDay(null);
// //               loadPeriod(value);
// //             }}
// //           />
// //           <Select
// //             className="mb-2 w-full shadow-lg border-b-4 border-blue-500"
// //             showSearch
// //             placeholder={"Tahun Akademik"}
// //             value={currentPeriodId} // Show selected period
// //             filterOption={(input, option) =>
// //               (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
// //             }
// //             options={academicPeriodOptions}
// //             onChange={(value) => {
// //               setCurrentPeriodId(value);
// //               setSelectedFaculty(null);
// //               setSelectedDepartment(null);
// //               setSelectedDay(null);
// //               fetchSemesterTypes();
// //               loadFaculties();
// //             }}
// //             notFoundContent={
// //               isPeriodLoading ? <Spin size="small" /> : "Tidak ada data!"
// //             }
// //             loading={isPeriodLoading}
// //             disabled={currentCurriculumId === null}
// //           />
// //           <Select
// //             className="mb-2 w-full shadow-lg border-b-4 border-blue-500"
// //             showSearch
// //             placeholder={"Semester"}
// //             value={currentSemesterId} // Show selected period
// //             filterOption={(input, option) =>
// //               (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
// //             }
// //             options={semesterTypeOptions}
// //             onChange={(value) => {
// //               setCurrentSemesterId(value);
// //             }}
// //             notFoundContent={
// //               isSemesterLoading ? <Spin size="small" /> : "Tidak ada data!"
// //             }
// //             loading={isSemesterLoading}
// //             disabled={currentPeriodId === null}
// //           />
// //           <Select
// //             notFoundContent={
// //               isFacultyLoading ? <Spin size="small" /> : "Tidak ada data!"
// //             }
// //             className="mb-2 w-full shadow-lg border-b-4 border-blue-500"
// //             showSearch
// //             placeholder={"Fakultas"}
// //             value={selectedFaculty}
// //             filterOption={(input, option) =>
// //               (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
// //             }
// //             options={facultyOptions}
// //             onChange={(value) => {
// //               setSelectedFaculty(value);
// //               loadDepartmentsByFaculty(value);
// //               setSelectedDepartment(null);
// //               setSelectedDay(null);
// //             }}
// //             loading={isFacultyLoading}
// //             disabled={currentPeriodId === null} // Disable when periodId is null
// //           />
// //           <Select
// //             showSearch
// //             className="mb-2 w-full shadow-lg border-b-4 border-blue-500"
// //             disabled={!selectedFaculty}
// //             placeholder={"Jurusan"}
// //             filterOption={(input, option) =>
// //               (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
// //             }
// //             options={departmentOptions}
// //             value={selectedDepartment} // Set the selected department value
// //             notFoundContent={
// //               isDepartmentLoading ? <Spin size="small" /> : "Tidak ada data!"
// //             }
// //             onSelect={(value) => {
// //               setSelectedDay(null); // Clear selected day when department is changed
// //               handleDepartmentChange(value); // Set department and fetch rooms
// //             }}
// //           />
// //         </div>

// //         {isLoading ? (
// //           <Spin />
// //         ) : (
// //           <>
// //             {/* Day buttons */}
// //             {selectedDepartment && (
// //               <>
// //                 <div className="mb-4 justify-between flex">
// //                   {dayOptions.map((day) => (
// //                     <Button
// //                       key={day.id}
// //                       type={selectedDay?.id === day.id ? "primary" : "text"}
// //                       onClick={() => handleDaySelection(day)}
// //                       className="mr-2 mb-2 border-b-4 border-gray-600"
// //                     >
// //                       {day.day}
// //                     </Button>
// //                   ))}
// //                   <Button
// //                     onClick={() =>
// //                       handlePostSchedule(
// //                         selectedDepartment,
// //                         currentCurriculumId,
// //                         currentSemesterId,
// //                         currentPeriodId
// //                       )
// //                     }
// //                     className="mr-2 mb-2 border-b-4 border-gray-600"
// //                     type="primary"
// //                     disabled={!scheduleData || scheduleData?.length > 1}
// //                   >
// //                     Buat Jadwal Otomatis
// //                   </Button>
// //                 </div>

// //                 {/* Show the table only when a day is selected */}
// //                 {!selectedDay && (
// //                   <>
// //                     <h2 className="text-xl text-gray-500 font-semibold mb-2">
// //                       Pilih Hari!
// //                     </h2>
// //                   </>
// //                 )}
// //                 {selectedDay && (
// //                   <>
// //                     <Table
// //                       className="shadow-xl rounded-xl"
// //                       columns={columns}
// //                       dataSource={dataSource}
// //                       bordered
// //                       pagination={false}
// //                       scroll={{ x: "max-content", y: 500 }} // Horizontal scroll enabled
// //                     />
// //                   </>
// //                 )}
// //               </>
// //             )}

// //             {!selectedDepartment && (
// //               <>
// //                 <h2 className="text-xl text-gray-500 font-semibold mb-2">
// //                   Pilih Jurusan Terlebih Dahulu!
// //                 </h2>
// //               </>
// //             )}
// //           </>
// //         )}

// //         <PostSchedule
// //           open={isModalOpen}
// //           onClose={handleModalClose}
// //           scheduleDayId={currentDayId}
// //           scheduleSessionId={currentSessionId}
// //           roomId={currentRoomId}
// //           departmentId={selectedDepartment}
// //           curriculumId={currentCurriculumId}
// //           isTheory={isTheory}
// //           isPracticum={isPracticum}
// //           roomName={currentRoomName}
// //           roomCapacity={currentRoomCapacity}
// //           scheduleData={scheduleData}
// //           onSuccess={() => loadScheduleByDay(currentDayId)}
// //         />
// //       </div>
// //     </ConfigProvider>
// //   );
// // };

// // export default ScheduleMatrix;

// "use client";
// import React, { useState, useEffect } from "react";
// import {
//   Button,
//   Table,
//   Spin,
//   message,
//   ConfigProvider,
//   Select,
//   Popconfirm,
// } from "antd";
// import axios from "axios";

// // Your API endpoints
// import {
//   API_SCHEDULE_SESSION,
//   API_SCHEDULE_DAY,
//   API_FACULTY,
//   API_ACADEMIC_PERIOD_BY_CURRICULUM,
//   API_DEPARTMENT_BY_FACULTY,
//   API_ROOM_BY_DEPARTMENT,
//   API_SCHEDULE_BY_SCHEDULE_DAY_BY_DEPARTMENT_BY_PERIOD,
//   API_CURRICULUM,
//   API_SCHEDULE_BY_ID,
//   API_SEMESTER_TYPE,
//   AUTO_GENERATE_SERVICE,
// } from "@/app/(backend)/lib/endpoint";
// import PostSchedule from "@/app/(frontend)/(component)/PostSchedule";

// const ScheduleMatrix = () => {
//   const [roomOptions, setRoomOptions] = useState([]);
//   const [sessionOptions, setSessionOptions] = useState([]);
//   const [dayOptions, setDayOptions] = useState([]);
//   const [academicPeriodOptions, setAcademicPeriodOptions] = useState([]);
//   const [semesterTypeOptions, setSemesterTypeOptions] = useState([]);
//   const [departmentOptions, setDepartmentOptions] = useState(null);
//   const [curriculumOptions, setCurriculumOptions] = useState([]);
//   const [scheduleData, setScheduleData] = useState([]);
//   const [selectedDay, setSelectedDay] = useState(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [selectedDepartment, setSelectedDepartment] = useState(null);
//   const [selectedFaculty, setSelectedFaculty] = useState(null);
//   const [facultyOptions, setFacultyOptions] = useState([]);
//   const [isDepartmentLoading, setIsDepartmentLoading] = useState(false);
//   const [isFacultyLoading, setIsFacultyLoading] = useState(false);
//   const [isPeriodLoading, setIsPeriodLoading] = useState(false);
//   const [isSemesterLoading, setIsCurrentSemesterLoading] = useState(false);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [currentDayId, setCurrentDayId] = useState(null);
//   const [currentSessionId, setCurrentSessionId] = useState(null);
//   const [currentRoomId, setCurrentRoomId] = useState(null);
//   const [currentRoomName, setCurrentRoomName] = useState(null);
//   const [currentSemesterId, setCurrentSemesterId] = useState(null);
//   const [currentRoomCapacity, setCurrentRoomCapacity] = useState(null);
//   const [currentPeriodId, setCurrentPeriodId] = useState(null);
//   const [currentCurriculumId, setCurrentCurriculumId] = useState(null);
//   const [isTheory, setIsTheory] = useState(null);
//   const [isPracticum, setIsPracticum] = useState(null);
//   const [executionTime, setExecutionTime] = useState(null);
    
//   useEffect(() => {
//     const loadInitialData = async () => {
//       setIsLoading(true);
//       try {
//         const [sessionResponse, dayResponse, curriculumResponse] =
//           await Promise.all([
//             axios.get(API_SCHEDULE_SESSION),
//             axios.get(API_SCHEDULE_DAY),
//             axios.get(API_CURRICULUM),
//           ]);
//         setSessionOptions(sessionResponse.data);
//         setDayOptions(dayResponse.data);
//         setCurriculumOptions(curriculumResponse.data);
//         setIsLoading(false);
//         setIsCurrentSemesterLoading(false);
//       } catch (error) {
//         message.error("Error fetching data");
//         setIsLoading(false);
//       }
//     };
//     loadInitialData();
//   }, []);

//   const handleAddButtonClick = (
//     dayId,
//     sessionId,
//     roomId,
//     isTheory,
//     isPracticum,
//     roomName,
//     roomCapacity
//   ) => {
//     setCurrentDayId(dayId);
//     setCurrentSessionId(sessionId);
//     setCurrentRoomId(roomId);
//     setIsTheory(isTheory);
//     setIsPracticum(isPracticum);
//     setCurrentRoomName(roomName);
//     setCurrentRoomCapacity(roomCapacity);
//     setIsModalOpen(true); // Show modal when button is clicked
//   };

//   const handleModalClose = () => {
//     setIsModalOpen(false);
//   };

//   // Fetch departments based on selected faculty
//   const loadDepartmentsByFaculty = async (facultyId) => {
//     setIsDepartmentLoading(true);
//     try {
//       const response = await axios.get(API_DEPARTMENT_BY_FACULTY(facultyId));
//       const departments = response.data.map((dept) => ({
//         value: dept.id,
//         label: dept.departmentName,
//       }));
//       setDepartmentOptions(departments);
//       setIsDepartmentLoading(false);
//     } catch (error) {
//       message.error("Gagal memuat data jurusan data!");
//       setIsDepartmentLoading(false);
//     }
//   };

//   // Fetch period
//   const loadPeriod = async (curriculumId) => {
//     setIsPeriodLoading(true);
//     try {
//       const response = await axios.get(
//         API_ACADEMIC_PERIOD_BY_CURRICULUM(curriculumId)
//       );
//       const periods = response.data.map((per) => ({
//         value: per.id,
//         label: per.academicYear,
//       }));
//       setAcademicPeriodOptions(periods);
//       setIsPeriodLoading(false);
//     } catch (error) {
//       message.error("Gagal memuat data fakultas!");
//       setIsPeriodLoading(false);
//     }
//   };

//   const fetchSemesterTypes = async () => {
//     setIsCurrentSemesterLoading(true);
//     try {
//       const response = await axios.get(API_SEMESTER_TYPE);
//       const semester = response.data.map((per) => ({
//         value: per.id,
//         label: per.typeName,
//       }));
//       setSemesterTypeOptions(semester);
//       setIsCurrentSemesterLoading(false);
//     } catch (error) {
//       message.error("Gagal memuat data semester!");
//       setIsCurrentSemesterLoading(false);
//     }
//   };

//   // Fetch faculties
//   const loadFaculties = async () => {
//     setIsFacultyLoading(true);
//     try {
//       const response = await axios.get(API_FACULTY);
//       const faculties = response.data.map((fac) => ({
//         value: fac.id,
//         label: fac.facultyName,
//       }));
//       setFacultyOptions(faculties);
//       setIsFacultyLoading(false);
//     } catch (error) {
//       message.error("Gagal memuat data fakultas!");
//       setIsFacultyLoading(false);
//     }
//   };

//   // Fetch rooms based on selected department
//   const loadRoomsByDepartment = async (departmentId) => {
//     setIsLoading(true);
//     try {
//       const roomResponse = await axios.get(
//         API_ROOM_BY_DEPARTMENT(departmentId)
//       );
//       setRoomOptions(roomResponse.data);
//       setIsLoading(false);
//     } catch (error) {
//       message.error("Error fetching rooms");
//       setIsLoading(false);
//     }
//   };

//   // Fetch the schedule for a selected day
//   const loadScheduleByDay = async (dayId) => {
//     setIsLoading(true);
//     try {
//       const scheduleResponse = await axios.get(
//         API_SCHEDULE_BY_SCHEDULE_DAY_BY_DEPARTMENT_BY_PERIOD(
//           dayId,
//           selectedDepartment,
//           currentPeriodId,
//           currentSemesterId
//         )
//       );
//       setScheduleData(scheduleResponse.data);
//       setIsLoading(false);
//     } catch (error) {
//       message.error("Error fetching schedule");
//       setIsLoading(false);
//     }
//   };

//   const handleDeleteSchedule = async (scheduleId) => {
//     try {
//       const response = await axios.delete(API_SCHEDULE_BY_ID(scheduleId));
//       message.success("Schedule deleted successfully!");
//       loadScheduleByDay(currentDayId); // Reload the schedule data
//     } catch (error) {
//       message.error("Failed to delete schedule.");
//     }
//   };

//   // const handlePostSchedule = async (
//   //   departmentId,
//   //   curriculumId,
//   //   semesterTypeId,
//   //   academicPeriodId,
//   //   selectedDay
//   // ) => {
//   //   setIsLoading(true);
//   //   try {
//   //     // Pertama, ambil data yang diperlukan
//   //     const classLecturers = await axios.get(`/api/class-lecturer?departmentId=${departmentId}`);
//   //     const rooms = await axios.get('/api/room');
//   //     const scheduleDays = await axios.get('/api/schedule-day');
//   //     const scheduleSessions = await axios.get('/api/schedule-session');
  
//   //     // Kirim ke Python service
//   //     const postSchedule = await axios.post(
//   //       'http://localhost:8000/api/generate-schedule',  // URL langsung
//   //       {
//   //         departmentId,
//   //         curriculumId,
//   //         semesterTypeId,
//   //         academicPeriodId,
//   //         scheduleDays: scheduleDays.data,
//   //         scheduleSessions: scheduleSessions.data,
//   //         rooms: rooms.data,
//   //         classLecturers: classLecturers.data
//   //       }
//   //     );
  
//   //     // Jika berhasil, kirim ke API route Next.js
//   //     if (postSchedule.data.schedule) {
//   //       await axios.post('/api/schedule/generate', {  // Perbaiki path
//   //         schedules: postSchedule.data.schedule
//   //       });
//   //     }
  
//   //     setIsLoading(false);
//   //     loadScheduleByDay(selectedDay?.id);
//   //     message.success("Jadwal berhasil di generate!");
//   //   } catch (error) {
//   //     console.error('Error details:', error.response?.data || error.message);
//   //     setIsLoading(false);
//   //     loadScheduleByDay(selectedDay?.id);
//   //     message.error("Jadwal gagal di generate!");
//   //   }
//   // };

//   // const handlePostSchedule = async (
//   //   departmentId,
//   //   curriculumId,
//   //   semesterTypeId,
//   //   academicPeriodId,
//   //   selectedDay
//   // ) => {
//   //   setIsLoading(true);
//   //   try {
//   //     // Ambil semua data yang diperlukan secara parallel
//   //     const [classLecturersRes, roomsRes, scheduleDaysRes, scheduleSessionsRes] = 
//   //       await Promise.all([
//   //         axios.get(`/api/class-lecturer?departmentId=${departmentId}`),
//   //         axios.get('/api/room'),
//   //         axios.get('/api/schedule-day'),
//   //         axios.get('/api/schedule-session')
//   //       ]);
      
//   //     // Log data sebelum dikirim
//   //     console.log("Data yang akan dikirim ke Python service:", {
//   //       rooms: roomsRes.data,
//   //       scheduleDays: scheduleDaysRes.data,
//   //       scheduleSessions: scheduleSessionsRes.data,
//   //       classLecturers: classLecturersRes.data
//   //     });
      
//   //     // Persiapkan payload untuk Python service
//   //     const payload = {
//   //       rooms: roomsRes.data,
//   //       scheduleDays: scheduleDaysRes.data,
//   //       scheduleSessions: scheduleSessionsRes.data,
//   //       classLecturers: classLecturersRes.data,
//   //       departmentId,
//   //       curriculumId,
//   //       semesterTypeId,
//   //       academicPeriodId,
//   //     };
      
//   //     // Validasi payload
//   //     if (!payload.rooms?.length) throw new Error('Data ruangan tidak tersedia');
//   //     if (!payload.scheduleDays?.length) throw new Error('Data hari tidak tersedia');
//   //     if (!payload.scheduleSessions?.length) throw new Error('Data sesi tidak tersedia');
//   //     if (!payload.classLecturers?.length) throw new Error('Data kelas dan dosen tidak tersedia');
      
//   //     // Kirim ke Python service
//   //     const { data: generatedSchedule } = await axios.post(
//   //       AUTO_GENERATE_SERVICE(departmentId, curriculumId, semesterTypeId, academicPeriodId),
//   //       payload,
//   //       {
//   //         headers: {
//   //           'Content-Type': 'application/json'
//   //         }
//   //       }
//   //     );
      
//   //     // Log response dari Python service secara detail
//   //     console.log("Response detail dari Python service:", JSON.stringify(generatedSchedule, null, 2));
      
//   //     // Validasi response dari Python service
//   //     if (!generatedSchedule.schedule || !Array.isArray(generatedSchedule.schedule)) {
//   //       throw new Error('Response dari generator jadwal tidak valid: schedule harus berupa array');
//   //     }
  
//   //     // Log contoh data pertama dari Python service
//   //     if (generatedSchedule.schedule.length > 0) {
//   //       console.log("Contoh data dari Python:", generatedSchedule.schedule[0]);
//   //     }
      
//   //     // Ubah format data sesuai dengan struktur tabel schedules
//   //     const formattedSchedules = generatedSchedule.schedule.map((schedule, index) => {
//   //       // Log setiap transformasi data
//   //       console.log(`Transformasi data ke-${index}:`, schedule);
        
//   //       const formatted = {
//   //         scheduleDayId: Number(schedule.dayId),
//   //         scheduleSessionId: Number(schedule.sessionId),
//   //         roomId: Number(schedule.roomId),
//   //         classIdLecturer: Number(schedule.classLecturerId)
//   //       };
        
//   //       console.log(`Hasil transformasi ke-${index}:`, formatted);
//   //       return formatted;
//   //     });
      
//   //     // Log hasil transformasi
//   //     console.log("Data yang akan dikirim ke API:", JSON.stringify(formattedSchedules, null, 2));
      
//   //     // Validasi struktur data jadwal
//   //     const validasiJadwal = (jadwal) => {
//   //       const isValid = jadwal 
//   //         && Number.isInteger(jadwal.scheduleDayId)
//   //         && Number.isInteger(jadwal.scheduleSessionId)
//   //         && Number.isInteger(jadwal.roomId)
//   //         && Number.isInteger(jadwal.classIdLecturer)
//   //         && jadwal.scheduleDayId > 0
//   //         && jadwal.scheduleSessionId > 0
//   //         && jadwal.roomId > 0
//   //         && jadwal.classIdLecturer > 0;
  
//   //       if (!isValid) {
//   //         console.log("Data jadwal tidak valid:", jadwal);
//   //       }
        
//   //       return isValid;
//   //     };
  
//   //     if (!formattedSchedules.every(validasiJadwal)) {
//   //       throw new Error('Format jadwal tidak valid setelah transformasi');
//   //     }
      
//   //     // Kirim ke Next.js API untuk disimpan ke database
//   //     const result = await axios.post('/api/schedule/generate', {
//   //       schedules: formattedSchedules
//   //     });
      
//   //     console.log("Response dari Next.js API:", result.data);
//   //     message.success("Jadwal berhasil di generate!"); 
      
//   //   } catch (error) {
//   //     console.error("Error saat generate jadwal:", error);
//   //     console.error("Detail error:", {
//   //       message: error.message,
//   //       response: error.response?.data
//   //     });
      
//   //     // Tampilkan pesan error yang lebih detail
//   //     message.error(
//   //       error.response?.data?.detail ||
//   //       error.response?.data?.error ||
//   //       error.message ||
//   //       "Jadwal gagal di generate!"
//   //     );
//   //   } finally {
//   //     setIsLoading(false);
//   //   }
//   // };

//   const handlePostSchedule = async (
//     departmentId,
//     curriculumId,
//     semesterTypeId,
//     academicPeriodId,
//     selectedDay
//   ) => {
//     setIsLoading(true);
//     setExecutionTime(null);
//     const startTime = performance.now();
//     try {
//       // Ambil semua data yang diperlukan secara parallel
//       const [classLecturersRes, roomsRes, scheduleDaysRes, scheduleSessionsRes] = 
//         await Promise.all([
//           axios.get(`/api/class-lecturer?departmentId=${departmentId}`),
//           axios.get('/api/room'),
//           axios.get('/api/schedule-day'),
//           axios.get('/api/schedule-session')
//         ]);
      
//       const payload = {
//         rooms: roomsRes.data,
//         scheduleDays: scheduleDaysRes.data,
//         scheduleSessions: scheduleSessionsRes.data,
//         classLecturers: classLecturersRes.data,
//         departmentId,
//         curriculumId,
//         semesterTypeId,
//         academicPeriodId,
//       };
      
//       // Validasi payload
//       if (!payload.rooms?.length) throw new Error('Data ruangan tidak tersedia');
//       if (!payload.scheduleDays?.length) throw new Error('Data hari tidak tersedia');
//       if (!payload.scheduleSessions?.length) throw new Error('Data sesi tidak tersedia');
//       if (!payload.classLecturers?.length) throw new Error('Data kelas dan dosen tidak tersedia');
      
//       // Kirim ke Python service
//       const { data: generatedSchedule } = await axios.post(
//         AUTO_GENERATE_SERVICE(departmentId, curriculumId, semesterTypeId, academicPeriodId),
//         payload,
//         {
//             headers: {
//                 'Content-Type': 'application/json'
//             }
//         }
//       );

//       const endTime = performance.now();
//       setExecutionTime(((endTime - startTime) / 1000).toFixed(2)); // Simpan waktu eksekusi dalam detik

//       message.success(`Jadwal berhasil digenerate dalam ${executionTime} detik!`);

//       console.log("Full Python response:", {
//         scheduleLength: generatedSchedule.schedule?.length,
//         sampleSchedule: generatedSchedule.schedule?.[0],
//         fitness: generatedSchedule.fitness
//       });
      
//       console.log("Data mentah dari Python:", generatedSchedule.schedule);
      
//       // Validasi response dari Python service
//       // if (!generatedSchedule.schedule || !Array.isArray(generatedSchedule.schedule)) {
//       //   throw new Error('Response dari generator jadwal tidak valid: schedule harus berupa array');
//       // }
  
//       // Filter dan transformasi data
//         const batchSize = 10;
//         const formattedSchedules = generatedSchedule.schedule.filter(schedule => {
//           // Filter data yang tidak valid
//           const isValid = 
//             schedule.scheduleDayId > 0 && 
//             schedule.scheduleSessionId > 0 && 
//             schedule.roomId > 0 && 
//             schedule.classLecturerId > 0;

//           if (!isValid) {
//             console.log("Data jadwal dilewati karena tidak valid:", schedule);
//           }
          
//           return isValid;
//         })
//         // .map(schedule => ({
//         //   scheduleDayId: Number(schedule.dayId),
//         //   scheduleSessionId: Number(schedule.sessionId),
//         //   roomId: Number(schedule.roomId),
//         //   classIdLecturer: Number(schedule.classLecturerId)
//         // }));

//         if (formattedSchedules.length === 0) {
//           throw new Error('Tidak ada jadwal valid yang bisa diproses');
//         }

//         console.log(`Mengirim ${formattedSchedules.length} jadwal ke API`);
//         console.log("Contoh data jadwal:", formattedSchedules[0]);

//         // Kirim dalam batch untuk menghindari request terlalu besar
//         const batches = [];
//         for (let i = 0; i < formattedSchedules.length; i += batchSize) {
//           batches.push(formattedSchedules.slice(i, i + batchSize));
//         }

//         console.log(`Membagi ${formattedSchedules.length} data menjadi ${batches.length} batch`);

//         // Proses setiap batch secara berurutan
//         let successCount = 0;
//         let failedBatches = 0;
//         for (let i = 0; i < batches.length; i++) {
//           const batch = batches[i];
//           try {
//             console.log(`Memproses batch ${i + 1}/${batches.length}`);
            
//             const response = await axios.post('/api/schedule/generate', {
//               schedules: batch
//             });
        
//         successCount += response.data.schedules?.length || 0;
//         console.log(`Batch ${i + 1} berhasil: ${response.data.schedules?.length} jadwal`);
//         } catch (error) {
//           console.error(`Error pada batch ${i + 1}:`, error.response?.data || error.message);
//           failedBatches++;
//           // Continue with next batch instead of throwing
//           continue;
//         }
//     }

//     if (successCount > 0) {
//       message.success(`Berhasil generate ${successCount} jadwal!`);
//     }
//     if (failedBatches > 0) {
//       message.warning(`${failedBatches} batch gagal diproses. Total jadwal berhasil: ${successCount}`);
//     }

//     message.success(`Berhasil generate ${successCount} jadwal!`);
  
//       } catch (error) {
//         console.error("Error detail:", {
//           message: error.message,
//           status: error.response?.status,
//           data: error.response?.data
//         });
        
//         let errorMessage = "Jadwal gagal di generate! ";
//     if (error.response?.data?.error) {
//       errorMessage += error.response.data.error;
//     } else if (error.response?.data?.detail) {
//       errorMessage += error.response.data.detail;
//     } else if (error.message) {
//       errorMessage += error.message;
//     }
        
//         message.error(errorMessage);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//   // Handle department selection and fetch rooms
//   const handleDepartmentChange = (departmentId) => {
//     setSelectedDepartment(departmentId);
//     setSelectedDay(null); // Reset selected day when department changes
//     loadRoomsByDepartment(departmentId); // Fetch rooms for the selected department
//   };

//   // Handle day selection and fetch schedule
//   const handleDaySelection = (day) => {
//     setSelectedDay(day);
//     loadScheduleByDay(day.id); // Fetch the schedule for the selected day
//   };

//   // Generate table columns dynamically based on rooms
//   const columns = [
//     {
//       title: <div className="text-center">Waktu/Sesi</div>,
//       dataIndex: "sessionNumber",
//       width: 150,
//       key: "sessionNumber",
//       fixed: "left",
//       render: (_, record) => <div className="text-center">{record.time}</div>,
//     },
//     ...roomOptions.map((room) => ({
//       title: <div className="text-center">{room.roomName}</div>,
//       dataIndex: room.id,
//       width: 300,
//       key: room.id,
//       render: (_, record) => {
//         const scheduleItem = record.schedules.find(
//           (sch) => sch.roomId === room.id
//         );
//         return scheduleItem ? (
//           <div className="flex flex-col justify-center h-32 text-center items-center">
//             <div className="text-lg font-bold">
//               {scheduleItem.classLecturer.class.subSubject.subject?.subjectName}{" "}
//               {scheduleItem.classLecturer.class.subSubject.subjectType?.typeName}{" "}
//               {scheduleItem.classLecturer.class.studyProgramClass?.className}
//             </div>
//             <div className="text-gray-500 text-sm">
//               Dosen Pengampu:
//               <div>
//                 1. {scheduleItem.classLecturer.primaryLecturer?.lecturerName}
//               </div>
//               <div>
//                  {!scheduleItem.classLecturer.secondaryLecturer ? null : `2. ${scheduleItem.classLecturer.secondaryLecturer?.lecturerName}`}
//               </div>
//             </div>
//             <Popconfirm
//               title="Apakah anda yakin?"
//               onConfirm={() => handleDeleteSchedule(scheduleItem.id)}
//               okText="Yes"
//               cancelText="No"
//             >
//               <Button className="mt-2" size="small" danger>
//                 Hapus
//               </Button>
//             </Popconfirm>
//           </div>
//         ) : (
//           <div className="flex justify-center items-center rounded-lg h-32">
//             {/* <Button
//               onClick={() =>
//                 handleAddButtonClick(
//                   selectedDay.id,
//                   record.sessionNumber,
//                   room.id,
//                   room.isTheory,
//                   room.isPracticum,
//                   room.roomName,
//                   room.roomCapacity
//                 )
//               }
//             >
//               Tambah Data
//             </Button> */}
//             <Button>Kosong</Button>
//           </div>
//         );
//       },
//     })),
//   ];
//   // Prepare data for the table
//   const dataSource = sessionOptions
//     .sort((a, b) => a.sessionNumber - b.sessionNumber) // Sort by sessionNumber
//     .map((session) => {
//       const rowData = {
//         key: session.id,
//         sessionNumber: session.sessionNumber, // Add session number for indexing
//         time: `${session.startTime} - ${session.endTime}`,
//         schedules: scheduleData.filter(
//           (sch) => sch.scheduleSessionId === session.id
//         ), // Filter schedules for this session
//       };

//       return rowData;
//     });

//   return (
//     <ConfigProvider
//       theme={{
//         components: {
//           Table: {
//             headerBg: "#1677ff",
//             headerColor: "#fff",
//             borderColor: "#bfbfbf",
//           },
//         },
//       }}
//     >
//       <div>
//         <div className="flex items-center">
//           <h1 className="text-2xl font-bold mb-8 flex">
//             <div className="bg-blue-500 px-1 mr-2">&nbsp;</div>Kelola Jadwal
//           </h1>
//         </div>

//         <div className="mb-8 lg:flex gap-8">
//           <Select
//             className="mb-2 w-full shadow-lg border-b-4 border-blue-500"
//             showSearch
//             placeholder="Kurikulum"
//             value={currentCurriculumId}
//             filterOption={(input, option) =>
//               (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
//             }
//             options={curriculumOptions.map((curr) => ({
//               value: curr.id,
//               label: curr.curriculumName,
//             }))}
//             notFoundContent={
//               isLoading ? <Spin size="small" /> : "Tidak ada data!"
//             }
//             onChange={(value) => {
//               setCurrentCurriculumId(value);
//               setCurrentPeriodId(null);
//               setSelectedFaculty(null);
//               setSelectedDepartment(null);
//               setSelectedDay(null);
//               loadPeriod(value);
//             }}
//           />
//           <Select
//             className="mb-2 w-full shadow-lg border-b-4 border-blue-500"
//             showSearch
//             placeholder={"Tahun Akademik"}
//             value={currentPeriodId} // Show selected period
//             filterOption={(input, option) =>
//               (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
//             }
//             options={academicPeriodOptions}
//             onChange={(value) => {
//               setCurrentPeriodId(value);
//               setSelectedFaculty(null);
//               setSelectedDepartment(null);
//               setSelectedDay(null);
//               fetchSemesterTypes();
//               loadFaculties();
//             }}
//             notFoundContent={
//               isPeriodLoading ? <Spin size="small" /> : "Tidak ada data!"
//             }
//             loading={isPeriodLoading}
//             disabled={currentCurriculumId === null}
//           />
//           <Select
//             className="mb-2 w-full shadow-lg border-b-4 border-blue-500"
//             showSearch
//             placeholder={"Semester"}
//             value={currentSemesterId} // Show selected period
//             filterOption={(input, option) =>
//               (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
//             }
//             options={semesterTypeOptions}
//             onChange={(value) => {
//               setCurrentSemesterId(value);
//             }}
//             notFoundContent={
//               isSemesterLoading ? <Spin size="small" /> : "Tidak ada data!"
//             }
//             loading={isSemesterLoading}
//             disabled={currentPeriodId === null}
//           />
//           <Select
//             notFoundContent={
//               isFacultyLoading ? <Spin size="small" /> : "Tidak ada data!"
//             }
//             className="mb-2 w-full shadow-lg border-b-4 border-blue-500"
//             showSearch
//             placeholder={"Fakultas"}
//             value={selectedFaculty}
//             filterOption={(input, option) =>
//               (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
//             }
//             options={facultyOptions}
//             onChange={(value) => {
//               setSelectedFaculty(value);
//               loadDepartmentsByFaculty(value);
//               setSelectedDepartment(null);
//               setSelectedDay(null);
//             }}
//             loading={isFacultyLoading}
//             disabled={currentPeriodId === null} // Disable when periodId is null
//           />
//           <Select
//             showSearch
//             className="mb-2 w-full shadow-lg border-b-4 border-blue-500"
//             disabled={!selectedFaculty}
//             placeholder={"Jurusan"}
//             filterOption={(input, option) =>
//               (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
//             }
//             options={departmentOptions}
//             value={selectedDepartment} // Set the selected department value
//             notFoundContent={
//               isDepartmentLoading ? <Spin size="small" /> : "Tidak ada data!"
//             }
//             onSelect={(value) => {
//               setSelectedDay(null); // Clear selected day when department is changed
//               handleDepartmentChange(value); // Set department and fetch rooms
//             }}
//           />
//         </div>

//         {isLoading ? (
//           <Spin />
//         ) : (
//           <>
//             {/* Day buttons */}
//             {selectedDepartment && (
//               <>
//                 <div className="mb-4 justify-between flex">
//                   {dayOptions.map((day) => (
//                     <Button
//                       key={day.id}
//                       type={selectedDay?.id === day.id ? "primary" : "text"}
//                       onClick={() => handleDaySelection(day)}
//                       className="mr-2 mb-2 border-b-4 border-gray-600"
//                     >
//                       {day.day}
//                     </Button>
//                   ))}
//                   <Button
//                     onClick={() => handlePostSchedule(
//                       selectedDepartment,
//                       currentCurriculumId,
//                       currentSemesterId,
//                       currentPeriodId,
//                       selectedDay
//                     )}
//                     className="mr-2 mb-2 border-b-4 border-gray-600"
//                     type="primary"
//                     loading={isLoading}
//                     disabled={!scheduleData || scheduleData?.length > 1 || !selectedDay}
//                   >
//                     {isLoading ? 'Sedang Memproses...' : 'Buat Jadwal Otomatis'}
//                   </Button>
//                 </div>

//                 {/* Show the table only when a day is selected */}
//                 {!selectedDay && (
//                   <>
//                     <h2 className="text-xl text-gray-500 font-semibold mb-2">
//                       Pilih Hari!
//                     </h2>
//                   </>
//                 )}
//                 {selectedDay && (
//                   <>
//                     <Table
//                       className="shadow-xl rounded-xl"
//                       columns={columns}
//                       dataSource={dataSource}
//                       bordered
//                       pagination={false}
//                       scroll={{ x: "max-content", y: 500 }} // Horizontal scroll enabled
//                     />
//                   </>
//                 )}
//               </>
//             )}

//             {executionTime && (
//               <p className="mt-4 text-green-600">
//                 Jadwal berhasil digenerate dalam {executionTime} detik.
//               </p>
//             )}

//             {!selectedDepartment && (
//               <>
//                 <h2 className="text-xl text-gray-500 font-semibold mb-2">
//                   Pilih Jurusan Terlebih Dahulu!
//                 </h2>
//               </>
//             )}
//           </>
//         )}

//         <PostSchedule
//           open={isModalOpen}
//           onClose={handleModalClose}
//           scheduleDayId={currentDayId}
//           scheduleSessionId={currentSessionId}
//           roomId={currentRoomId}
//           departmentId={selectedDepartment}
//           curriculumId={currentCurriculumId}
//           isTheory={isTheory}
//           isPracticum={isPracticum}
//           roomName={currentRoomName}
//           roomCapacity={currentRoomCapacity}
//           scheduleData={scheduleData}
//           onSuccess={() => loadScheduleByDay(currentDayId)}
//         />
//       </div>
//     </ConfigProvider>
//   );
// };

// export default ScheduleMatrix;