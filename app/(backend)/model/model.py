# import pygad
# import random

# def genetic_schedule(data):
#     # Extract data
#     schedule_days = data["scheduleDays"]
#     schedule_sessions = data["scheduleSessions"]
#     rooms = data["rooms"]
#     class_lecturers = data["classLecturers"]

#     # Representasi gen: [day_id, session_id, room_id] untuk setiap kelas
#     num_genes = len(class_lecturers) * 3  # day_id, session_id, room_id per class

#     # Fungsi untuk membuat solusi acak
#     def create_random_solution():
#         solution = []
#         for _ in class_lecturers:
#             day = random.choice(schedule_days)["id"]
#             session = random.choice(schedule_sessions)["id"]
#             room = random.choice(rooms)["id"]
#             solution.extend([day, session, room])
#         return solution

#     # Fungsi fitness
#     def fitness_func(solution, solution_idx):
#         penalty = 0

#         # Decode solution
#         decoded_schedule = []
#         for i in range(0, len(solution), 3):
#             decoded_schedule.append({
#                 "day_id": int(solution[i]),
#                 "session_id": int(solution[i+1]),
#                 "room_id": int(solution[i+2]),
#                 "classLecturerId": class_lecturers[i // 3]["id"]
#             })

#         # Constraint 1: Tidak ada kelas pada hari Jumat sesi 3
#         for schedule in decoded_schedule:
#             day = next(d for d in schedule_days if d["id"] == schedule["day_id"])
#             session = next(s for s in schedule_sessions if s["id"] == schedule["session_id"])
#             if day["day"] == "Jumat" and session["sessionNumber"] == 3:
#                 penalty += 10  # Penalti untuk pelanggaran

#         # Constraint 2: Tidak ada konflik ruangan
#         for day_id in {s["day_id"] for s in decoded_schedule}:
#             for session_id in {s["session_id"] for s in decoded_schedule if s["day_id"] == day_id}:
#                 rooms_used = [
#                     s["room_id"] for s in decoded_schedule
#                     if s["day_id"] == day_id and s["session_id"] == session_id
#                 ]
#                 if len(rooms_used) != len(set(rooms_used)):
#                     penalty += 20  # Penalti untuk konflik ruangan
                    
#         # Constraint 3: Tidak ada konflik dosen
#         for day_id in {s["day_id"] for s in decoded_schedule}:
#             for session_id in {s["session_id"] for s in decoded_schedule if s["day_id"] == day_id}:
#                 lecturers_used = [
#                     c["primaryLecturerId"]
#                     for c in class_lecturers
#                     if c["id"] in [
#                         s["classLecturerId"]
#                         for s in decoded_schedule
#                         if s["day_id"] == day_id and s["session_id"] == session_id
#                     ]
#                 ]
#                 if len(lecturers_used) != len(set(lecturers_used)):
#                     penalty += 20  # Penalti untuk konflik dosen
       
#         # Constraint 4: Kapasitas ruang harus lebih besar dari jumlah mahasiswa pada kelas
#         for schedule in decoded_schedule:
#             room = next(r for r in rooms if r["id"] == schedule["room_id"])
#             class_lecturer = next(c for c in class_lecturers if c["id"] == schedule["classLecturerId"])
            
#             # Asumsi bahwa setiap class_lecturer memiliki atribut 'student_count' yang menunjukkan jumlah mahasiswa
#             if room["capacity"] < class_lecturer["student_count"]:
#                 penalty += 10  # Penalti jika kapasitas ruang lebih kecil dari jumlah mahasiswa

#         # Constraint 5: Ruang kelas hanya menampilkan dan menerima subSubject teori dan responsi
#         for schedule in decoded_schedule:
#             if schedule["subject"]["type"] not in ["teori", "responsi"]:
#                 penalty += 10  # Penalti jika subSubject bukan teori atau responsi pada ruang kelas

#         # Constraint 6: Mata kuliah praktikum, satu kelas memakai dua ruang lab
#         for schedule in decoded_schedule:
#             if schedule["subject"]["type"] == "praktikum":
#                 lab_rooms_used = [s["room_id"] for s in decoded_schedule if s["classLecturerId"] == schedule["classLecturerId"] and s["subject"]["type"] == "praktikum"]
#                 if len(lab_rooms_used) != 2:
#                     penalty += 10  # Penalti jika kelas praktikum tidak memakai dua ruang lab

#         # Constraint 7: Ruang lab hanya menampilkan dan menerima subSubject praktikum
#         for schedule in decoded_schedule:
#             room = next(r for r in rooms if r["id"] == schedule["room_id"])
#             if room["type"] != "lab" and schedule["subject"]["type"] == "praktikum":
#                 penalty += 10  # Penalti jika ruang lab digunakan untuk subSubject selain praktikum

#         # Constraint 8: Satu kelas praktikum dapat menggunakan lebih dari satu ruang lab
#         for schedule in decoded_schedule:
#             if schedule["subject"]["type"] == "praktikum":
#                 lab_rooms_used = [s["room_id"] for s in decoded_schedule if s["classLecturerId"] == schedule["classLecturerId"] and s["subject"]["type"] == "praktikum"]
#                 if len(set(lab_rooms_used)) > 1:
#                     penalty += 5  # Penalti untuk menggunakan lebih dari satu ruang lab, jika tidak sesuai dengan aturan

#         return 1.0 / (1.0 + penalty)  # Semakin kecil penalti, semakin baik fitness

#     # Parameter GA
#     ga_instance = pygad.GA(
#         num_generations=100,
#         num_parents_mating=10,
#         fitness_func=fitness_func,
#         sol_per_pop=50,
#         num_genes=num_genes,
#         gene_type=int,
#         init_range_low=1,
#         init_range_high=max(max([d["id"] for d in schedule_days]),
#                             max([s["id"] for s in schedule_sessions]),
#                             max([r["id"] for r in rooms])),
#         mutation_percent_genes=10,
#         mutation_type="random",
#         on_generation=lambda ga_instance: print(f"Generation {ga_instance.generations_completed}: Best Fitness = {ga_instance.best_solution()[1]}")
#     )

#     # Run the GA
#     ga_instance.run()

#     # Decode the best solution
#     best_solution, best_fitness, _ = ga_instance.best_solution()
#     decoded_schedule = []
#     for i in range(0, len(best_solution), 3):
#         decoded_schedule.append({
#             "day_id": int(best_solution[i]),
#             "session_id": int(best_solution[i + 1]),
#             "room_id": int(best_solution[i + 2]),
#             "classLecturerId": class_lecturers[i // 3]["id"],
#             "subject": class_lecturers[i // 3]["subject"],
#         })

#     return decoded_schedule

from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from ..db import Base

class Faculty(Base):
    __tablename__ = "faculties"
    id = Column(Integer, primary_key=True, index=True)
    facultyName = Column(String)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow)
    
    departments = relationship("Department", back_populates="faculty")

class Department(Base):
    __tablename__ = "departments"
    id = Column(Integer, primary_key=True, index=True)
    departmentName = Column(String)
    facultyId = Column(Integer, ForeignKey("faculties.id"))
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow)
    
    faculty = relationship("Faculty", back_populates="departments")
    studyPrograms = relationship("StudyProgram", back_populates="department")
    rooms = relationship("Room", back_populates="department")
    lecturers = relationship("Lecturer", back_populates="department")

class StudyProgram(Base):
    __tablename__ = "studyPrograms"
    id = Column(Integer, primary_key=True, index=True)
    studyProgramName = Column(String)
    departmentId = Column(Integer, ForeignKey("departments.id"))
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow)
    
    department = relationship("Department", back_populates="studyPrograms")
    subjects = relationship("Subject", back_populates="studyProgram")
    studyProgramClasses = relationship("StudyProgramClass", back_populates="studyProgram")

class Curriculum(Base):
    __tablename__ = "curriculums"
    id = Column(Integer, primary_key=True, index=True)
    curriculumName = Column(String)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow)
    
    subjects = relationship("Subject", back_populates="curriculum")
    academicPeriods = relationship("AcademicPeriod", back_populates="curriculum")

class SemesterType(Base):
    __tablename__ = "semesterTypes"
    id = Column(Integer, primary_key=True, index=True)
    typeName = Column(String)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow)
    
    semesters = relationship("Semester", back_populates="semesterType")
    academicPeriods = relationship("AcademicPeriod", back_populates="semesterType")

class Semester(Base):
    __tablename__ = "semesters"
    id = Column(Integer, primary_key=True, index=True)
    semesterName = Column(Integer)
    semesterTypeId = Column(Integer, ForeignKey("semesterTypes.id"))
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow)
    
    semesterType = relationship("SemesterType", back_populates="semesters")
    subjects = relationship("Subject", back_populates="semester")
    assistants = relationship("Assistant", back_populates="semester")

class StudyProgramClass(Base):
    __tablename__ = "studyProgramClasses"
    id = Column(Integer, primary_key=True, index=True)
    className = Column(String)
    studyProgramId = Column(Integer, ForeignKey("studyPrograms.id"))
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow)
    
    studyProgram = relationship("StudyProgram", back_populates="studyProgramClasses")
    assistants = relationship("Assistant", back_populates="studyProgramClass")
    classes = relationship("Class", back_populates="studyProgramClass")

class Subject(Base):
    __tablename__ = "subjects"
    id = Column(Integer, primary_key=True, index=True)
    subjectCode = Column(String)
    subjectName = Column(String)
    subjectSKS = Column(Integer)
    subjectCategory = Column(String)
    curriculumId = Column(Integer, ForeignKey("curriculums.id"))
    studyProgramId = Column(Integer, ForeignKey("studyPrograms.id"))
    semesterId = Column(Integer, ForeignKey("semesters.id"))
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow)
    
    curriculum = relationship("Curriculum", back_populates="subjects")
    studyProgram = relationship("StudyProgram", back_populates="subjects")
    semester = relationship("Semester", back_populates="subjects")
    subSubjects = relationship("SubSubject", back_populates="subject")

class SubjectType(Base):
    __tablename__ = "subjectTypes"
    id = Column(Integer, primary_key=True, index=True)
    typeName = Column(String)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow)
    
    subSubjects = relationship("SubSubject", back_populates="subjectType")

class SubSubject(Base):
    __tablename__ = "subSubjects"
    id = Column(Integer, primary_key=True, index=True)
    subjectTypeId = Column(Integer, ForeignKey("subjectTypes.id"))
    subjectId = Column(Integer, ForeignKey("subjects.id"))
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow)
    
    subjectType = relationship("SubjectType", back_populates="subSubjects")
    subject = relationship("Subject", back_populates="subSubjects")
    classes = relationship("Class", back_populates="subSubject")

class Room(Base):
    __tablename__ = "rooms"
    id = Column(Integer, primary_key=True, index=True)
    roomName = Column(String)
    roomCapacity = Column(Integer)
    isPracticum = Column(Boolean)
    isTheory = Column(Boolean)
    isResponse = Column(Boolean)
    departmentId = Column(Integer, ForeignKey("departments.id"))
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow)
    
    department = relationship("Department", back_populates="rooms")
    schedules = relationship("Schedule", back_populates="room")

class AcademicPeriod(Base):
    __tablename__ = "academicPeriods"
    id = Column(Integer, primary_key=True, index=True)
    academicYear = Column(Integer)
    curriculumId = Column(Integer, ForeignKey("curriculums.id"))
    semesterTypeId = Column(Integer, ForeignKey("semesterTypes.id"))
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow)
    
    curriculum = relationship("Curriculum", back_populates="academicPeriods")
    semesterType = relationship("SemesterType", back_populates="academicPeriods")
    classes = relationship("Class", back_populates="academicPeriod")

class Class(Base):
    __tablename__ = "classes"
    id = Column(Integer, primary_key=True, index=True)
    classCapacity = Column(Integer)
    studyProgramClassId = Column(Integer, ForeignKey("studyProgramClasses.id"))
    subSubjectId = Column(Integer, ForeignKey("subSubjects.id"))
    academicPeriodId = Column(Integer, ForeignKey("academicPeriods.id"))
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow)
    
    studyProgramClass = relationship("StudyProgramClass", back_populates="classes")
    subSubject = relationship("SubSubject", back_populates="classes")
    academicPeriod = relationship("AcademicPeriod", back_populates="classes")
    classLecturers = relationship("ClassLecturer", back_populates="class")

class Assistant(Base):
    __tablename__ = "assistants"
    id = Column(Integer, primary_key=True, index=True)
    assistantName = Column(String)
    assistantNPM = Column(String)
    semesterId = Column(Integer, ForeignKey("semesters.id"))
    studyProgramClassId = Column(Integer, ForeignKey("studyProgramClasses.id"))
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow)
    
    semester = relationship("Semester", back_populates="assistants")
    studyProgramClass = relationship("StudyProgramClass", back_populates="assistants")
    class_lecturers_primary = relationship("ClassLecturer", foreign_keys="ClassLecturer.primaryAssistantId", back_populates="primaryAssistant")
    class_lecturers_secondary = relationship("ClassLecturer", foreign_keys="ClassLecturer.secondaryAssistantId", back_populates="secondaryAssistant")

class Lecturer(Base):
    __tablename__ = "lecturers"
    id = Column(Integer, primary_key=True, index=True)
    lecturerName = Column(String)
    lecturerNIP = Column(String, nullable=True)
    lecturerEmail = Column(String, nullable=True)
    departmentId = Column(Integer, ForeignKey("departments.id"), nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow)
    
    department = relationship("Department", back_populates="lecturers")
    class_lecturers_primary = relationship("ClassLecturer", foreign_keys="ClassLecturer.primaryLecturerId", back_populates="primaryLecturer")
    class_lecturers_secondary = relationship("ClassLecturer", foreign_keys="ClassLecturer.secondaryLecturerId", back_populates="secondaryLecturer")
    users = relationship("User", back_populates="lecturer")

class ClassLecturer(Base):
    __tablename__ = "classLecturers"
    id = Column(Integer, primary_key=True, index=True)
    classId = Column(Integer, ForeignKey("classes.id"))
    primaryLecturerId = Column(Integer, ForeignKey("lecturers.id"))
    secondaryLecturerId = Column(Integer, ForeignKey("lecturers.id"), nullable=True)
    primaryAssistantId = Column(Integer, ForeignKey("assistants.id"), nullable=True)
    secondaryAssistantId = Column(Integer, ForeignKey("assistants.id"), nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow)
    
    class_ = relationship("Class", back_populates="classLecturers")
    primaryLecturer = relationship("Lecturer", foreign_keys=[primaryLecturerId], back_populates="class_lecturers_primary")
    secondaryLecturer = relationship("Lecturer", foreign_keys=[secondaryLecturerId], back_populates="class_lecturers_secondary")
    primaryAssistant = relationship("Assistant", foreign_keys=[primaryAssistantId], back_populates="class_lecturers_primary")
    secondaryAssistant = relationship("Assistant", foreign_keys=[secondaryAssistantId], back_populates="class_lecturers_secondary")
    schedules = relationship("Schedule", back_populates="classLecturer")

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, index=True)
    username = Column(String, unique=True)
    password = Column(String)
    role = Column(String)
    lecturerId = Column(Integer, ForeignKey("lecturers.id"))
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow)
    
    lecturer = relationship("Lecturer", back_populates="users")

class ScheduleSession(Base):
    __tablename__ = "scheduleSessions"
    id = Column(Integer, primary_key=True, index=True)
    startTime = Column(String)
    endTime = Column(String)
    sessionNumber = Column(Integer)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow)
    
    schedules = relationship("Schedule", back_populates="scheduleSession")

class ScheduleDay(Base):
    __tablename__ = "scheduleDays"
    id = Column(Integer, primary_key=True, index=True)
    day = Column(String)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow)
    
    schedules = relationship("Schedule", back_populates="scheduleDay")

class Schedule(Base):
    __tablename__ = "schedules"
    id = Column(Integer, primary_key=True, index=True)
    scheduleDayId = Column(Integer, ForeignKey("scheduleDays.id"))
    scheduleSessionId = Column(Integer, ForeignKey("scheduleSessions.id"))
    roomId = Column(Integer, ForeignKey("rooms.id"))
    classLecturerId = Column(Integer, ForeignKey("classLecturers.id"))
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow)
    
    scheduleDay = relationship("ScheduleDay", back_populates="schedules")
    scheduleSession = relationship("ScheduleSession", back_populates="schedules")
    room = relationship("Room", back_populates="schedules")
    classLecturer = relationship("ClassLecturer", back_populates="schedules")