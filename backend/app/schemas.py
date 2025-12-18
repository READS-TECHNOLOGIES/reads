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

# ============================================================
# 🤖 AI CONTENT ASSISTANT SCHEMAS
# ============================================================

# --- Generate Lesson Schemas ---
class AIGenerateLessonRequest(BaseModel):
    topic: str = Field(..., min_length=3, max_length=200, description="Topic for the lesson")
    category: str = Field(..., description="Category (e.g., JAMB, WAEC, NECO, General)")
    difficulty: str = Field(default="intermediate", description="Difficulty level: beginner, intermediate, advanced")
    target_length: int = Field(default=1000, ge=500, le=5000, description="Target word count")

class AILessonResponse(BaseModel):
    title: str
    content: str

# --- Generate Quiz Schemas ---
class AIGenerateQuizRequest(BaseModel):
    lesson_content: str = Field(..., min_length=100, description="Lesson content to generate quiz from")
    num_questions: int = Field(default=10, ge=3, le=20, description="Number of questions to generate")
    difficulty: str = Field(default="intermediate", description="Difficulty level: beginner, intermediate, advanced")

class AIQuizQuestion(BaseModel):
    question: str
    options: List[str] = Field(..., min_items=4, max_items=4)
    correct_option: str = Field(..., pattern="^[A-D]$")

class AIQuizResponse(BaseModel):
    questions: List[AIQuizQuestion]

# --- Improve Content Schemas ---
class AIImproveContentRequest(BaseModel):
    content: str = Field(..., min_length=50, description="Content to improve")
    instruction: str = Field(..., min_length=5, max_length=500, description="Improvement instructions")

class AIImproveContentResponse(BaseModel):
    improved_content: str
    explanation: str

# --- Suggest Topics Schemas ---
class AISuggestTopicsRequest(BaseModel):
    topic: str = Field(..., min_length=3, max_length=200, description="Current topic")
    category: str = Field(..., description="Category context")
    num_suggestions: int = Field(default=5, ge=3, le=10, description="Number of suggestions")

class AITopicSuggestion(BaseModel):
    title: str
    description: str

class AISuggestTopicsResponse(BaseModel):
    suggestions: List[AITopicSuggestion]

# --- Quality Check Schemas ---
class AIQualityCheckRequest(BaseModel):
    content: str = Field(..., min_length=50, description="Content to check")
    content_type: str = Field(default="lesson", description="Type: lesson or quiz")

class AIQualityCheckResponse(BaseModel):
    overall_score: int = Field(..., ge=0, le=100, description="Overall quality score 0-100")
    issues: List[str] = Field(default_factory=list, description="List of issues found")
    suggestions: List[str] = Field(default_factory=list, description="List of improvement suggestions")
    summary: str = Field(..., description="Summary of quality assessment")

# ============================================================
# END OF AI SCHEMAS
# ============================================================