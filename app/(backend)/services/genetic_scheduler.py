# filter jadwal
from typing import Dict, List, Tuple
import pygad
import random
from validator import ScheduleValidator
from fastapi import HTTPException

class ScheduleGenerator:
    def __init__(self, data: Dict, academic_year: int = None, semester: str = None):
        print(f"Filtering for academic_year: {academic_year}, semester: {semester}")  # Debug
        print(f"Total class_lecturers before filtering: {len(data['classLecturers'])}")  # Debug
        required_fields = ["scheduleDays", "scheduleSessions", "rooms", "classLecturers"]
        for field in required_fields:
            if field not in data:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")

        self.schedule_days = data["scheduleDays"]
        self.schedule_sessions = data["scheduleSessions"]
        self.rooms = data["rooms"]
        # self.class_lecturers = data["classLecturers"]
        self.class_lecturers = [
            cl for cl in data["classLecturers"]
            if (academic_year is None or cl["class"]["academicYear"] == academic_year)
            and (semester is None or cl["class"]["semester"].lower() == semester.lower())
        ]
        if not self.class_lecturers:
            raise HTTPException(
                status_code=400,
                detail=f"No classes found for academic year {academic_year} and semester {semester}"
            )
        
        # Constants
        self.OFFLINE_ROOM_MAX_ID = 11
        self.ONLINE_ROOM_MIN_ID = 12
        self.MAX_SESSIONS_PER_DAY = 3
        self.MAX_CONSECUTIVE_SESSIONS = 2
        
        # Mendapatkan ID hari Jumat
        self.friday_id = next((day["id"] for day in self.schedule_days if day["day"].lower() == "jumat"), None)
        
        # Constraint e. Tidak boleh ada perkuliahan di hari **Jumat sesi 3**.
        self.allowed_friday_sessions = [
            session["id"] for session in self.schedule_sessions 
            if session["sessionNumber"] in [1, 2, 4, 5]
        ]
        
        # Memisahkan ruangan berdasarkan tipe
        self.theory_rooms = [r for r in self.rooms if r["isTheory"]]
        self.lab_rooms = [r for r in self.rooms if r["isPracticum"] and r["id"] <= self.OFFLINE_ROOM_MAX_ID]
        self.online_rooms = [r for r in self.rooms if r["id"] >= self.ONLINE_ROOM_MIN_ID]

    # def find_compatible_lab_pair(self, required_capacity: int, used_rooms: List[int]) -> List[int]:
    #     """Mencari pasangan ruang lab yang sesuai dan tersedia"""
    #     available_labs = [r for r in self.lab_rooms if r["id"] not in used_rooms]
    #     total_capacity = 0
    #     selected_labs = []
        
    #     # Sortir lab berdasarkan kapasitas
    #     available_labs.sort(key=lambda x: x["roomCapacity"], reverse=True)
        
    #     # Constraint j. Setiap kelas (mahasiswa) hanya boleh memiliki dua jadwal kelas praktikum di satu sesi yang sama.
    #     for lab in available_labs:
    #         if total_capacity < required_capacity and len(selected_labs) < 2:
    #             selected_labs.append(lab["id"])
    #             total_capacity += lab["roomCapacity"]
        
    #     return selected_labs if total_capacity >= required_capacity else []

    # def find_compatible_lab_pair(self, required_capacity: int, used_rooms: List[int]) -> List[int]:
    #     """Mencari pasangan ruang lab yang sesuai dan tersedia"""
    #     # Constraint g. Setiap dosen hanya boleh mengajar dua kelas praktikum di satu sesi yang sama.
    #     available_labs = [r for r in self.lab_rooms if r["id"] not in used_rooms]
    #     total_capacity = 0
    #     selected_labs = []
        
    #     # Sortir lab berdasarkan kapasitas
    #     available_labs.sort(key=lambda x: x["roomCapacity"], reverse=True)
        
    #     for lab in available_labs:
    #         if total_capacity < required_capacity and len(selected_labs) < 2:
    #             selected_labs.append(lab["id"])
    #             total_capacity += lab["roomCapacity"]
        
    #     return selected_labs if total_capacity >= required_capacity else []

    def find_compatible_lab_pair(self, required_capacity: int, used_rooms: List[int]) -> List[int]:
        available_labs = [r for r in self.lab_rooms if r["id"] not in used_rooms]
        
        # Pastikan selalu memilih 2 lab jika tersedia
        if len(available_labs) < 2:
            return []
        
        # Pilih 2 lab dengan kapasitas terbesar
        available_labs.sort(key=lambda x: x["roomCapacity"], reverse=True)
        selected_labs = available_labs[:2]
        
        # Cek kapasitas total
        if sum(lab["roomCapacity"] for lab in selected_labs) >= required_capacity:
            return [lab["id"] for lab in selected_labs]
        return []

    def initial_population_func(self):
        population = []
        valid_day_ids = [d["id"] for d in self.schedule_days]
        
        for _ in range(50):
            solution = []
            used_rooms_per_slot = {}  # {(day_id, session_id): [room_ids]}
            
            for class_lecturer in self.class_lecturers:
                day = random.choice(valid_day_ids)
                
                # Pilih sesi berdasarkan hari
                if day == self.friday_id:
                    session = random.choice(self.allowed_friday_sessions)
                else:
                    session = random.choice([s["id"] for s in self.schedule_sessions])
                
                slot_key = (day, session)
                
                if slot_key not in used_rooms_per_slot:
                    used_rooms_per_slot[slot_key] = []
                
                subject_type = class_lecturer["class"]["subSubject"]["subjectType"]["typeName"]
                required_capacity = class_lecturer["class"]["classCapacity"]
                
                # Constraint a: Setiap kelas teori atau responsi hanya dijadwalkan satu kali pada satu ruangan yang memenuhi kriteria kapasitas atau ruang online.
                if subject_type in ["Teori", "Responsi"]:
                    # available_rooms = [r["id"] for r in self.theory_rooms 
                    #                 if r["roomCapacity"] >= required_capacity 
                    #                 and r["id"] <= self.OFFLINE_ROOM_MAX_ID
                    #                 and r["id"] not in used_rooms_per_slot[slot_key]]
                    
                    # room = random.choice(available_rooms) if available_rooms else random.choice([r["id"] for r in self.online_rooms])
                    # Prioritaskan ruang offline terlebih dahulu
                    offline_rooms = [r["id"] for r in self.theory_rooms 
                                    if r["roomCapacity"] >= required_capacity 
                                    and r["id"] <= self.OFFLINE_ROOM_MAX_ID
                                    and r["id"] not in used_rooms_per_slot[slot_key]]

                    online_rooms = [r["id"] for r in self.online_rooms]

                    room = random.choice(offline_rooms) if offline_rooms else random.choice(online_rooms)
                    solution.extend([day, session, room])
                    used_rooms_per_slot[slot_key].append(room)

                # Constraint b. Setiap kelas praktikum hanya boleh dijadwalkan satu kali pada satu ruangan laboratorium.
                elif subject_type == "Praktikum":
                    available_labs = self.find_compatible_lab_pair(required_capacity, used_rooms_per_slot[slot_key])
                    if available_labs:
                        room = available_labs[0]
                    else:
                        room = random.choice([r["id"] for r in self.online_rooms])
                    
                    solution.extend([day, session, room])
                    if available_labs:
                        used_rooms_per_slot[slot_key].extend(available_labs)
            
            population.append(solution)
        return population

    def fitness_func(self, ga_instance, solution, solution_idx):
        try:
            fitness = 1000
            penalties = 0
            
            room_usage = {}
            lecturer_sessions = {}
            class_sessions = {}
            team_sessions = {}
            
            # Constraint i. Setiap kelas (mahasiswa) hanya boleh memiliki satu jadwal kelas teori atau responsi di satu sesi yang sama.
            for i in range(0, len(solution), 3):
                day_id = int(solution[i])
                session_id = int(solution[i+1])
                room_id = int(solution[i+2])
                
                if day_id == self.friday_id and session_id not in self.allowed_friday_sessions:
                    penalties += 50
                    continue
                
                slot_key = (day_id, session_id)
                
                if slot_key not in room_usage:
                    room_usage[slot_key] = {}
                
                class_lecturer = self.class_lecturers[i // 3]
                
                # Pastikan class_lecturer memiliki semua properti yang diperlukan
                if not class_lecturer or "class" not in class_lecturer:
                    penalties += 50
                    continue
                    
                # Ambil tipe subjek dengan pengecekan keamanan
                subject_type = (
                    class_lecturer.get("class", {})
                    .get("subSubject", {})
                    .get("subjectType", {})
                    .get("typeName", "")
                )
                
                required_capacity = class_lecturer.get("class", {}).get("classCapacity", 0)
                
                # Tracking untuk dosen utama dengan pengecekan keamanan
                if "primaryLecturer" in class_lecturer and class_lecturer["primaryLecturer"]:
                    primary_lecturer = class_lecturer["primaryLecturer"]
                    if isinstance(primary_lecturer, dict) and "id" in primary_lecturer:
                        lecturer_id = primary_lecturer["id"]
                        if lecturer_id not in lecturer_sessions:
                            lecturer_sessions[lecturer_id] = {}
                        if day_id not in lecturer_sessions[lecturer_id]:
                            lecturer_sessions[lecturer_id][day_id] = []
                        lecturer_sessions[lecturer_id][day_id].append(session_id)
                
                # Tracking untuk dosen kedua dengan pengecekan keamanan
                if "secondaryLecturer" in class_lecturer and class_lecturer["secondaryLecturer"]:
                    secondary_lecturer = class_lecturer["secondaryLecturer"]
                    if isinstance(secondary_lecturer, dict) and "id" in secondary_lecturer:
                        lecturer_id = secondary_lecturer["id"]
                        if lecturer_id not in lecturer_sessions:
                            lecturer_sessions[lecturer_id] = {}
                        if day_id not in lecturer_sessions[lecturer_id]:
                            lecturer_sessions[lecturer_id][day_id] = []
                        lecturer_sessions[lecturer_id][day_id].append(session_id)
                        
                        # Tracking untuk tim dosen hanya jika kedua dosen ada
                        if "primaryLecturer" in class_lecturer and class_lecturer["primaryLecturer"]:
                            primary_lecturer = class_lecturer["primaryLecturer"]
                            if isinstance(primary_lecturer, dict) and "id" in primary_lecturer:
                                team_key = f"{primary_lecturer['id']}-{lecturer_id}"
                                if team_key not in team_sessions:
                                    team_sessions[team_key] = {}
                                if day_id not in team_sessions[team_key]:
                                    team_sessions[team_key][day_id] = []
                                team_sessions[team_key][day_id].append(session_id)
                
                # Tracking untuk asisten utama dengan pengecekan keamanan
                if "primaryAssistant" in class_lecturer and class_lecturer["primaryAssistant"]:
                    primary_assistant = class_lecturer["primaryAssistant"]
                    if isinstance(primary_assistant, dict) and "id" in primary_assistant:
                        assistant_id = primary_assistant["id"]
                        if assistant_id not in lecturer_sessions:
                            lecturer_sessions[assistant_id] = {}
                        if day_id not in lecturer_sessions[assistant_id]:
                            lecturer_sessions[assistant_id][day_id] = []
                        lecturer_sessions[assistant_id][day_id].append(session_id)
                
                # Tracking untuk asisten kedua dengan pengecekan keamanan
                if "secondaryAssistant" in class_lecturer and class_lecturer["secondaryAssistant"]:
                    secondary_assistant = class_lecturer["secondaryAssistant"]
                    if isinstance(secondary_assistant, dict) and "id" in secondary_assistant:
                        assistant_id = secondary_assistant["id"]
                        if assistant_id not in lecturer_sessions:
                            lecturer_sessions[assistant_id] = {}
                        if day_id not in lecturer_sessions[assistant_id]:
                            lecturer_sessions[assistant_id][day_id] = []
                        lecturer_sessions[assistant_id][day_id].append(session_id)
                
                # Pengecekan tipe ruangan dan kapasitas
                if subject_type in ["Teori", "Responsi"]:
                    room = next((r for r in self.rooms if r["id"] == room_id), None)
                    if not room or (not room["isTheory"] and room_id <= self.OFFLINE_ROOM_MAX_ID):
                        penalties += 40
                        continue
                
                elif subject_type == "Praktikum":
                    if room_id <= self.OFFLINE_ROOM_MAX_ID:
                        room = next((r for r in self.rooms if r["id"] == room_id), None)
                        if not room or not room["isPracticum"]:
                            penalties += 40
                            continue
                        
                        # Constraint c. Dua kelas praktikum yang sama harus dijadwalkan pada satu waktu yang sama dengan dua ruangan laboratorium berbeda.
                        total_capacity = 0
                        used_labs = []
                        for lab in self.lab_rooms:
                            if lab["id"] not in room_usage[slot_key] and total_capacity < required_capacity:
                                total_capacity += lab["roomCapacity"]
                                used_labs.append(lab["id"])
                                if len(used_labs) >= 2:
                                    break
                        
                        if total_capacity < required_capacity:
                            penalties += 30
                
                # Update tracking ruangan
                if room_id in room_usage[slot_key]:
                    room_usage[slot_key][room_id] += 1
                else:
                    room_usage[slot_key][room_id] = 1
            
            # Pengecekan konflik ruangan
            # Constraint d. Setiap ruangan baik kelas maupun lab hanya boleh dijadwalkan untuk satu kelas pada satu sesi.
            for slot_key, rooms in room_usage.items():
                for room_id, count in rooms.items():
                    if count > 1 and room_id <= self.OFFLINE_ROOM_MAX_ID:
                        penalties += 40
            
            # Constraint f. Setiap dosen hanya boleh mengajar satu kelas teori atau responsi di satu sesi yang sama.
            for sessions_per_day in lecturer_sessions.values():
                for day_sessions in sessions_per_day.values():
                    if len(day_sessions) > self.MAX_SESSIONS_PER_DAY:
                        penalties += 30
                    
                    # Constraint l. Setiap dosen hanya boleh memiliki jadwal mengajar maksimal tiga sesi dalam satu hari.
                    sorted_sessions = sorted(day_sessions)
                    for i in range(len(sorted_sessions) - 2):
                        if sorted_sessions[i + 2] - sorted_sessions[i] == 2:
                            penalties += 25
            
            # Constraint h. Setiap dosen tidak boleh mengajar kelas responsi atau teori dan kelas praktikum secara bersamaan di satu sesi yang sama.
            for team_day_sessions in team_sessions.values():
                for day_sessions in team_day_sessions.values():
                    if len(set(day_sessions)) != len(day_sessions):
                        penalties += 35
            
            fitness = max(0, fitness - penalties)
            return fitness / 1000
            
        except Exception as e:
            print(f"Error in fitness_func: {str(e)}")
            return 0.0

    def generate(self):
        try:
            ga_instance = pygad.GA(
                num_generations=500,  # Ditingkatkan untuk optimasi lebih baik
                num_parents_mating=10,
                num_genes=len(self.class_lecturers) * 3,
                init_range_low=1,
                init_range_high=max(max(r["id"] for r in self.rooms), 
                                  max(d["id"] for d in self.schedule_days),
                                  max(s["id"] for s in self.schedule_sessions)),
                fitness_func=self.fitness_func,
                initial_population=self.initial_population_func(),
                mutation_type="random",
                mutation_percent_genes=15,  # Ditingkatkan untuk eksplorasi lebih baik
                keep_parents=2
            )

            ga_instance.run()
            solution, solution_fitness, _ = ga_instance.best_solution()
            
            # Memproses solusi final
            final_schedule = []
            scheduled_class_lecturer_ids = set()
            room_assignments = {}  # Untuk tracking ruangan praktikum
            
            for i in range(0, len(solution), 3):
                day_id = int(solution[i])
                session_id = int(solution[i+1])
                room_id = int(solution[i+2])
                
                class_lecturer = self.class_lecturers[i // 3]
                subject_type = class_lecturer["class"]["subSubject"]["subjectType"]["typeName"]
                
                schedule_item = {
                    "scheduleDayId": day_id,
                    "scheduleSessionId": session_id,
                    "roomId": room_id,
                    "classLecturerId": class_lecturer["id"]
                }

                scheduled_class_lecturer_ids.add(class_lecturer["id"])

                # Menangani kasus praktikum dengan multiple labs
                if subject_type == "Praktikum" and room_id <= self.OFFLINE_ROOM_MAX_ID:
                    slot_key = (day_id, session_id)
                    if slot_key not in room_assignments:
                        room_assignments[slot_key] = []
                    
                    # Mencari lab kedua jika diperlukan
                    required_capacity = class_lecturer["class"]["classCapacity"]
                    available_labs = self.find_compatible_lab_pair(required_capacity, room_assignments[slot_key])
                    
                    if available_labs and len(available_labs) > 1:
                        # Tambahkan jadwal untuk lab kedua
                        second_schedule = schedule_item.copy()
                        second_schedule["roomId"] = available_labs[1]
                        final_schedule.append(second_schedule)
                        room_assignments[slot_key].extend(available_labs)
                
                final_schedule.append(schedule_item)

            all_class_lecturer_ids = {cl["id"] for cl in self.class_lecturers}
            unscheduled_ids = all_class_lecturer_ids - scheduled_class_lecturer_ids
            unscheduled_class_lecturers = [
                cl for cl in self.class_lecturers 
                if cl["id"] in unscheduled_ids
            ]

            print("\nClass lecturers yang tidak terplot ke jadwal:")
            for cl in unscheduled_class_lecturers:
                class_info = cl["class"]
                print(f"ID: {cl['id']}, Kelas: {class_info['className']}, "
                    f"Mata Kuliah: {class_info['subSubject']['subject']['subjectName']}, "
                    f"Tipe: {class_info['subSubject']['subjectType']['typeName']}")
            
            return {
                "schedule": final_schedule,
                "fitness": solution_fitness,
                "unscheduled_class_lecturers": unscheduled_class_lecturers
            }
        except Exception as e:
            print(f"Error in generate: {str(e)}")
            raise HTTPException(status_code=400, detail=str(e))

def generate_schedule(data: Dict, academic_year: int = None, semester: str = None):
    generator = ScheduleGenerator(data, academic_year, semester)
    # return generator.generate()
    schedule_result = generator.generate()
    
    # 2. Validasi jadwal
    validator = ScheduleValidator(schedule_result, generator)
    validation_results = validator.validate_all_constraints()
    
    # 3. Tampilkan hasil validasi di terminal
    validator.print_validation_results()

    validator.save_validation_results_to_txt()

    # 4. Gabungkan hasil validasi dengan hasil generate
    schedule_result["validation"] = validation_results
    
    return schedule_result

