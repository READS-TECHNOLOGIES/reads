from fastapi import FastAPI, Depends, HTTPException, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List
from datetime import datetime, timedelta
from uuid import UUID
import uuid
import os
import secrets
import random

# CRITICAL FIX: Use relative imports for Vercel runtime environment
from .app import models, schemas, auth, database, email_service
from .app import cardano_utils

# Initialize DB
print("Attempting to create database tables...")
try:
    models.Base.metadata.create_all(bind=database.engine)
    print("Database tables initialized successfully (or already exist).")
except Exception as e:
    print(f"WARNING: Initial database table creation failed. Error: {e}")

app = FastAPI(title="$READS Backend", root_path="/api")
print("FastAPI app initialized with root_path=/api")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://reads-phi.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependencies
def get_current_admin(current_user: models.User = Depends(auth.get_current_user)):
    """Checks if the authenticated user has admin privileges."""
    if not current_user.is_admin:
        print(f"ADMIN FAIL: User {current_user.id} tried to access admin route.")
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return current_user

# ----------------------------------------------------
# ANTI-CHEAT HELPER FUNCTIONS
# ----------------------------------------------------

def check_rate_limit(user_id: UUID, db: Session) -> tuple[bool, str]:
    """Check if user has exceeded rate limits."""
    now = datetime.utcnow()
    
    # Hourly limit (10 quizzes)
    hour_ago = now - timedelta(hours=1)
    quizzes_this_hour = db.query(models.QuizResult).filter(
        models.QuizResult.user_id == user_id,
        models.QuizResult.created_at >= hour_ago
    ).count()
    
    if quizzes_this_hour >= 10:
        return False, "Rate limit: Maximum 10 quizzes per hour."
    
    # Daily limit (30 quizzes)
    day_ago = now - timedelta(days=1)
    quizzes_today = db.query(models.QuizResult).filter(
        models.QuizResult.user_id == user_id,
        models.QuizResult.created_at >= day_ago
    ).count()
    
    if quizzes_today >= 30:
        return False, "Rate limit: Maximum 30 quizzes per day."
    
    return True, ""

def check_cooldown(user_id: UUID, lesson_id: UUID, db: Session) -> tuple[bool, int]:
    """Check cooldown between quiz attempts."""
    quiz_config = db.query(models.QuizConfig).filter(
        models.QuizConfig.lesson_id == lesson_id
    ).first()
    
    cooldown = quiz_config.cooldown_seconds if quiz_config else 30
    
    last_attempt = db.query(models.QuizResult).filter(
        models.QuizResult.user_id == user_id,
        models.QuizResult.lesson_id == lesson_id
    ).order_by(desc(models.QuizResult.created_at)).first()
    
    if last_attempt:
        time_since = (datetime.utcnow() - last_attempt.created_at).total_seconds()
        if time_since < cooldown:
            return False, int(cooldown - time_since)
    
    return True, 0

def detect_suspicious_patterns(user_id: UUID, answers: List, db: Session) -> List[str]:
    """Detect suspicious answer patterns."""
    flags = []
    
    # All same answers
    answer_options = [a.selected for a in answers]
    if len(set(answer_options)) == 1:
        flags.append("identical_answers")
    
    # Recent perfect scores
    recent = db.query(models.QuizResult).filter(
        models.QuizResult.user_id == user_id
    ).order_by(desc(models.QuizResult.created_at)).limit(5).all()
    
    perfect_count = sum(1 for r in recent if r.score == 100)
    if perfect_count >= 4:
        flags.append("consecutive_perfect_scores")
    
    return flags

def create_cheat_flag(user_id: UUID, flag_type: str, description: str, 
                     severity: str, lesson_id: UUID = None, 
                     metadata: dict = None, db: Session = None):
    """Create cheat detection flag."""
    flag = models.CheatFlag(
        user_id=user_id,
        lesson_id=lesson_id,
        flag_type=flag_type,
        severity=severity,
        description=description,
        metadata=metadata
    )
    db.add(flag)
    db.commit()

# [Previous endpoints remain exactly the same until line 250 - all auth, profile, lessons, etc.]
# I'll add the anti-cheat endpoints after the existing quiz endpoints

# ... (keeping all your existing code) ...

# ADD THESE NEW ENDPOINTS AFTER YOUR EXISTING QUIZ ENDPOINTS:

# ----------------------------------------------------
# ANTI-CHEAT QUIZ SYSTEM
# ----------------------------------------------------

@app.post("/quiz/start-session", response_model=schemas.QuizSessionResponse)
def start_quiz_session(
    session_data: schemas.QuizSessionStart,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    """Start quiz session with random question selection."""
    lesson_id = session_data.lesson_id
    
    # Check if already completed
    existing = db.query(models.QuizResult).filter(
        models.QuizResult.user_id == current_user.id,
        models.QuizResult.lesson_id == lesson_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=409, detail="Quiz already completed")
    
    # Check rate limits
    allowed, msg = check_rate_limit(current_user.id, db)
    if not allowed:
        raise HTTPException(status_code=429, detail=msg)
    
    # Check cooldown
    can_take, wait_time = check_cooldown(current_user.id, lesson_id, db)
    if not can_take:
        raise HTTPException(status_code=429, detail=f"Wait {wait_time}s before next quiz")
    
    # Validate read time
    lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    min_read = lesson.min_read_time or 30
    if session_data.lesson_read_time < min_read:
        create_cheat_flag(
            user_id=current_user.id,
            flag_type="insufficient_read_time",
            description=f"Read time: {session_data.lesson_read_time}s (required: {min_read}s)",
            severity="low",
            lesson_id=lesson_id,
            db=db
        )
        raise HTTPException(status_code=400, detail=f"Read lesson for at least {min_read}s")
    
    # Get quiz config
    quiz_config = db.query(models.QuizConfig).filter(
        models.QuizConfig.lesson_id == lesson_id
    ).first()
    
    # Get questions
    all_questions = db.query(models.QuizQuestion).filter(
        models.QuizQuestion.lesson_id == lesson_id,
        models.QuizQuestion.is_active == True
    ).all()
    
    if not all_questions:
        raise HTTPException(status_code=404, detail="No questions found")
    
    # Random selection
    num_to_show = quiz_config.questions_per_quiz if quiz_config else min(3, len(all_questions))
    selected = random.sample(all_questions, min(num_to_show, len(all_questions)))
    question_ids = [q.id for q in selected]
    
    # Create session
    session_token = secrets.token_urlsafe(32)
    quiz_session = models.QuizSession(
        user_id=current_user.id,
        lesson_id=lesson_id,
        session_token=session_token,
        questions_shown=question_ids,
        lesson_read_time=session_data.lesson_read_time
    )
    db.add(quiz_session)
    db.commit()
    
    return schemas.QuizSessionResponse(
        session_token=session_token,
        questions=question_ids,
        time_limit=quiz_config.time_limit_seconds if quiz_config else None,
        min_time_per_question=quiz_config.min_time_per_question if quiz_config else 3
    )

@app.get("/quiz/session/{session_token}/questions", response_model=List[schemas.QuizQuestionResponse])
def get_session_questions(
    session_token: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    """Get questions for this session."""
    session = db.query(models.QuizSession).filter(
        models.QuizSession.session_token == session_token,
        models.QuizSession.user_id == current_user.id,
        models.QuizSession.is_active == True
    ).first()
    
    if not session:
        raise HTTPException(status_code=400, detail="Invalid session")
    
    questions = db.query(models.QuizQuestion).filter(
        models.QuizQuestion.id.in_(session.questions_shown)
    ).all()
    
    random.shuffle(questions)
    return questions

@app.post("/quiz/submit-with-session", response_model=schemas.QuizResultResponse)
def submit_quiz_with_session(
    submission: schemas.QuizSubmitWithSession,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    """Submit quiz with session validation."""
    # Validate session
    session = db.query(models.QuizSession).filter(
        models.QuizSession.session_token == submission.session_token,
        models.QuizSession.user_id == current_user.id,
        models.QuizSession.is_active == True
    ).first()
    
    if not session:
        raise HTTPException(status_code=400, detail="Invalid session")
    
    lesson_id = session.lesson_id
    
    # Check if already submitted
    existing = db.query(models.QuizResult).filter(
        models.QuizResult.user_id == current_user.id,
        models.QuizResult.lesson_id == lesson_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=409, detail="Already completed")
    
    # Get config
    quiz_config = db.query(models.QuizConfig).filter(
        models.QuizConfig.lesson_id == lesson_id
    ).first()
    
    lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()
    
    # Validate timing
    min_time_per_q = quiz_config.min_time_per_question if quiz_config else 3
    min_total = len(submission.answers) * min_time_per_q
    
    if submission.time_taken < min_total:
        create_cheat_flag(
            user_id=current_user.id,
            flag_type="speed_cheat",
            description=f"Completed in {submission.time_taken}s (min: {min_total}s)",
            severity="high",
            lesson_id=lesson_id,
            metadata={"time_taken": submission.time_taken},
            db=db
        )
        raise HTTPException(status_code=400, detail="Completed too quickly")
    
    # Validate answers match session
    answer_ids = {str(a.question_id) for a in submission.answers}
    session_ids = {str(q) for q in session.questions_shown}
    
    if answer_ids != session_ids:
        raise HTTPException(status_code=400, detail="Answer mismatch")
    
    # Get correct answers
    questions = db.query(models.QuizQuestion).filter(
        models.QuizQuestion.id.in_(session.questions_shown)
    ).all()
    
    correct_answers = {str(q.id): q.correct_option for q in questions}
    
    # Calculate score
    correct_count = sum(
        1 for a in submission.answers 
        if str(a.question_id) in correct_answers 
        and a.selected == correct_answers[str(a.question_id)]
    )
    
    wrong_count = len(submission.answers) - correct_count
    total = len(questions)
    score = int((correct_count / total) * 100) if total > 0 else 0
    
    # Detect patterns
    suspicious = detect_suspicious_patterns(current_user.id, submission.answers, db)
    if suspicious:
        create_cheat_flag(
            user_id=current_user.id,
            flag_type="pattern_detection",
            description=f"Patterns: {', '.join(suspicious)}",
            severity="medium",
            lesson_id=lesson_id,
            metadata={"patterns": suspicious, "score": score},
            db=db
        )
    
    # Determine rewards
    passing = quiz_config.passing_score if quiz_config else lesson.passing_score or 70
    token_reward = lesson.token_reward or 100
    
    tokens_awarded = 0
    
    if score >= passing:
        tokens_awarded = token_reward
        
        wallet = db.query(models.Wallet).filter(
            models.Wallet.user_id == current_user.id
        ).first()
        
        if wallet:
            wallet.token_balance += tokens_awarded
        
        reward = models.Reward(
            user_id=current_user.id,
            lesson_id=lesson_id,
            tokens_earned=tokens_awarded
        )
        db.add(reward)
    
    # Record result
    result = models.QuizResult(
        user_id=current_user.id,
        lesson_id=lesson_id,
        score=score,
        correct_count=correct_count,
        wrong_count=wrong_count
    )
    db.add(result)
    
    # Mark session complete
    session.is_active = False
    session.submitted_at = datetime.utcnow()
    
    db.commit()
    
    return {
        "score": score,
        "correct": correct_count,
        "wrong": wrong_count,
        "tokens_awarded": tokens_awarded
    }

# ----------------------------------------------------
# ADMIN: ANTI-CHEAT MANAGEMENT
# ----------------------------------------------------

@app.post("/admin/quiz-config", response_model=schemas.QuizConfigResponse)
def create_quiz_config(
    config: schemas.QuizConfigCreate,
    db: Session = Depends(database.get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    """Create/update quiz configuration."""
    existing = db.query(models.QuizConfig).filter(
        models.QuizConfig.lesson_id == config.lesson_id
    ).first()
    
    if existing:
        for key, value in config.model_dump(exclude_unset=True).items():
            if key != "lesson_id":
                setattr(existing, key, value)
        db.commit()
        db.refresh(existing)
        return existing
    
    new_config = models.QuizConfig(**config.model_dump())
    db.add(new_config)
    db.commit()
    db.refresh(new_config)
    return new_config

@app.put("/admin/lessons/{lesson_id}/rewards", response_model=schemas.LessonDetail)
def update_lesson_rewards(
    lesson_id: UUID,
    rewards: schemas.LessonUpdateRewards,
    db: Session = Depends(database.get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    """Update lesson rewards."""
    lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()
    
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    if rewards.token_reward is not None:
        lesson.token_reward = rewards.token_reward
    if rewards.passing_score is not None:
        lesson.passing_score = rewards.passing_score
    if rewards.min_read_time is not None:
        lesson.min_read_time = rewards.min_read_time
    
    db.commit()
    db.refresh(lesson)
    return lesson

@app.get("/admin/cheat-flags", response_model=List[schemas.CheatFlagResponse])
def get_cheat_flags(
    unreviewed_only: bool = True,
    db: Session = Depends(database.get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    """Get cheat flags for review."""
    query = db.query(models.CheatFlag, models.User, models.Lesson).join(
        models.User, models.CheatFlag.user_id == models.User.id
    ).outerjoin(
        models.Lesson, models.CheatFlag.lesson_id == models.Lesson.id
    )
    
    if unreviewed_only:
        query = query.filter(models.CheatFlag.is_reviewed == False)
    
    flags = query.order_by(desc(models.CheatFlag.created_at)).all()
    
    return [
        schemas.CheatFlagResponse(
            id=flag.id,
            user_id=flag.user_id,
            user_name=user.name,
            lesson_id=flag.lesson_id,
            lesson_title=lesson.title if lesson else None,
            flag_type=flag.flag_type,
            severity=flag.severity.value,
            description=flag.description,
            is_reviewed=flag.is_reviewed,
            created_at=flag.created_at
        )
        for flag, user, lesson in flags
    ]

@app.put("/admin/cheat-flags/{flag_id}/review")
def review_cheat_flag(
    flag_id: UUID,
    review: schemas.CheatFlagReview,
    db: Session = Depends(database.get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    """Review cheat flag."""
    flag = db.query(models.CheatFlag).filter(models.CheatFlag.id == flag_id).first()
    
    if not flag:
        raise HTTPException(status_code=404, detail="Flag not found")
    
    flag.is_reviewed = True
    flag.reviewed_by = current_admin.id
    flag.reviewed_at = datetime.utcnow()
    flag.action_taken = review.action_taken
    
    # Take action
    if review.action_taken == "tokens_revoked":
        last_reward = db.query(models.Reward).filter(
            models.Reward.user_id == flag.user_id,
            models.Reward.lesson_id == flag.lesson_id
        ).first()
        
        if last_reward:
            wallet = db.query(models.Wallet).filter(
                models.Wallet.user_id == flag.user_id
            ).first()
            if wallet:
                wallet.token_balance = max(0, wallet.token_balance - last_reward.tokens_earned)
    
    db.commit()
    
    return {"message": f"Flag reviewed: {review.action_taken}"}

# [Keep all your existing endpoints below this line]