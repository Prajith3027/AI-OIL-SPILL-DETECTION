import os
import glob
import sqlite3

print("Current working dir:", os.getcwd())
db_files = glob.glob("**/*.db", recursive=True) + glob.glob("*.db")
print("Found DB files:", db_files)

for db_path in ["oilspill.db", "test.db", "backend/oilspill.db"]:
    if os.path.exists(db_path):
        print(f"\n--- Checking {db_path} ---")
        conn = sqlite3.connect(db_path)
        c = conn.cursor()
        try:
            c.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = [t[0] for t in c.fetchall()]
            print("Tables:", tables)
            if "users" in tables:
                c.execute("SELECT id, name, email, role, password_hash FROM users")
                users = c.fetchall()
                print(f"Users ({len(users)}):")
                for u in users:
                    print(" -", u[1], u[2], u[3])
        except Exception as e:
            print("Error querying db:", e)
        conn.close()
