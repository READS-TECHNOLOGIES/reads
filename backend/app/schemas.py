from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Any
from uuid import UUID
from datetime import datetime

# --- Auth Schemas ---
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

# --- Password Reset Schemas ---
class RequestPasswordReset(BaseModel):
    email: EmailStr

class ResetPassword(BaseModel):
    token: str
    new_password: str

class PasswordResetResponse(BaseModel):
    message: str

# --- User & Wallet Schemas ---
class UserProfile(BaseModel):
    id: UUID
    name: str
    email: EmailStr
    is_admin: bool
    created_at: datetime
    cardano_address: Optional[str] = None 

    class Config:
        from_attributes = True

class TokenBalance(BaseModel):
    token_balance: int

class UserStats(BaseModel):
    lessons_completed: int
    quizzes_taken: int

# --- Leaderboard Schema ---
class LeaderboardEntry(BaseModel):
    rank: int
    user_id: str
    name: str
    total_tokens: int
    quizzes_passed: int
    lessons_completed: int
    is_current_user: bool
    
    class Config:
        from_attributes = True

# --- Lesson Schemas ---
class LessonBase(BaseModel):
    id: UUID
    category: str
    title: str
    order_index: int

class LessonDetail(LessonBase):
    content: str
    video_url: Optional[str] = None
    # 🆕 Include read time requirement
    min_read_time: Optional[int] = 30

    class Config:
        from_attributes = True

class CategoryResponse(BaseModel):
    category: str
    count: int

class LessonCreate(BaseModel):
    category: str
    title: str
    content: str
    video_url: Optional[str] = None
    order_index: int = 0

# 🆕 Track lesson read time
class LessonReadTime(BaseModel):
    lesson_id: UUID
    read_time_seconds: int

# --- Quiz Schemas ---
class QuizQuestionBase(BaseModel):
    question: str
    options: List[str] 
    correct_option: str

class QuizCreateRequest(BaseModel):
    lesson_id: UUID
    questions: List[QuizQuestionBase]

class QuizQuestionResponse(BaseModel):
    id: UUID
    question: str
    options: List[str]

class AnswerSubmission(BaseModel):
    question_id: UUID
    selected: str
    # 🆕 Track time spent on each question
    time_spent_seconds: int = Field(ge=0)

class QuizSubmitRequest(BaseModel):
    lesson_id: UUID
    answers: List[AnswerSubmission]
    # 🆕 Track total quiz session time
    total_time_seconds: int = Field(ge=0)
    attempt_id: UUID  # Link to the quiz attempt session

class QuizResultResponse(BaseModel):
    score: int
    correct: int
    wrong: int
    tokens_awarded: int
    passed: bool
    flagged_suspicious: bool = False
    message: Optional[str] = None

    class Config:
        from_attributes = True

# --- 🆕 ANTI-CHEAT: Quiz Configuration Schemas (Admin) ---
class QuizConfigCreate(BaseModel):
    lesson_id: UUID
    total_questions_in_pool: int = Field(ge=1, description="Total questions in pool")
    questions_per_quiz: int = Field(ge=1, description="Questions shown per quiz")
    token_reward: int = Field(ge=0, default=50)
    passing_score: int = Field(ge=0, le=100, default=70)
    cooldown_seconds: int = Field(ge=0, default=30)
    min_read_time_seconds: int = Field(ge=0, default=30)
    min_time_per_question: int = Field(ge=0, default=3)

class QuizConfigUpdate(BaseModel):
    total_questions_in_pool: Optional[int] = Field(None, ge=1)
    questions_per_quiz: Optional[int] = Field(None, ge=1)
    token_reward: Optional[int] = Field(None, ge=0)
    passing_score: Optional[int] = Field(None, ge=0, le=100)
    cooldown_seconds: Optional[int] = Field(None, ge=0)
    min_read_time_seconds: Optional[int] = Field(None, ge=0)
    min_time_per_question: Optional[int] = Field(None, ge=0)

class QuizConfigResponse(BaseModel):
    id: UUID
    lesson_id: UUID
    total_questions_in_pool: int
    questions_per_quiz: int
    token_reward: int
    passing_score: int
    cooldown_seconds: int
    min_read_time_seconds: int
    min_time_per_question: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# --- 🆕 ANTI-CHEAT: Quiz Attempt Schemas ---
class QuizAttemptStart(BaseModel):
    lesson_id: UUID

class QuizAttemptResponse(BaseModel):
    attempt_id: UUID
    lesson_id: UUID
    questions: List[QuizQuestionResponse]
    started_at: datetime
    min_time_per_question: int
    cooldown_seconds: int

    class Config:
        from_attributes = True

class QuizAttemptStatus(BaseModel):
    can_attempt: bool
    reason: Optional[str] = None
    cooldown_remaining: Optional[int] = None  # Seconds remaining
    hourly_attempts_remaining: Optional[int] = None
    daily_attempts_remaining: Optional[int] = None

# --- Reward Schemas ---
class RewardSummary(BaseModel):
    total_tokens_earned: int
    total_quizzes_passed: int

    class Config:
        from_attributes = True

class RewardHistory(BaseModel):
    id: UUID
    lesson_title: str
    tokens_earned: int
    created_at: datetime
    type: str

    class Config:
        from_attributes = True

# --- 🆕 ADMIN: Suspicious Activity Report ---
class SuspiciousAttempt(BaseModel):
    attempt_id: UUID
    user_id: UUID
    user_name: str
    lesson_id: UUID
    lesson_title: str
    total_time_seconds: int
    expected_min_time: int
    score: int
    flagged_at: datetime

    class Config:
        from_attributes = True