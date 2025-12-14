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
    # 🟢 CRITICAL FIX: Add the cardano_address field
    cardano_address: Optional[str] = None 

    class Config:
        from_attributes = True

class TokenBalance(BaseModel):
    token_balance: int

class UserStats(BaseModel):
    lessons_completed: int
    quizzes_taken: int

# 🏆 NEW: Leaderboard Schema
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

    class Config:
        from_attributes = True

class CategoryResponse(BaseModel):
    category: str
    count: int

# 💡 NEW: Schema for Lesson Creation (Admin Input)
class LessonCreate(BaseModel):
    category: str
    title: str
    content: str
    video_url: Optional[str] = None
    order_index: int = 0


# --- Quiz Schemas ---
# 💡 NEW: Schema for creating a Quiz Question
class QuizQuestionBase(BaseModel):
    question: str
    options: List[str] 
    correct_option: str # The correct option identifier, e.g., "A"

# 💡 NEW: Schema for creating a batch of quiz questions (Admin Input)
class QuizCreateRequest(BaseModel):
    lesson_id: UUID
    questions: List[QuizQuestionBase]

class QuizQuestionResponse(BaseModel):
    id: UUID
    question: str
    options: List[str] # e.g. ["Option A", "Option B"]

class AnswerSubmission(BaseModel):
    question_id: UUID
    selected: str # "A", "B", etc.

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

# --- Reward Schemas ---
class RewardSummary(BaseModel):
    total_tokens_earned: int
    total_quizzes_passed: int

    class Config:
        from_attributes = True

# 🚀 NEW/FIXED: Schema to display detailed reward history on the frontend
class RewardHistory(BaseModel):
    id: UUID
    lesson_title: str
    tokens_earned: int
    created_at: datetime
    type: str # e.g., "Reward", required by WalletModule.jsx logic

    class Config:
        from_attributes = True