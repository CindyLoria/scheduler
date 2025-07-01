from ..db import SessionLocal
from ..model.model import ScheduleDay, ScheduleSession, Room, ClassLecturer

def load_schedule_data():
    db = SessionLocal()
    data = {
        "scheduleDays": [d.to_dict() for d in db.query(ScheduleDay).all()],
        "scheduleSessions": [s.to_dict() for s in db.query(ScheduleSession).all()],
        "rooms": [r.to_dict() for r in db.query(Room).all()],
        "classLecturers": [c.to_dict() for c in db.query(ClassLecturer).all()]
    }
    db.close()
    return data
