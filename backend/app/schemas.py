from pydantic import BaseModel, EmailStr
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

# --- NEW: Password Reset Schemas ---
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

# 🏆 Leaderboard Schema
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
    min_read_time: Optional[int] = 30  # 🆕 ANTI-CHEAT
    token_reward: Optional[int] = 100  # 🆕 ANTI-CHEAT
    passing_score: Optional[int] = 70  # 🆕 ANTI-CHEAT

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
    min_read_time: int = 30  # 🆕 ANTI-CHEAT
    token_reward: int = 100  # 🆕 ANTI-CHEAT
    passing_score: int = 70  # 🆕 ANTI-CHEAT

# 🆕 ANTI-CHEAT: Admin update lesson rewards
class LessonUpdateRewards(BaseModel):
    token_reward: Optional[int] = None
    passing_score: Optional[int] = None
    min_read_time: Optional[int] = None

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

    class Config:
        from_attributes = True

class AnswerSubmission(BaseModel):
    question_id: UUID
    selected: str

class QuizSubmitRequest(BaseModel):
    lesson_id: UUID
    answers: List[AnswerSubmission]

class QuizResultResponse(BaseModel):
    score: int
    correct: int
    wrong: int
    tokens_awarded: int

    class Config:
        from_attributes = True

# 🆕 ANTI-CHEAT: Quiz Configuration Schemas
class QuizConfigCreate(BaseModel):
    lesson_id: UUID
    total_questions: int  # Total in pool (e.g., 10)
    questions_per_quiz: int  # Show per quiz (e.g., 3)
    time_limit_seconds: Optional[int] = None
    min_time_per_question: int = 3
    cooldown_seconds: int = 30

class QuizConfigUpdate(BaseModel):
    total_questions: Optional[int] = None
    questions_per_quiz: Optional[int] = None
    time_limit_seconds: Optional[int] = None
    min_time_per_question: Optional[int] = None
    cooldown_seconds: Optional[int] = None

class QuizConfigResponse(BaseModel):
    id: UUID
    lesson_id: UUID
    total_questions: int
    questions_per_quiz: int
    time_limit_seconds: Optional[int]
    min_time_per_question: int
    cooldown_seconds: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# 🆕 ANTI-CHEAT: Quiz Session Schemas
class QuizSessionStart(BaseModel):
    lesson_id: UUID
    lesson_read_time: int  # Seconds spent reading lesson

class QuizSessionResponse(BaseModel):
    session_token: str
    questions: List[UUID]  # Question IDs to show
    time_limit: Optional[int]
    min_time_per_question: int

class QuizSubmitWithSession(BaseModel):
    session_token: str
    answers: List[AnswerSubmission]
    time_taken: int  # Total seconds

# 🆕 ANTI-CHEAT: Cheat Flag Schemas
class CheatFlagResponse(BaseModel):
    id: UUID
    user_id: UUID
    user_name: str
    lesson_id: Optional[UUID]
    lesson_title: Optional[str]
    flag_type: str
    severity: str
    description: str
    is_reviewed: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class CheatFlagReview(BaseModel):
    action_taken: str  # "warning", "tokens_revoked", "banned", "false_positive"
    notes: Optional[str] = None

# 🆕 ANTI-CHEAT: User Activity Summary
class UserActivitySummary(BaseModel):
    user_id: UUID
    user_name: str
    total_quizzes_today: int
    total_quizzes_this_hour: int
    perfect_scores: int
    average_time_per_quiz: float
    suspicious_patterns: int
    last_activity: datetime
    
    class Config:
        from_attributes = True

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