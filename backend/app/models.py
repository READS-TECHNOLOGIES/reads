import uuid
from sqlalchemy import Column, String, Integer, Boolean, Text, DateTime, ForeignKey, JSON, UniqueConstraint, Float
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    is_admin = Column(Boolean, default=False) 
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Cardano Wallet Fields
    cardano_address = Column(String, nullable=True)
    encrypted_skey = Column(String, nullable=True)

    # Relationships
    wallet = relationship("Wallet", back_populates="user", uselist=False)
    progress = relationship("LessonProgress", back_populates="user")
    quiz_results = relationship("QuizResult", back_populates="user")
    rewards = relationship("Reward", back_populates="user")
    password_reset_tokens = relationship("PasswordResetToken", back_populates="user")
    quiz_attempts = relationship("QuizAttempt", back_populates="user")

class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    token = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used = Column(Boolean, default=False, nullable=False)

    user = relationship("User", back_populates="password_reset_tokens")

class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    category = Column(String, index=True, nullable=False)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    video_url = Column(String, nullable=True)
    order_index = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    questions = relationship("QuizQuestion", back_populates="lesson")
    quiz_config = relationship("QuizConfig", back_populates="lesson", uselist=False)

class LessonProgress(Base):
    __tablename__ = "lesson_progress"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    lesson_id = Column(UUID(as_uuid=True), ForeignKey("lessons.id"), nullable=False)
    completed = Column(Boolean, default=False, nullable=False)
    
    # 🆕 TIME TRACKING: Track lesson read time
    read_time_seconds = Column(Integer, default=0, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint('user_id', 'lesson_id', name='uq_user_lesson_progress'),
    )

    user = relationship("User", back_populates="progress")
    lesson = relationship("Lesson")

class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lesson_id = Column(UUID(as_uuid=True), ForeignKey("lessons.id"), nullable=False)
    question = Column(Text, nullable=False)
    options = Column(JSON, nullable=False)
    correct_option = Column(String, nullable=False)

    lesson = relationship("Lesson", back_populates="questions")

# 🆕 QUIZ CONFIGURATION MODEL - Admin sets quiz rules
class QuizConfig(Base):
    __tablename__ = "quiz_configs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lesson_id = Column(UUID(as_uuid=True), ForeignKey("lessons.id"), unique=True, nullable=False)
    
    # Admin-configurable settings
    total_questions_in_pool = Column(Integer, nullable=False)  # Total questions available
    questions_per_quiz = Column(Integer, nullable=False)  # How many to show per attempt
    token_reward = Column(Integer, default=50, nullable=False)  # Tokens for passing
    passing_score = Column(Integer, default=70, nullable=False)  # Percentage required to pass
    cooldown_seconds = Column(Integer, default=30, nullable=False)  # Time between attempts
    min_read_time_seconds = Column(Integer, default=30, nullable=False)  # Min lesson read time
    min_time_per_question = Column(Integer, default=3, nullable=False)  # Min seconds per question
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    lesson = relationship("Lesson", back_populates="quiz_config")

# 🆕 QUIZ ATTEMPT TRACKING - Track every quiz attempt with timing
class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    lesson_id = Column(UUID(as_uuid=True), ForeignKey("lessons.id"), nullable=False)
    
    # Random questions shown in this attempt (stored as list of question IDs)
    question_ids = Column(JSON, nullable=False)
    
    # Timing and anti-cheat
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    total_time_seconds = Column(Integer, nullable=True)  # Total time taken
    flagged_suspicious = Column(Boolean, default=False)  # Auto-flagged if too fast
    
    # Results
    score = Column(Integer, nullable=True)  # Final score percentage
    passed = Column(Boolean, default=False)
    
    user = relationship("User", back_populates="quiz_attempts")

# 🆕 RATE LIMIT TRACKING - Track user's quiz activity
class QuizRateLimit(Base):
    __tablename__ = "quiz_rate_limits"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Counters
    hourly_attempts = Column(Integer, default=0, nullable=False)
    daily_attempts = Column(Integer, default=0, nullable=False)
    
    # Timestamps for reset
    last_hourly_reset = Column(DateTime(timezone=True), server_default=func.now())
    last_daily_reset = Column(DateTime(timezone=True), server_default=func.now())
    last_attempt_at = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint('user_id', name='uq_user_rate_limit'),
    )

class QuizResult(Base):
    __tablename__ = "quiz_results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    lesson_id = Column(UUID(as_uuid=True), ForeignKey("lessons.id"), nullable=False)
    score = Column(Integer, nullable=False)
    correct_count = Column(Integer, nullable=False)
    wrong_count = Column(Integer, nullable=False)
    
    # 🆕 Link to attempt for tracking
    attempt_id = Column(UUID(as_uuid=True), ForeignKey("quiz_attempts.id"), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="quiz_results")

class Reward(Base):
    __tablename__ = "rewards"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    lesson_id = Column(UUID(as_uuid=True), ForeignKey("lessons.id"), nullable=False)
    tokens_earned = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="rewards")

class Wallet(Base):
    __tablename__ = "wallets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False)
    token_balance = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="wallet")

# ══════════════════════════════════════════════════════════════════════════
# REPLACE the notification models at the end of your models.py with these:
# ══════════════════════════════════════════════════════════════════════════

class Notification(Base):
    """Stores sent notifications"""
    __tablename__ = 'notifications'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(20), nullable=False, default='info')
    recipient_type = Column(String(20), nullable=False, default='all')
    created_by_admin_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    recipients = relationship('NotificationRecipient', back_populates='notification', cascade='all, delete-orphan')
    created_by = relationship('User', foreign_keys=[created_by_admin_id])


class NotificationRecipient(Base):
    """Tracks which users received notifications"""
    __tablename__ = 'notification_recipients'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    notification_id = Column(UUID(as_uuid=True), ForeignKey('notifications.id'), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    read_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint('notification_id', 'user_id', name='unique_notification_recipient'),
    )

    # Relationships
    notification = relationship('Notification', back_populates='recipients')
    user = relationship('User', foreign_keys=[user_id])


# ══════════════════════════════════════════════════════════════════════════
# KEY CHANGES:
# ══════════════════════════════════════════════════════════════════════════
# 1. Changed from db.Model to Base (matches your existing models)
# 2. Changed from db.Column to Column (matches your existing models)
# 3. Changed all IDs to UUID(as_uuid=True) instead of Integer
# 4. Changed foreign keys to UUID(as_uuid=True) to match users table
# 5. Used server_default=func.now() for timestamps (matches your pattern)
# 6. Fixed relationships to use back_populates instead of backref
# ══════════════════════════════════════════════════════════════════════════