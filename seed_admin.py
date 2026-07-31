import os
import sys

# Add the backend directory to path so we can import from it
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.models.database import SessionLocal, User, UserRole
from backend.core.security import get_password_hash

def seed_admin():
    db = SessionLocal()
    try:
        email = "admin@campuspilot.edu"
        password = "admin"
        
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            print(f"Admin user {email} already exists.")
            # Update role to ADMIN just in case
            existing_user.role = UserRole.ADMIN
            # Update password
            existing_user.password_hash = get_password_hash(password)
            db.commit()
            print("Updated existing admin user credentials and role.")
        else:
            new_admin = User(
                email=email,
                password_hash=get_password_hash(password),
                role=UserRole.ADMIN
            )
            db.add(new_admin)
            db.commit()
            print(f"Successfully created admin user: {email} / {password}")
    except Exception as e:
        print(f"Error seeding admin: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_admin()
