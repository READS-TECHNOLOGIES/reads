import uuid
import enum
from sqlalchemy import Column, String, Integer, Boolean, Text, DateTime, ForeignKey, JSON, UniqueConstraint, Float, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.sql import func
from .database import Base

# Enums for Anti-Cheat System
class CheatFlagSeverity(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class CheatFlagAction(str, enum.Enum):
    WARNING = "warning"
    TOKENS_REVOKED = "tokens_revoked"
    BANNED = "banned"
    FALSE_POSITIVE = "false_positive"

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    is_admin = Column(Boolean, default=False) 
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Cardano Wallet
    cardano_address = Column(String, nullable=True)
    encrypted_skey = Column(String, nullable=True)

    # Relationships
    wallet = relationship("Wallet", back_populates="user", uselist=False)
    progress = relationship("LessonProgress", back_populates="user")
    quiz_results = relationship("QuizResult", back_populates="user")
    rewards = relationship("Reward", back_populates="user")
    password_reset_tokens = relationship("PasswordResetToken", back_populates="user")
    quiz_sessions = relationship("QuizSession", back_populates="user")
    cheat_flags = relationship("CheatFlag", foreign_keys="CheatFlag.user_id", back_populates="user")
    activities = relationship("UserActivity", back_populates="user")

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
    
    # 🆕 ANTI-CHEAT: Admin-controlled settings
    min_read_time = Column(Integer, default=30)  # Minimum seconds to read lesson
    token_reward = Column(Integer, default=100)  # Tokens awarded for passing
    passing_score = Column(Integer, default=70)  # Required score percentage

    # Relationships
    questions = relationship("QuizQuestion", back_populates="lesson")
    quiz_config = relationship("QuizConfig", back_populates="lesson", uselist=False)

class LessonProgress(Base):
    __tablename__ = "lesson_progress"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    lesson_id = Column(UUID(as_uuid=True), ForeignKey("lessons.id"), nullable=False)
    completed = Column(Boolean, default=False, nullable=False) 
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
    
    # 🆕 ANTI-CHEAT: Question pool management
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    lesson = relationship("Lesson", back_populates="questions")

# 🆕 ANTI-CHEAT: Quiz Configuration
class QuizConfig(Base):
    __tablename__ = "quiz_configs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lesson_id = Column(UUID(as_uuid=True), ForeignKey("lessons.id"), unique=True, nullable=False)
    
    # Question pool settings
    total_questions = Column(Integer, nullable=False)  # Total in pool (e.g., 10)
    questions_per_quiz = Column(Integer, nullable=False)  # Shown per attempt (e.g., 3)
    
    # Time settings
    time_limit_seconds = Column(Integer, nullable=True)
    min_time_per_question = Column(Integer, default=3, nullable=False)
    
    # Cooldown
    cooldown_seconds = Column(Integer, default=30, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    lesson = relationship("Lesson", back_populates="quiz_config")

# 🆕 ANTI-CHEAT: Quiz Session Tracking
class QuizSession(Base):
    __tablename__ = "quiz_sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    lesson_id = Column(UUID(as_uuid=True), ForeignKey("lessons.id"), nullable=False)
    
    session_token = Column(String, unique=True, nullable=False, index=True)
    questions_shown = Column(ARRAY(UUID(as_uuid=True)), nullable=False)
    
    # Timing
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    lesson_read_time = Column(Integer, default=0, nullable=False)
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    
    user = relationship("User", back_populates="quiz_sessions")
    lesson = relationship("Lesson")

class QuizResult(Base):
    __tablename__ = "quiz_results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    lesson_id = Column(UUID(as_uuid=True), ForeignKey("lessons.id"), nullable=False)
    score = Column(Integer, nullable=False)
    correct_count = Column(Integer, nullable=False)
    wrong_count = Column(Integer, nullable=False)
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

# 🆕 ANTI-CHEAT: Cheat Detection Flags
class CheatFlag(Base):
    __tablename__ = "cheat_flags"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    lesson_id = Column(UUID(as_uuid=True), ForeignKey("lessons.id"), nullable=True)
    
    flag_type = Column(String, nullable=False)  # "speed_cheat", "pattern_cheat", etc.
    severity = Column(SQLEnum(CheatFlagSeverity), default=CheatFlagSeverity.LOW, nullable=False)
    description = Column(Text, nullable=False)
    metadata = Column(JSON, nullable=True)
    
    # Resolution
    is_reviewed = Column(Boolean, default=False, nullable=False)
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    action_taken = Column(SQLEnum(CheatFlagAction), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", foreign_keys=[user_id], back_populates="cheat_flags")
    lesson = relationship("Lesson")
    reviewer = relationship("User", foreign_keys=[reviewed_by])

# 🆕 ANTI-CHEAT: User Activity Logging
class UserActivity(Base):
    __tablename__ = "user_activities"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    activity_type = Column(String, nullable=False)  # "quiz_attempt", "lesson_view", etc.
    lesson_id = Column(UUID(as_uuid=True), ForeignKey("lessons.id"), nullable=True)
    
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    metadata = Column(JSON, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    user = relationship("User", back_populates="activities")
    lesson = relationship("Lesson")