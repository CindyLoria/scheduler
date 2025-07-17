from typing import Dict, List

class ScheduleValidator:
    def __init__(self, schedule_data, generator_instance):
        self.schedule = schedule_data.get("schedule", [])
        self.unscheduled = schedule_data.get("unscheduled_class_lecturers", [])
        self.generator = generator_instance
        self.class_lecturers = generator_instance.class_lecturers
        self.constraint_results = {}
        
        # Debugging
        print("\n[VALIDATOR INIT] Data Summary:")
        print(f"- Total schedules: {len(self.schedule)}")
        print(f"- Unscheduled classes: {len(self.unscheduled)}")
        if self.schedule:
            print("- Sample schedule item:", {k: v for k, v in self.schedule[0].items() if k in ['scheduleDayId', 'scheduleSessionId', 'roomId', 'classLecturerId']})

    def validate_all_constraints(self):
        """Validasi semua 12 constraint dengan error handling"""
        print("\n[VALIDATOR] Starting validation of all constraints...")
        
        try:
            self.constraint_results = {
                'a': self.validate_constraint_a(),  # Teori/Responsi di ruangan sesuai
                'b': self.validate_constraint_b(),  # Praktikum hanya di lab/online
                'c': self.validate_constraint_c(),  # Praktikum offline butuh 2 lab
                'd': self.validate_constraint_d(),  # Ruangan offline hanya 1 kelas
                'e': self.validate_constraint_e(),  # Tidak ada kelas Jumat sesi 3
                'f': self.validate_constraint_f(),  # Dosen hanya 1 teori/responsi per sesi
                'g': self.validate_constraint_g(),  # Dosen max 2 praktikum per sesi
                'h': self.validate_constraint_h(),  # Dosen tidak teori+praktek bersamaan
                'i': self.validate_constraint_i(),  # Kelas hanya 1 teori/responsi per sesi
                'j': self.validate_constraint_j(),  # Kelas max 2 praktikum per sesi
                'k': self.validate_constraint_k(),  # Kelas tidak teori+praktek bersamaan
                'l': self.validate_constraint_l()   # Dosen max 3 sesi per hari
            }
        except Exception as e:
            print(f"\n[ERROR] Validation failed: {str(e)}")
            raise
        
        return self.constraint_results
    
    def get_class_lecturer_info(self, class_lecturer_id):
        """Mencari class lecturer dengan handling berbagai format ID"""
        if class_lecturer_id is None:
            return None
            
        try:
            # Normalisasi ID (handle string/int)
            search_id = int(class_lecturer_id) if str(class_lecturer_id).isdigit() else class_lecturer_id
            
            for cl in self.class_lecturers:
                if not isinstance(cl, dict):
                    continue
                    
                # Cek semua kemungkinan key untuk ID
                cl_id = cl.get("id") or cl.get("classLecturerId") or cl.get("ID")
                
                # Handle perbedaan tipe data ID
                if cl_id == search_id:
                    return cl
                elif str(cl_id) == str(search_id):
                    return cl
                    
        except Exception as e:
            print(f"\n[WARNING] Failed to find class lecturer: {str(e)}")
            
        return None

    def validate_constraint_a(self):
        """Teori/Responsi di ruangan sesuai kapasitas"""
        violations = []
        
        for item in self.schedule:
            try:
                cl = self.get_class_lecturer_info(item.get("classLecturerId"))
                if not cl:
                    continue
                    
                subject_type = cl.get("class", {}).get("subSubject", {}).get("subjectType", {}).get("typeName", "")
                if subject_type not in ["Teori", "Responsi"]:
                    continue
                    
                room_id = item.get("roomId")
                room = next((r for r in self.generator.rooms if r.get("id") == room_id), None)
                
                if room_id <= self.generator.OFFLINE_ROOM_MAX_ID:
                    required_capacity = cl.get("class", {}).get("classCapacity", 0)
                    if not room or room.get("roomCapacity", 0) < required_capacity:
                        violations.append({
                            'message': f"Ruangan offline tidak memenuhi kapasitas (butuh {required_capacity}, tersedia {room.get('roomCapacity') if room else 'N/A'})",
                            'details': item
                        })
                elif room_id >= self.generator.ONLINE_ROOM_MIN_ID:
                    if not any(r for r in self.generator.online_rooms if r.get("id") == room_id):
                        violations.append({
                            'message': "Ruangan online tidak valid",
                            'details': item
                        })
            except Exception as e:
                print(f"[WARNING] Error in constraint_a: {str(e)}")
                continue
                
        return {'valid': len(violations) == 0, 'violations': violations}

    def validate_constraint_b(self):
        """Praktikum hanya di lab/ruang online"""
        violations = []
        
        for item in self.schedule:
            try:
                cl = self.get_class_lecturer_info(item.get("classLecturerId"))
                if not cl:
                    continue
                    
                if cl.get("class", {}).get("subSubject", {}).get("subjectType", {}).get("typeName", "") != "Praktikum":
                    continue
                    
                room_id = item.get("roomId")
                room = next((r for r in self.generator.rooms if r.get("id") == room_id), None)
                
                if room_id <= self.generator.OFFLINE_ROOM_MAX_ID:
                    if not room or not room.get("isPracticum", False):
                        violations.append({
                            'message': "Praktikum offline harus di ruang laboratorium",
                            'details': item
                        })
                else:
                    if not any(r for r in self.generator.online_rooms if r.get("id") == room_id):
                        violations.append({
                            'message': "Praktikum online harus di ruang online",
                            'details': item
                        })
            except Exception as e:
                print(f"[WARNING] Error in constraint_b: {str(e)}")
                continue
                
        return {'valid': not violations, 'violations': violations}

    def validate_constraint_c(self):
        """Praktikum offline butuh 2 lab berbeda"""
        violations = []
        
        try:
            schedule_groups = {}
            for item in self.schedule:
                cl = self.get_class_lecturer_info(item.get("classLecturerId"))
                if not cl:
                    continue
                    
                if cl.get("class", {}).get("subSubject", {}).get("subjectType", {}).get("typeName", "") != "Praktikum":
                    continue
                    
                key = (item.get("scheduleDayId"), item.get("scheduleSessionId"), item.get("classLecturerId"))
                schedule_groups.setdefault(key, []).append(item.get("roomId"))
            
            for key, room_ids in schedule_groups.items():
                offline_rooms = [rid for rid in room_ids if isinstance(rid, int) and rid <= self.generator.OFFLINE_ROOM_MAX_ID]
                if offline_rooms and len(set(offline_rooms)) < 2:
                    violations.append({
                        'message': "Praktikum offline membutuhkan 2 ruang lab berbeda",
                        'assigned_rooms': offline_rooms,
                        'details': key
                    })
        except Exception as e:
            print(f"[WARNING] Error in constraint_c: {str(e)}")
            
        return {'valid': not violations, 'violations': violations}

    def validate_constraint_d(self):
        """Ruangan offline hanya 1 kelas per sesi"""
        violations = []
        
        try:
            room_usage = {}
            for item in self.schedule:
                room_id = item.get("roomId")
                if room_id > self.generator.OFFLINE_ROOM_MAX_ID:
                    continue
                    
                key = (item.get("scheduleDayId"), item.get("scheduleSessionId"), room_id)
                room_usage.setdefault(key, []).append(item.get("classLecturerId"))
            
            for key, cls_ids in room_usage.items():
                if len(cls_ids) > 1:
                    violations.append({
                        'message': "Ruangan offline digunakan oleh lebih dari satu kelas",
                        'class_lecturer_ids': cls_ids,
                        'details': key
                    })
        except Exception as e:
            print(f"[WARNING] Error in constraint_d: {str(e)}")
            
        return {'valid': not violations, 'violations': violations}

    def validate_constraint_e(self):
        """Tidak ada kelas Jumat sesi 3"""
        violations = []
        
        try:
            if not self.generator.friday_id:
                return {'valid': True, 'violations': []}
                
            forbidden_session = next((s["id"] for s in self.generator.schedule_sessions 
                                   if s.get("sessionNumber") == 3), None)
                                   
            for item in self.schedule:
                if (item.get("scheduleDayId") == self.generator.friday_id and 
                    item.get("scheduleSessionId") == forbidden_session):
                    violations.append({
                        'message': "Jadwal di Jumat sesi 3 tidak diperbolehkan",
                        'details': item
                    })
        except Exception as e:
            print(f"[WARNING] Error in constraint_e: {str(e)}")
            
        return {'valid': len(violations) == 0, 'violations': violations}

    def validate_constraint_f(self):
        """Dosen hanya 1 teori/responsi per sesi"""
        violations = []
        
        try:
            lecturer_sessions = {}
            for item in self.schedule:
                cl = self.get_class_lecturer_info(item.get("classLecturerId"))
                if not cl:
                    continue
                    
                subject_type = cl.get("class", {}).get("subSubject", {}).get("subjectType", {}).get("typeName", "")
                if subject_type not in ["Teori", "Responsi"]:
                    continue
                    
                # Cek dosen utama
                if cl.get("primaryLecturer") and isinstance(cl["primaryLecturer"], dict):
                    lecturer_id = cl["primaryLecturer"].get("id")
                    if lecturer_id:
                        key = (item.get("scheduleDayId"), item.get("scheduleSessionId"), lecturer_id)
                        lecturer_sessions.setdefault(key, []).append(item.get("classLecturerId"))
                
                # Cek dosen kedua
                if cl.get("secondaryLecturer") and isinstance(cl["secondaryLecturer"], dict):
                    lecturer_id = cl["secondaryLecturer"].get("id")
                    if lecturer_id:
                        key = (item.get("scheduleDayId"), item.get("scheduleSessionId"), lecturer_id)
                        lecturer_sessions.setdefault(key, []).append(item.get("classLecturerId"))
            
            for key, cls_ids in lecturer_sessions.items():
                if len(cls_ids) > 1:
                    violations.append({
                        'message': "Dosen mengajar lebih dari satu kelas teori/responsi di sesi yang sama",
                        'class_lecturer_ids': cls_ids,
                        'details': key
                    })
        except Exception as e:
            print(f"[WARNING] Error in constraint_f: {str(e)}")
            
        return {'valid': not violations, 'violations': violations}

    def validate_constraint_g(self):
        """Dosen max 2 praktikum per sesi"""
        violations = []
        
        try:
            lecturer_sessions = {}
            for item in self.schedule:
                cl = self.get_class_lecturer_info(item.get("classLecturerId"))
                if not cl:
                    continue
                    
                if cl.get("class", {}).get("subSubject", {}).get("subjectType", {}).get("typeName", "") != "Praktikum":
                    continue
                    
                # Cek semua dosen terkait (utama, kedua, asisten)
                lecturers = []
                for role in ["primaryLecturer", "secondaryLecturer", "primaryAssistant", "secondaryAssistant"]:
                    if cl.get(role) and isinstance(cl[role], dict) and cl[role].get("id"):
                        lecturers.append(cl[role]["id"])
                
                for lecturer_id in lecturers:
                    key = (item.get("scheduleDayId"), item.get("scheduleSessionId"), lecturer_id)
                    lecturer_sessions.setdefault(key, []).append(item.get("classLecturerId"))
            
            for key, cls_ids in lecturer_sessions.items():
                if len(cls_ids) > 2:
                    violations.append({
                        'message': "Dosen mengajar lebih dari dua kelas praktikum di sesi yang sama",
                        'class_lecturer_ids': cls_ids,
                        'details': key
                    })
        except Exception as e:
            print(f"[WARNING] Error in constraint_g: {str(e)}")
            
        return {'valid': not violations, 'violations': violations}

    def validate_constraint_h(self):
        """Dosen tidak teori+praktek bersamaan"""
        violations = []
        
        try:
            lecturer_assignments = {}
            for item in self.schedule:
                cl = self.get_class_lecturer_info(item.get("classLecturerId"))
                if not cl:
                    continue
                    
                subject_type = cl.get("class", {}).get("subSubject", {}).get("subjectType", {}).get("typeName", "")
                
                # Cek semua dosen terkait
                lecturers = []
                for role in ["primaryLecturer", "secondaryLecturer", "primaryAssistant", "secondaryAssistant"]:
                    if cl.get(role) and isinstance(cl[role], dict) and cl[role].get("id"):
                        lecturers.append(cl[role]["id"])
                
                for lecturer_id in lecturers:
                    key = (item.get("scheduleDayId"), item.get("scheduleSessionId"), lecturer_id)
                    if key not in lecturer_assignments:
                        lecturer_assignments[key] = set()
                    lecturer_assignments[key].add(subject_type)
            
            for key, subject_types in lecturer_assignments.items():
                if {"Teori", "Praktikum"}.issubset(subject_types) or {"Responsi", "Praktikum"}.issubset(subject_types):
                    violations.append({
                        'message': "Dosen mengajar teori/responsi dan praktikum di sesi yang sama",
                        'subject_types': list(subject_types),
                        'details': key
                    })
        except Exception as e:
            print(f"[WARNING] Error in constraint_h: {str(e)}")
            
        return {'valid': not violations, 'violations': violations}

    def validate_constraint_i(self):
        """Kelas hanya 1 teori/responsi per sesi"""
        violations = []
        
        try:
            class_sessions = {}
            for item in self.schedule:
                cl = self.get_class_lecturer_info(item.get("classLecturerId"))
                if not cl:
                    continue
                    
                if cl.get("class", {}).get("subSubject", {}).get("subjectType", {}).get("typeName", "") not in ["Teori", "Responsi"]:
                    continue
                    
                class_id = cl.get("class", {}).get("id")
                key = (item.get("scheduleDayId"), item.get("scheduleSessionId"), class_id)
                class_sessions.setdefault(key, []).append(item.get("classLecturerId"))
            
            for key, cls_ids in class_sessions.items():
                if len(cls_ids) > 1:
                    violations.append({
                        'message': "Kelas memiliki lebih dari satu jadwal teori/responsi di sesi yang sama",
                        'class_lecturer_ids': cls_ids,
                        'details': key
                    })
        except Exception as e:
            print(f"[WARNING] Error in constraint_i: {str(e)}")
            
        return {'valid': not violations, 'violations': violations}

    def validate_constraint_j(self):
        """Kelas max 2 praktikum per sesi"""
        violations = []
        
        try:
            class_sessions = {}
            for item in self.schedule:
                cl = self.get_class_lecturer_info(item.get("classLecturerId"))
                if not cl:
                    continue
                    
                if cl.get("class", {}).get("subSubject", {}).get("subjectType", {}).get("typeName", "") != "Praktikum":
                    continue
                    
                class_id = cl.get("class", {}).get("id")
                key = (item.get("scheduleDayId"), item.get("scheduleSessionId"), class_id)
                class_sessions.setdefault(key, []).append(item.get("classLecturerId"))
            
            for key, cls_ids in class_sessions.items():
                if len(cls_ids) > 2:
                    violations.append({
                        'message': "Kelas memiliki lebih dari dua jadwal praktikum di sesi yang sama",
                        'class_lecturer_ids': cls_ids,
                        'details': key
                    })
        except Exception as e:
            print(f"[WARNING] Error in constraint_j: {str(e)}")
            
        return {'valid': not violations, 'violations': violations}

    def validate_constraint_k(self):
        """Kelas tidak teori+praktek bersamaan"""
        violations = []
        
        try:
            class_assignments = {}
            for item in self.schedule:
                cl = self.get_class_lecturer_info(item.get("classLecturerId"))
                if not cl:
                    continue
                    
                class_id = cl.get("class", {}).get("id")
                subject_type = cl.get("class", {}).get("subSubject", {}).get("subjectType", {}).get("typeName", "")
                key = (item.get("scheduleDayId"), item.get("scheduleSessionId"), class_id)
                
                if key not in class_assignments:
                    class_assignments[key] = set()
                class_assignments[key].add(subject_type)
            
            for key, subject_types in class_assignments.items():
                if {"Teori", "Praktikum"}.issubset(subject_types) or {"Responsi", "Praktikum"}.issubset(subject_types):
                    violations.append({
                        'message': "Kelas memiliki jadwal teori/responsi dan praktikum di sesi yang sama",
                        'subject_types': list(subject_types),
                        'details': key
                    })
        except Exception as e:
            print(f"[WARNING] Error in constraint_k: {str(e)}")
            
        return {'valid': not violations, 'violations': violations}

    def validate_constraint_l(self):
        """Dosen max 3 sesi per hari"""
        violations = []
        
        try:
            lecturer_days = {}
            for item in self.schedule:
                cl = self.get_class_lecturer_info(item.get("classLecturerId"))
                if not cl:
                    continue
                    
                # Cek semua dosen terkait
                lecturers = []
                for role in ["primaryLecturer", "secondaryLecturer", "primaryAssistant", "secondaryAssistant"]:
                    if cl.get(role) and isinstance(cl[role], dict) and cl[role].get("id"):
                        lecturers.append(cl[role]["id"])
                
                for lecturer_id in lecturers:
                    day_id = item.get("scheduleDayId")
                    session_id = item.get("scheduleSessionId")
                    key = (day_id, lecturer_id)
                    
                    if key not in lecturer_days:
                        lecturer_days[key] = set()
                    lecturer_days[key].add(session_id)
            
            for key, session_ids in lecturer_days.items():
                if len(session_ids) > 3:
                    violations.append({
                        'message': f"Dosen memiliki {len(session_ids)} sesi mengajar dalam satu hari (maks 3)",
                        'session_ids': list(session_ids),
                        'details': key
                    })
        except Exception as e:
            print(f"[WARNING] Error in constraint_l: {str(e)}")
            
        return {'valid': not violations, 'violations': violations}

    def print_validation_results(self):
        """Mencetak hasil validasi dengan format yang jelas"""
        print("\n=== HASIL VALIDASI CONSTRAINT ===")
        
        if not self.constraint_results:
            print("Tidak ada hasil validasi")
            return
            
        for constraint, result in self.constraint_results.items():
            status = "VALID" if result['valid'] else "TIDAK VALID"
            print(f"\nConstraint {constraint.upper()}: {status}")
            
            if not result['valid']:
                print(f"Jumlah pelanggaran: {len(result['violations'])}")
                for i, violation in enumerate(result['violations'][:3], 1):
                    print(f"  {i}. {violation.get('message', 'Pelanggaran tidak diketahui')}")
                    if 'details' in violation:
                        print(f"     Detail: {violation['details']}")
                    if i == 3 and len(result['violations']) > 3:
                        print(f"  ... dan {len(result['violations']) - 3} pelanggaran lainnya")
        
        # Ringkasan
        valid_count = sum(1 for r in self.constraint_results.values() if r['valid'])
        total_constraints = len(self.constraint_results)
        print(f"\n=== RINGKASAN ===")
        print(f"{valid_count} dari {total_constraints} constraint valid")
        
        if self.unscheduled:
            print(f"\nPERINGATAN: Ada {len(self.unscheduled)} kelas yang tidak terjadwal")
            for i, cl in enumerate(self.unscheduled[:3], 1):
                print(f"  {i}. {cl.get('class', {}).get('className', 'Unknown class')}")
            if len(self.unscheduled) > 3:
                print(f"  ... dan {len(self.unscheduled) - 3} kelas lainnya")

    def save_validation_results_to_txt(self, filename="validation_results.txt"):
        """Menyimpan hasil validasi ke file txt"""
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                f.write("=== HASIL VALIDASI CONSTRAINT ===\n\n")
                
                if not self.constraint_results:
                    f.write("Tidak ada hasil validasi\n")
                    return
                    
                for constraint, result in self.constraint_results.items():
                    status = "VALID" if result['valid'] else "TIDAK VALID"
                    f.write(f"Constraint {constraint.upper()}: {status}\n")
                    
                    if not result['valid']:
                        f.write(f"Jumlah pelanggaran: {len(result['violations'])}\n")
                        for i, violation in enumerate(result['violations'][:3], 1):
                            f.write(f"  {i}. {violation.get('message', 'Pelanggaran tidak diketahui')}\n")
                            if 'details' in violation:
                                f.write(f"     Detail: {violation['details']}\n")
                            if i == 3 and len(result['violations']) > 3:
                                f.write(f"  ... dan {len(result['violations']) - 3} pelanggaran lainnya\n")
                    f.write("\n")
                
                # Ringkasan
                valid_count = sum(1 for r in self.constraint_results.values() if r['valid'])
                total_constraints = len(self.constraint_results)
                f.write("\n=== RINGKASAN ===\n")
                f.write(f"{valid_count} dari {total_constraints} constraint valid\n")
                
                if self.unscheduled:
                    f.write(f"\nPERINGATAN: Ada {len(self.unscheduled)} kelas yang tidak terjadwal\n")
                    for i, cl in enumerate(self.unscheduled[:3], 1):
                        f.write(f"  {i}. {cl.get('class', {}).get('className', 'Unknown class')}\n")
                    if len(self.unscheduled) > 3:
                        f.write(f"  ... dan {len(self.unscheduled) - 3} kelas lainnya\n")
                        
            print(f"\nHasil validasi telah disimpan ke {filename}")
            
        except Exception as e:
            print(f"\nGagal menyimpan hasil validasi: {str(e)}")