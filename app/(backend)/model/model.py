import pygad
import random

def genetic_schedule(data):
    # Extract data
    schedule_days = data["scheduleDays"]
    schedule_sessions = data["scheduleSessions"]
    rooms = data["rooms"]
    class_lecturers = data["classLecturers"]

    # Representasi gen: [day_id, session_id, room_id] untuk setiap kelas
    num_genes = len(class_lecturers) * 3  # day_id, session_id, room_id per class

    # Fungsi untuk membuat solusi acak
    def create_random_solution():
        solution = []
        for _ in class_lecturers:
            day = random.choice(schedule_days)["id"]
            session = random.choice(schedule_sessions)["id"]
            room = random.choice(rooms)["id"]
            solution.extend([day, session, room])
        return solution

    # Fungsi fitness
    def fitness_func(solution, solution_idx):
        penalty = 0

        # Decode solution
        decoded_schedule = []
        for i in range(0, len(solution), 3):
            decoded_schedule.append({
                "day_id": int(solution[i]),
                "session_id": int(solution[i+1]),
                "room_id": int(solution[i+2]),
                "classLecturerId": class_lecturers[i // 3]["id"]
            })

        # Constraint 1: Tidak ada kelas pada hari Jumat sesi 3
        for schedule in decoded_schedule:
            day = next(d for d in schedule_days if d["id"] == schedule["day_id"])
            session = next(s for s in schedule_sessions if s["id"] == schedule["session_id"])
            if day["day"] == "Jumat" and session["sessionNumber"] == 3:
                penalty += 10  # Penalti untuk pelanggaran

        # Constraint 2: Tidak ada konflik ruangan
        for day_id in {s["day_id"] for s in decoded_schedule}:
            for session_id in {s["session_id"] for s in decoded_schedule if s["day_id"] == day_id}:
                rooms_used = [
                    s["room_id"] for s in decoded_schedule
                    if s["day_id"] == day_id and s["session_id"] == session_id
                ]
                if len(rooms_used) != len(set(rooms_used)):
                    penalty += 20  # Penalti untuk konflik ruangan
                    
        # Constraint 3: Tidak ada konflik dosen
        for day_id in {s["day_id"] for s in decoded_schedule}:
            for session_id in {s["session_id"] for s in decoded_schedule if s["day_id"] == day_id}:
                lecturers_used = [
                    c["primaryLecturerId"]
                    for c in class_lecturers
                    if c["id"] in [
                        s["classLecturerId"]
                        for s in decoded_schedule
                        if s["day_id"] == day_id and s["session_id"] == session_id
                    ]
                ]
                if len(lecturers_used) != len(set(lecturers_used)):
                    penalty += 20  # Penalti untuk konflik dosen
       
        # Constraint 4: Kapasitas ruang harus lebih besar dari jumlah mahasiswa pada kelas
        for schedule in decoded_schedule:
            room = next(r for r in rooms if r["id"] == schedule["room_id"])
            class_lecturer = next(c for c in class_lecturers if c["id"] == schedule["classLecturerId"])
            
            # Asumsi bahwa setiap class_lecturer memiliki atribut 'student_count' yang menunjukkan jumlah mahasiswa
            if room["capacity"] < class_lecturer["student_count"]:
                penalty += 10  # Penalti jika kapasitas ruang lebih kecil dari jumlah mahasiswa

        # Constraint 5: Ruang kelas hanya menampilkan dan menerima subSubject teori dan responsi
        for schedule in decoded_schedule:
            if schedule["subject"]["type"] not in ["teori", "responsi"]:
                penalty += 10  # Penalti jika subSubject bukan teori atau responsi pada ruang kelas

        # Constraint 6: Mata kuliah praktikum, satu kelas memakai dua ruang lab
        for schedule in decoded_schedule:
            if schedule["subject"]["type"] == "praktikum":
                lab_rooms_used = [s["room_id"] for s in decoded_schedule if s["classLecturerId"] == schedule["classLecturerId"] and s["subject"]["type"] == "praktikum"]
                if len(lab_rooms_used) != 2:
                    penalty += 10  # Penalti jika kelas praktikum tidak memakai dua ruang lab

        # Constraint 7: Ruang lab hanya menampilkan dan menerima subSubject praktikum
        for schedule in decoded_schedule:
            room = next(r for r in rooms if r["id"] == schedule["room_id"])
            if room["type"] != "lab" and schedule["subject"]["type"] == "praktikum":
                penalty += 10  # Penalti jika ruang lab digunakan untuk subSubject selain praktikum

        # Constraint 8: Satu kelas praktikum dapat menggunakan lebih dari satu ruang lab
        for schedule in decoded_schedule:
            if schedule["subject"]["type"] == "praktikum":
                lab_rooms_used = [s["room_id"] for s in decoded_schedule if s["classLecturerId"] == schedule["classLecturerId"] and s["subject"]["type"] == "praktikum"]
                if len(set(lab_rooms_used)) > 1:
                    penalty += 5  # Penalti untuk menggunakan lebih dari satu ruang lab, jika tidak sesuai dengan aturan

        return 1.0 / (1.0 + penalty)  # Semakin kecil penalti, semakin baik fitness

    # Parameter GA
    ga_instance = pygad.GA(
        num_generations=100,
        num_parents_mating=10,
        fitness_func=fitness_func,
        sol_per_pop=50,
        num_genes=num_genes,
        gene_type=int,
        init_range_low=1,
        init_range_high=max(max([d["id"] for d in schedule_days]),
                            max([s["id"] for s in schedule_sessions]),
                            max([r["id"] for r in rooms])),
        mutation_percent_genes=10,
        mutation_type="random",
        on_generation=lambda ga_instance: print(f"Generation {ga_instance.generations_completed}: Best Fitness = {ga_instance.best_solution()[1]}")
    )

    # Run the GA
    ga_instance.run()

    # Decode the best solution
    best_solution, best_fitness, _ = ga_instance.best_solution()
    decoded_schedule = []
    for i in range(0, len(best_solution), 3):
        decoded_schedule.append({
            "day_id": int(best_solution[i]),
            "session_id": int(best_solution[i + 1]),
            "room_id": int(best_solution[i + 2]),
            "classLecturerId": class_lecturers[i // 3]["id"],
            "subject": class_lecturers[i // 3]["subject"],
        })

    return decoded_schedule
