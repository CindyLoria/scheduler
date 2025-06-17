# from typing import Dict
# import pygad
# import random
# from fastapi import HTTPException

# def generate_schedule(data: Dict):
#     try:

#         print("Data yang diterima di generate_schedule:")
#         print("Rooms:", data.get("rooms"))
#         print("Schedule Days:", data.get("scheduleDays"))
#         print("Schedule Sessions:", data.get("scheduleSessions"))
#         print("Class Lecturers:", data.get("classLecturers"))

#         day_ids = [d["id"] for d in schedule_days]
#         session_ids = [s["id"] for s in schedule_sessions]
#         room_ids = [r["id"] for r in rooms]

#         # Validasi data input
#         required_fields = ["scheduleDays", "scheduleSessions", "rooms", "classLecturers"]
#         for field in required_fields:
#             if field not in data:
#                 raise HTTPException(status_code=400, detail=f"Missing required field: {field}")

#         schedule_days = data["scheduleDays"]
#         schedule_sessions = data["scheduleSessions"]
#         rooms = data["rooms"]
#         class_lecturers = data["classLecturers"]

#         def initial_population_func():
#             population = []
#             valid_day_ids = [d["id"] for d in schedule_days]
#             valid_session_ids = [s["id"] for s in schedule_sessions]
#             valid_room_ids = [r["id"] for r in rooms]
            
#             for _ in range(50):
#                 solution = []
#                 for i in range(len(class_lecturers)):
#                     day = random.choice(valid_day_ids)
#                     session = random.choice(valid_session_ids)
                    
#                     class_lecturer = class_lecturers[i]
#                     subject_type = class_lecturer["class"]["subSubject"]["subjectType"]["typeName"]
                    
#                     # Tambahkan logging
#                     print(f"Subject Type: {subject_type}")
#                     print(f"Available Rooms: {rooms}")
                    
#                     valid_rooms = []
#                     if subject_type in ["Teori", "Responsi"]:
#                         valid_rooms = [r["id"] for r in rooms if r["isTheory"]]
#                     elif subject_type == "Praktikum":
#                         valid_rooms = [r["id"] for r in rooms if r["isPracticum"]]
                    
#                     if not valid_rooms:
#                         valid_rooms = valid_room_ids
                    
#                     if not valid_rooms:
#                         raise HTTPException(status_code=400, detail="No valid rooms available")
                        
#                     room = random.choice(valid_rooms)
#                     solution.extend([day, session, room])
                
#                 population.append(solution)
#             return population

#         def fitness_func(ga_instance, solution, solution_idx):

#             """
#             Fungsi fitness dengan validasi yang lebih ketat
#             """

#             try:
#                 fitness = 100
#                 penalties = 0

#                 # Dapatkan valid IDs
#                 valid_day_ids = {d["id"] for d in schedule_days}
#                 valid_session_ids = {s["id"] for s in schedule_sessions}
#                 valid_room_ids = {r["id"] for r in rooms}
            
#                 schedules = []
#                 for i in range(0, len(solution), 3):
#                     day_id = int(solution[i])
#                     session_id = int(solution[i+1])
#                     room_id = int(solution[i+2])
                    
#                     # Validasi ID
#                     if day_id not in valid_day_ids:
#                         penalties += 50
#                         continue
#                     if session_id not in valid_session_ids:
#                         penalties += 50
#                         continue
#                     if room_id not in valid_room_ids:
#                         penalties += 50
#                         continue
                        
#                     schedule = {
#                         "dayId": day_id,
#                         "sessionId": session_id,
#                         "roomId": room_id,
#                         "classLecturerId": class_lecturers[i // 3]["id"]
#                     }
#                     schedules.append(schedule)

#                 # Pengecekan konflik jadwal
#                 for day_id in {s["dayId"] for s in schedules}:
#                     for session_id in {s["sessionId"] for s in schedules if s["dayId"] == day_id}:
#                         # Cek konflik ruangan
#                         rooms_used = [s["roomId"] for s in schedules 
#                                     if s["dayId"] == day_id and s["sessionId"] == session_id]
#                         if len(rooms_used) != len(set(rooms_used)):
#                             penalties += 30

#                         # Cek konflik dosen
#                         lecturers_at_time = []
#                         for schedule in schedules:
#                             if schedule["dayId"] == day_id and schedule["sessionId"] == session_id:
#                                 class_lecturer = next(cl for cl in class_lecturers 
#                                                 if cl["id"] == schedule["classLecturerId"])
#                                 lecturer = class_lecturer.get("lecturer")
#                                 if lecturer:
#                                     lecturers_at_time.append(lecturer["id"])
                        
#                         if len(lecturers_at_time) != len(set(lecturers_at_time)):
#                             penalties += 30

#                 # Pengecekan kapasitas ruangan
#                 for schedule in schedules:
#                     try:
#                         room = next(r for r in rooms if r["id"] == schedule["roomId"])
#                         class_lecturer = next(cl for cl in class_lecturers 
#                                            if cl["id"] == schedule["classLecturerId"])
                        
#                         if class_lecturer["class"]["classCapacity"] > room["roomCapacity"]:
#                             penalties += 20
#                     except StopIteration:
#                         penalties += 50  # Penalti besar untuk room yang tidak valid
#                         continue

#                 # Pengecekan kesesuaian tipe ruangan
#                 for schedule in schedules:
#                     room = next(r for r in rooms if r["id"] == schedule["roomId"])
#                     class_lecturer = next(cl for cl in class_lecturers 
#                                     if cl["id"] == schedule["classLecturerId"])
#                     subject_type = class_lecturer["class"]["subSubject"]["subjectType"]["typeName"]

#                     if subject_type in ["Teori", "Responsi"] and not room["isTheory"]:
#                         penalties += 25
#                     elif subject_type == "Praktikum" and not room["isPracticum"]:
#                         penalties += 25

#                 fitness = max(0, fitness - penalties)
#                 return fitness / 100
#             except Exception as e:
#                 print(f"Error in fitness_func: {str(e)}")
#                 return 0.0
            
#         # Dapatkan range yang valid untuk masing-masing ID
#         day_ids = [d["id"] for d in schedule_days]
#         session_ids = [s["id"] for s in schedule_sessions]
#         room_ids = [r["id"] for r in rooms]
            
#         # Inisialisasi GA
#         ga_instance = pygad.GA(
#             num_generations=100,
#             num_parents_mating=4,
#             num_genes=len(class_lecturers) * 3,
#             init_range_low=min(min(day_ids), min(session_ids), min(room_ids)),
#             init_range_high=max(max(day_ids), max(session_ids), max(room_ids)),
#             fitness_func=fitness_func,
#             initial_population=initial_population_func(),
#             mutation_type="random",
#             mutation_percent_genes=10
#         )

#         ga_instance.run()
#         solution, solution_fitness, _ = ga_instance.best_solution()
        
#         # Generate jadwal final
#         final_schedule = []
#         for i in range(0, len(solution), 3):
#             schedule_item = {
#                 "dayId": int(solution[i]),
#                 "sessionId": int(solution[i+1]),
#                 "roomId": int(solution[i+2]),
#                 "classLecturerId": class_lecturers[i // 3]["id"]
#             }
#             final_schedule.append(schedule_item)

#         return {
#             "schedule": final_schedule,
#             "fitness": solution_fitness
#         }

#     except Exception as e:
#         print(f"Error in generate_schedule: {str(e)}")
#         raise HTTPException(status_code=400, detail=str(e))

from typing import Dict
import pygad
import random
from fastapi import HTTPException

class ScheduleGenerator:
    def __init__(self, data: Dict):
        # Validasi data input
        required_fields = ["scheduleDays", "scheduleSessions", "rooms", "classLecturers"]
        for field in required_fields:
            if field not in data:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")

        self.schedule_days = data["scheduleDays"]
        self.schedule_sessions = data["scheduleSessions"]
        self.rooms = data["rooms"]
        self.class_lecturers = data["classLecturers"]

    def initial_population_func(self):
        population = []
        valid_day_ids = [d["id"] for d in self.schedule_days]
        valid_session_ids = [s["id"] for s in self.schedule_sessions]
        valid_room_ids = [r["id"] for r in self.rooms]
        
        for _ in range(50):
            solution = []
            for i in range(len(self.class_lecturers)):
                day = random.choice(valid_day_ids)
                session = random.choice(valid_session_ids)
                
                class_lecturer = self.class_lecturers[i]
                subject_type = class_lecturer["class"]["subSubject"]["subjectType"]["typeName"]
                
                valid_rooms = []
                if subject_type in ["Teori", "Responsi"]:
                    valid_rooms = [r["id"] for r in self.rooms if r["isTheory"]]
                elif subject_type == "Praktikum":
                    valid_rooms = [r["id"] for r in self.rooms if r["isPracticum"]]
                
                if not valid_rooms:
                    valid_rooms = valid_room_ids
                    
                room = random.choice(valid_rooms)
                solution.extend([day, session, room])
            
            population.append(solution)
        return population

    def fitness_func(self, ga_instance, solution, solution_idx):
        try:
            fitness = 100
            penalties = 0
            
            valid_day_ids = {d["id"] for d in self.schedule_days}
            valid_session_ids = {s["id"] for s in self.schedule_sessions}
            valid_room_ids = {r["id"] for r in self.rooms}
            
            schedules = []
            for i in range(0, len(solution), 3):
                day_id = int(solution[i])
                session_id = int(solution[i+1])
                room_id = int(solution[i+2])
                
                # Validasi ID
                if day_id not in valid_day_ids:
                    penalties += 50
                    continue
                if session_id not in valid_session_ids:
                    penalties += 50
                    continue
                if room_id not in valid_room_ids:
                    penalties += 50
                    continue
                    
                schedule = {
                    "dayId": day_id,
                    "sessionId": session_id,
                    "roomId": room_id,
                    "classLecturerId": self.class_lecturers[i // 3]["id"]
                }
                schedules.append(schedule)

            # Pengecekan konflik jadwal
            for day_id in {s["dayId"] for s in schedules}:
                for session_id in {s["sessionId"] for s in schedules if s["dayId"] == day_id}:
                    # Cek konflik ruangan
                    rooms_used = [s["roomId"] for s in schedules 
                                if s["dayId"] == day_id and s["sessionId"] == session_id]
                    if len(rooms_used) != len(set(rooms_used)):
                        penalties += 30

                    # Cek konflik dosen
                    lecturers_at_time = []
                    for schedule in schedules:
                        if schedule["dayId"] == day_id and schedule["sessionId"] == session_id:
                            class_lecturer = next(cl for cl in self.class_lecturers 
                                               if cl["id"] == schedule["classLecturerId"])
                            lecturer = class_lecturer.get("lecturer")
                            if lecturer:
                                lecturers_at_time.append(lecturer["id"])
                    
                    if len(lecturers_at_time) != len(set(lecturers_at_time)):
                        penalties += 30

            # Pengecekan kapasitas ruangan dan tipe ruangan
            for schedule in schedules:
                try:
                    room = next(r for r in self.rooms if r["id"] == schedule["roomId"])
                    class_lecturer = next(cl for cl in self.class_lecturers 
                                       if cl["id"] == schedule["classLecturerId"])
                    
                    if class_lecturer["class"]["classCapacity"] > room["roomCapacity"]:
                        penalties += 20

                    subject_type = class_lecturer["class"]["subSubject"]["subjectType"]["typeName"]
                    if subject_type in ["Teori", "Responsi"] and not room["isTheory"]:
                        penalties += 25
                    elif subject_type == "Praktikum" and not room["isPracticum"]:
                        penalties += 25
                except StopIteration:
                    penalties += 50
                    continue

            fitness = max(0, fitness - penalties)
            return fitness / 100
        except Exception as e:
            print(f"Error in fitness_func: {str(e)}")
            return 0.0

    def generate(self):
        try:
            # Dapatkan range yang valid
            day_ids = [d["id"] for d in self.schedule_days]
            session_ids = [s["id"] for s in self.schedule_sessions]
            room_ids = [r["id"] for r in self.rooms]

            # Inisialisasi GA
            ga_instance = pygad.GA(
                num_generations=100,
                num_parents_mating=4,
                num_genes=len(self.class_lecturers) * 3,
                init_range_low=min(min(day_ids), min(session_ids), min(room_ids)),
                init_range_high=max(max(day_ids), max(session_ids), max(room_ids)),
                fitness_func=self.fitness_func,
                initial_population=self.initial_population_func(),
                mutation_type="random",
                mutation_percent_genes=10
            )

            ga_instance.run()
            solution, solution_fitness, _ = ga_instance.best_solution()
            
            # Generate jadwal final
            final_schedule = []
            for i in range(0, len(solution), 3):
                schedule_item = {
                    "dayId": int(solution[i]),
                    "sessionId": int(solution[i+1]),
                    "roomId": int(solution[i+2]),
                    "classLecturerId": self.class_lecturers[i // 3]["id"]
                }
                final_schedule.append(schedule_item)

            return {
                "schedule": final_schedule,
                "fitness": solution_fitness
            }
        except Exception as e:
            print(f"Error in generate: {str(e)}")
            raise HTTPException(status_code=400, detail=str(e))

def generate_schedule(data: Dict):
    generator = ScheduleGenerator(data)
    return generator.generate()