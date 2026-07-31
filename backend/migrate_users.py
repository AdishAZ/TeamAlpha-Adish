import sqlite3
import sys
import os

# Ensure backend path is included
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__))))

from models.database import SessionLocal, User, UserRole

def copy_users():
    print("Connecting to old database...")
    old_conn = sqlite3.connect('local_data/campuspilot.db')
    cursor = old_conn.cursor()
    cursor.execute("SELECT id, email, password_hash, role FROM users")
    rows = cursor.fetchall()
    
    db = SessionLocal()
    for row in rows:
        user_id, email, password_hash, role = row
        # Skip if already exists
        if not db.query(User).filter(User.email == email).first():
            new_user = User(
                id=user_id,
                email=email,
                password_hash=password_hash,
                role=UserRole(role)
            )
            db.add(new_user)
            print(f"Copied user: {email}")
    db.commit()
    print("Done copying users.")

if __name__ == "__main__":
    copy_users()
