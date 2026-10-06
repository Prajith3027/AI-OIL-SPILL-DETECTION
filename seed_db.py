import os
import sys

# Ensure backend is in python path
sys.path.insert(0, os.path.abspath("backend"))

from app.database.session import SessionLocal, engine, Base
import app.models  # ensure models registered
from app.database.auth_setup import migrate_citizen_reports, seed_initial_admin

Base.metadata.create_all(bind=engine)
migrate_citizen_reports(bind=engine)

with SessionLocal() as db:
    seed_initial_admin(db)

print("Database seeding completed successfully!")
