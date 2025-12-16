from fastapi import FastAPI, Depends, HTTPException, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_
from typing import List
from datetime import datetime, timedelta, timezone  # ✅ Added timezone import
from uuid import UUID
import uuid
import os
import random

from .app import models, schemas, auth, database, email_service
from .app import cardano_utils

print("Attempting to create database tables...")
try:
    models.Base.metadata.create_all(bind=database.engine)
    print("Database tables initialized successfully (or already exist).")
except Exception as e:
    print(f"WARNING: Initial database table creation failed. Error: {e}")

app = FastAPI(title="$READS Backend", root_path="/api")
print("FastAPI app initialized with root_path=/api")

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

# 🆕 ANTI-CHEAT HELPER FUNCTIONS
def check_rate_limit(user_id: UUID, db: Session) -> dict:
    """Check if user has exceeded rate limits. Returns status dict."""
    rate_limit = db.query(models.QuizRateLimit).filter(
        models.QuizRateLimit.user_id == user_id
    ).first()
    
    now = datetime.now(timezone.utc)  # ✅ Fixed: timezone-aware
    
    if not rate_limit:
        # Create new rate limit record
        rate_limit = models.QuizRateLimit(
            user_id=user_id,
            hourly_attempts=0,
            daily_attempts=0,
            last_hourly_reset=now,
            last_daily_reset=now
        )
        db.add(rate_limit)
        db.commit()
        return {"can_attempt": True}
    
    # Reset hourly counter if 1 hour has passed
    if (now - rate_limit.last_hourly_reset).total_seconds() >= 3600:
        rate_limit.hourly_attempts = 0
        rate_limit.last_hourly_reset = now
    
    # Reset daily counter if 24 hours have passed
    if (now - rate_limit.last_daily_reset).total_seconds() >= 86400:
        rate_limit.daily_attempts = 0
        rate_limit.last_daily_reset = now
    
    db.commit()
    
    # Check limits (configurable)
    HOURLY_LIMIT = 10
    DAILY_LIMIT = 30
    
    if rate_limit.hourly_attempts >= HOURLY_LIMIT:
        return {
            "can_attempt": False,
            "reason": "Hourly limit reached",
            "hourly_remaining": 0,
            "daily_remaining": DAILY_LIMIT - rate_limit.daily_attempts
        }
    
    if rate_limit.daily_attempts >= DAILY_LIMIT:
        return {
            "can_attempt": False,
            "reason": "Daily limit reached",
            "hourly_remaining": HOURLY_LIMIT - rate_limit.hourly_attempts,
            "daily_remaining": 0
        }
    
    return {
        "can_attempt": True,
        "hourly_remaining": HOURLY_LIMIT - rate_limit.hourly_attempts,
        "daily_remaining": DAILY_LIMIT - rate_limit.daily_attempts
    }

def check_cooldown(user_id: UUID, lesson_id: UUID, cooldown_seconds: int, db: Session) -> dict:
    """Check if user must wait before taking quiz again."""
    last_attempt = db.query(models.QuizAttempt).filter(
        models.QuizAttempt.user_id == user_id,
        models.QuizAttempt.lesson_id == lesson_id
    ).order_by(desc(models.QuizAttempt.started_at)).first()
    
    if not last_attempt:
        return {"can_attempt": True}
    
    now = datetime.now(timezone.utc)  # ✅ Fixed: timezone-aware
    time_since_last = (now - last_attempt.started_at).total_seconds()
    
    if time_since_last < cooldown_seconds:
        remaining = int(cooldown_seconds - time_since_last)
        return {
            "can_attempt": False,
            "reason": "Cooldown active",
            "cooldown_remaining": remaining
        }
    
    return {"can_attempt": True}

def increment_rate_limit(user_id: UUID, db: Session):
    """Increment the user's attempt counters."""
    rate_limit = db.query(models.QuizRateLimit).filter(
        models.QuizRateLimit.user_id == user_id
    ).first()
    
    if rate_limit:
        rate_limit.hourly_attempts += 1
        rate_limit.daily_attempts += 1
        rate_limit.last_attempt_at = datetime.now(timezone.utc)  # ✅ Fixed: timezone-aware
        db.commit()

# ----------------------------------------------------
# 3.1 AUTHENTICATION & PROFILES
# ----------------------------------------------------

@app.post("/auth/signup", response_model=schemas.Token)
def signup_user(
    user_data: schemas.UserCreate, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(database.get_db)
):
    if db.query(models.User).filter(models.User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    cardano_address, encrypted_skey = cardano_utils.generate_and_encrypt_cardano_wallet()

    if not cardano_address:
         print("WARNING: Cardano wallet generation failed during signup.")

    is_first_user = db.query(models.User).count() == 0  

    hashed_password = auth.get_password_hash(user_data.password)  
    new_user = models.User(  
        name=user_data.name,  
        email=user_data.email,  
        password_hash=hashed_password,  
        is_admin=is_first_user,
        cardano_address=cardano_address, 
        encrypted_skey=encrypted_skey 
    )  
    db.add(new_user)  
    db.flush()

    new_wallet = models.Wallet(user_id=new_user.id, token_balance=50)
    db.add(new_wallet)  
    db.commit()  

    background_tasks.add_task(email_service.send_welcome_email, new_user.email, new_user.name)

    access_token = auth.create_access_token(  
        data={"sub": str(new_user.id)}  
    )  
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/auth/login", response_model=schemas.Token)
def login_for_access_token(login_data: schemas.UserLogin, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == login_data.email).first()  

    if not user or not auth.verify_password(login_data.password, user.password_hash):  
        raise HTTPException(  
            status_code=status.HTTP_401_UNAUTHORIZED,  
            detail="Incorrect username or password",  
            headers={"WWW-Authenticate": "Bearer"},  
        )  

    access_token = auth.create_access_token(  
        data={"sub": str(user.id)}  
    )  
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/auth/request-password-reset", response_model=schemas.PasswordResetResponse)
def request_password_reset(
    request_data: schemas.RequestPasswordReset, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(database.get_db)
):
    user = db.query(models.User).filter(models.User.email == request_data.email).first()

    if not user:
        return schemas.PasswordResetResponse(
            message="If an account with that email exists, a password reset link will be sent."
        )

    reset_token = auth.create_password_reset_token(str(user.id), db)
    background_tasks.add_task(email_service.send_password_reset_email, user.email, reset_token)

    return schemas.PasswordResetResponse(
        message="If an account with that email exists, a password reset link will be sent."
    )

@app.post("/auth/reset-password", response_model=schemas.PasswordResetResponse)
def reset_password(reset_data: schemas.ResetPassword, db: Session = Depends(database.get_db)):
    user, reset_token = auth.verify_password_reset_token(reset_data.token, db)

    if len(reset_data.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long"
        )

    new_password_hash = auth.get_password_hash(reset_data.new_password)
    user.password_hash = new_password_hash
    reset_token.used = True

    db.commit()

    return schemas.PasswordResetResponse(
        message="Password reset successful. You can now log in with your new password."
    )

@app.get("/user/profile", response_model=schemas.UserProfile)
def read_users_me(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    db.refresh(current_user) 
    return current_user

@app.get("/user/stats", response_model=schemas.UserStats)
def get_user_stats(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    lessons_completed = db.query(models.LessonProgress).filter(
        models.LessonProgress.user_id == current_user.id,
        models.LessonProgress.completed == True
    ).count()

    quizzes_taken = db.query(models.QuizResult).filter(models.QuizResult.user_id == current_user.id).count()

    return schemas.UserStats(  
        lessons_completed=lessons_completed,  
        quizzes_taken=quizzes_taken  
    )

@app.get("/leaderboard", response_model=List[schemas.LeaderboardEntry])
def get_leaderboard(
    limit: int = 10,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    tokens_subquery = (
        db.query(
            models.Reward.user_id,
            func.sum(models.Reward.tokens_earned).label('total_tokens')
        )
        .group_by(models.Reward.user_id)
        .subquery()
    )
    
    quizzes_subquery = (
        db.query(
            models.QuizResult.user_id,
            func.count(models.QuizResult.id).label('quizzes_passed')
        )
        .group_by(models.QuizResult.user_id)
        .subquery()
    )
    
    lessons_subquery = (
        db.query(
            models.LessonProgress.user_id,
            func.count(models.LessonProgress.id).label('lessons_completed')
        )
        .filter(models.LessonProgress.completed == True)
        .group_by(models.LessonProgress.user_id)
        .subquery()
    )
    
    leaderboard = (
        db.query(
            models.User.id,
            models.User.name,
            func.coalesce(tokens_subquery.c.total_tokens, 0).label('total_tokens'),
            func.coalesce(quizzes_subquery.c.quizzes_passed, 0).label('quizzes_passed'),
            func.coalesce(lessons_subquery.c.lessons_completed, 0).label('lessons_completed')
        )
        .outerjoin(tokens_subquery, models.User.id == tokens_subquery.c.user_id)
        .outerjoin(quizzes_subquery, models.User.id == quizzes_subquery.c.user_id)
        .outerjoin(lessons_subquery, models.User.id == lessons_subquery.c.user_id)
        .order_by(desc(func.coalesce(tokens_subquery.c.total_tokens, 0)))
        .limit(limit)
        .all()
    )
    
    result = []
    for rank, entry in enumerate(leaderboard, start=1):
        result.append({
            "rank": rank,
            "user_id": str(entry.id),
            "name": entry.name,
            "total_tokens": entry.total_tokens or 0,
            "quizzes_passed": entry.quizzes_passed or 0,
            "lessons_completed": entry.lessons_completed or 0,
            "is_current_user": entry.id == current_user.id
        })
    
    return result

# ----------------------------------------------------
# 3.2 LEARNING CONTENT
# ----------------------------------------------------

@app.get("/lessons/categories", response_model=List[schemas.CategoryResponse])
def get_categories(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    results = db.query(
        models.Lesson.category,
        func.count(models.Lesson.id).label('count')
    ).group_by(models.Lesson.category).all()

    return [schemas.CategoryResponse(category=r.category, count=r.count) for r in results]

@app.get("/lessons/category/{category_name}", response_model=List[schemas.LessonBase])
def get_lessons_by_category(category_name: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    lessons = db.query(models.Lesson).filter(models.Lesson.category == category_name).order_by(models.Lesson.order_index).all()
    return lessons

@app.get("/lessons/{lesson_id}", response_model=schemas.LessonDetail)
def get_lesson_detail(lesson_id: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    try:
        lesson_uuid = UUID(lesson_id)
    except ValueError as e:
        print(f"ERROR 400: Invalid Lesson ID format received: '{lesson_id}'. Error: {e}")
        raise HTTPException(status_code=400, detail="Invalid lesson ID format")

    lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_uuid).first()  
    if not lesson:  
        print(f"ERROR 404: Lesson not found for ID: {lesson_id}")  
        raise HTTPException(status_code=404, detail="Lesson not found")  

    progress = db.query(models.LessonProgress).filter(  
        models.LessonProgress.user_id == current_user.id,  
        models.LessonProgress.lesson_id == lesson_uuid  
    ).first()  

    needs_commit = False

    if not progress:  
        progress = models.LessonProgress(  
            user_id=current_user.id,  
            lesson_id=lesson_uuid,  
            completed=True  
        )  
        db.add(progress)  
        needs_commit = True

    elif not progress.completed:
        progress.completed = True
        needs_commit = True

    if needs_commit:
        try:  
            db.commit()  
        except Exception as e:  
            db.rollback() 
            print(f"Warning: Failed to record lesson progress for user {current_user.id} and lesson {lesson_uuid}. Error: {e}")  

    return lesson

# 🆕 Track lesson read time
@app.post("/lessons/{lesson_id}/track-time", status_code=200)
def track_lesson_time(
    lesson_id: str,
    time_data: schemas.LessonReadTime,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Track how long user spent reading the lesson."""
    try:
        lesson_uuid = UUID(lesson_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid lesson ID format")
    
    progress = db.query(models.LessonProgress).filter(
        models.LessonProgress.user_id == current_user.id,
        models.LessonProgress.lesson_id == lesson_uuid
    ).first()
    
    if progress:
        progress.read_time_seconds = time_data.read_time_seconds
        db.commit()
    
    return {"message": "Read time tracked successfully"}

# ----------------------------------------------------
# 🆕 3.3 ANTI-CHEAT QUIZ SYSTEM
# ----------------------------------------------------

@app.get("/quiz/{lesson_id}/status", response_model=schemas.QuizAttemptStatus)
def check_quiz_status(
    lesson_id: str,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Check if user can attempt quiz (cooldown, rate limits)."""
    try:
        lesson_uuid = UUID(lesson_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid lesson ID format")
    
    # Get quiz config
    config = db.query(models.QuizConfig).filter(
        models.QuizConfig.lesson_id == lesson_uuid
    ).first()
    
    if not config:
        return schemas.QuizAttemptStatus(
            can_attempt=False,
            reason="Quiz not configured for this lesson"
        )
    
    # Check rate limits
    rate_status = check_rate_limit(current_user.id, db)
    if not rate_status["can_attempt"]:
        return schemas.QuizAttemptStatus(**rate_status)
    
    # Check cooldown
    cooldown_status = check_cooldown(current_user.id, lesson_uuid, config.cooldown_seconds, db)
    if not cooldown_status["can_attempt"]:
        return schemas.QuizAttemptStatus(**cooldown_status)
    
    # Check read time
    progress = db.query(models.LessonProgress).filter(
        models.LessonProgress.user_id == current_user.id,
        models.LessonProgress.lesson_id == lesson_uuid
    ).first()
    
    if not progress or progress.read_time_seconds < config.min_read_time_seconds:
        return schemas.QuizAttemptStatus(
            can_attempt=False,
            reason=f"Please read the lesson for at least {config.min_read_time_seconds} seconds"
        )
    
    return schemas.QuizAttemptStatus(
        can_attempt=True,
        hourly_attempts_remaining=rate_status.get("hourly_remaining"),
        daily_attempts_remaining=rate_status.get("daily_remaining")
    )

@app.post("/quiz/start", response_model=schemas.QuizAttemptResponse)
def start_quiz_attempt(
    start_data: schemas.QuizAttemptStart,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Start a new quiz attempt with random questions."""
    lesson_id = start_data.lesson_id
    
    # Verify can attempt
    status = check_quiz_status(str(lesson_id), db, current_user)
    if not status.can_attempt:
        raise HTTPException(status_code=429, detail=status.reason)
    
    # Get quiz config
    config = db.query(models.QuizConfig).filter(
        models.QuizConfig.lesson_id == lesson_id
    ).first()
    
    if not config:
        raise HTTPException(status_code=404, detail="Quiz not configured")
    
    # Get all questions for this lesson
    all_questions = db.query(models.QuizQuestion).filter(
        models.QuizQuestion.lesson_id == lesson_id
    ).all()
    
    if len(all_questions) < config.questions_per_quiz:
        raise HTTPException(
            status_code=400,
            detail=f"Not enough questions. Need {config.questions_per_quiz}, have {len(all_questions)}"
        )
    
    # 🎲 Randomly select questions
    selected_questions = random.sample(all_questions, config.questions_per_quiz)
    question_ids = [str(q.id) for q in selected_questions]
    
    # Create attempt record
    attempt = models.QuizAttempt(
        user_id=current_user.id,
        lesson_id=lesson_id,
        question_ids=question_ids,
        started_at=datetime.now(timezone.utc)  # ✅ Fixed: timezone-aware
    )
    db.add(attempt)
    
    # Increment rate limit
    increment_rate_limit(current_user.id, db)
    
    db.commit()
    db.refresh(attempt)
    
    # Return questions without correct answers
    questions_response = [
        schemas.QuizQuestionResponse(
            id=q.id,
            question=q.question,
            options=q.options
        )
        for q in selected_questions
    ]
    
    return schemas.QuizAttemptResponse(
        attempt_id=attempt.id,
        lesson_id=lesson_id,
        questions=questions_response,
        started_at=attempt.started_at,
        min_time_per_question=config.min_time_per_question,
        cooldown_seconds=config.cooldown_seconds
    )

@app.post("/quiz/submit", response_model=schemas.QuizResultResponse)
def submit_quiz(
    submission: schemas.QuizSubmitRequest,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Submit quiz answers with anti-cheat validation."""
    lesson_id = submission.lesson_id
    attempt_id = submission.attempt_id
    
    # Get attempt
    attempt = db.query(models.QuizAttempt).filter(
        models.QuizAttempt.id == attempt_id,
        models.QuizAttempt.user_id == current_user.id
    ).first()
    
    if not attempt:
        raise HTTPException(status_code=404, detail="Quiz attempt not found")
    
    if attempt.completed_at:
        raise HTTPException(status_code=400, detail="Quiz already submitted")
    
    # Get config
    config = db.query(models.QuizConfig).filter(
        models.QuizConfig.lesson_id == lesson_id
    ).first()
    
    if not config:
        raise HTTPException(status_code=404, detail="Quiz config not found")
    
    # ⏱️ TIME VALIDATION
    now = datetime.now(timezone.utc)  # ✅ Fixed: timezone-aware
    time_elapsed = (now - attempt.started_at).total_seconds()
    min_expected_time = len(submission.answers) * config.min_time_per_question
    
    flagged_suspicious = False
    if submission.total_time_seconds < min_expected_time or time_elapsed < min_expected_time:
        flagged_suspicious = True
        print(f"⚠️ SUSPICIOUS: User {current_user.id} completed quiz in {submission.total_time_seconds}s (min: {min_expected_time}s)")
    
    # Validate each question time
    for answer in submission.answers:
        if answer.time_spent_seconds < config.min_time_per_question:
            flagged_suspicious = True
            print(f"⚠️ SUSPICIOUS: Question answered too fast ({answer.time_spent_seconds}s)")
    
    # Get correct answers (only for questions in this attempt)
    question_ids = [UUID(qid) for qid in attempt.question_ids]
    quiz_questions = db.query(models.QuizQuestion).filter(
        models.QuizQuestion.id.in_(question_ids)
    ).all()
    
    correct_answers = {str(q.id): q.correct_option for q in quiz_questions}
    
    # Grade quiz
    correct_count = 0
    for answer in submission.answers:
        if str(answer.question_id) in correct_answers:
            if answer.selected == correct_answers[str(answer.question_id)]:
                correct_count += 1
    
    wrong_count = len(submission.answers) - correct_count
    total_questions = len(quiz_questions)
    score = int((correct_count / total_questions) * 100) if total_questions > 0 else 0
    
    passed = score >= config.passing_score
    tokens_awarded = 0
    
    # Award tokens if passed and not suspicious
    if passed and not flagged_suspicious:
        tokens_awarded = config.token_reward
        
        user_wallet = db.query(models.Wallet).filter(
            models.Wallet.user_id == current_user.id
        ).first()
        
        if user_wallet:
            user_wallet.token_balance += tokens_awarded
        
        new_reward = models.Reward(
            user_id=current_user.id,
            lesson_id=lesson_id,
            tokens_earned=tokens_awarded
        )
        db.add(new_reward)
    
    # Update attempt
    attempt.completed_at = datetime.now(timezone.utc)  # ✅ Fixed: timezone-aware
    attempt.total_time_seconds = submission.total_time_seconds
    attempt.flagged_suspicious = flagged_suspicious
    attempt.score = score
    attempt.passed = passed
    
    # Record result
    new_result = models.QuizResult(
        user_id=current_user.id,
        lesson_id=lesson_id,
        score=score,
        correct_count=correct_count,
        wrong_count=wrong_count,
        attempt_id=attempt_id
    )
    db.add(new_result)
    db.commit()
    
    message = None
    if flagged_suspicious:
        message = "Quiz completed but flagged for review due to unusually fast completion time"
    
    return schemas.QuizResultResponse(
        score=score,
        correct=correct_count,
        wrong=wrong_count,
        tokens_awarded=tokens_awarded,
        passed=passed,
        flagged_suspicious=flagged_suspicious,
        message=message
    )

# ----------------------------------------------------
# 3.4 Rewards
# ----------------------------------------------------

@app.get("/wallet/balance", response_model=schemas.TokenBalance)
def get_wallet_balance(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    wallet = db.query(models.Wallet).filter(models.Wallet.user_id == current_user.id).first()
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")

    return {"token_balance": wallet.token_balance}

@app.get("/wallet/history", response_model=List[schemas.RewardHistory])
def get_wallet_history(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    rewards_history = (
        db.query(models.Reward, models.Lesson)
        .join(models.Lesson, models.Reward.lesson_id == models.Lesson.id)
        .filter(models.Reward.user_id == current_user.id)
        .order_by(desc(models.Reward.created_at))
        .limit(20)
        .all()
    )

    return [  
        schemas.RewardHistory(  
            id=reward.id,  
            lesson_title=lesson.title,  
            tokens_earned=reward.tokens_earned,  
            created_at=reward.created_at,  
            type="Reward"
        )  
        for reward, lesson in rewards_history  
    ]

@app.get("/rewards/summary", response_model=schemas.RewardSummary)
def reward_summary(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    total = db.query(func.sum(models.Reward.tokens_earned)).filter(models.Reward.user_id == current_user.id).scalar() or 0

    return schemas.RewardSummary(  
        total_tokens_earned=total,  
        total_quizzes_passed=db.query(models.Reward).filter(models.Reward.user_id == current_user.id).count()  
    )

# ----------------------------------------------------
# 🆕 4. ADMIN ENDPOINTS - ANTI-CHEAT
# ----------------------------------------------------

@app.post("/admin/quiz/config", response_model=schemas.QuizConfigResponse, status_code=201)
def create_quiz_config(
    config_data: schemas.QuizConfigCreate,
    db: Session = Depends(database.get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    """Create quiz configuration for a lesson."""
    # Check if config already exists
    existing = db.query(models.QuizConfig).filter(
        models.QuizConfig.lesson_id == config_data.lesson_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Quiz config already exists. Use PUT to update.")
    
    # Verify lesson exists
    lesson = db.query(models.Lesson).filter(
        models.Lesson.id == config_data.lesson_id
    ).first()
    
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    new_config = models.QuizConfig(**config_data.model_dump())
    db.add(new_config)
    db.commit()
    db.refresh(new_config)
    
    return new_config

@app.put("/admin/quiz/config/{lesson_id}", response_model=schemas.QuizConfigResponse)
def update_quiz_config(
    lesson_id: str,
    config_data: schemas.QuizConfigUpdate,
    db: Session = Depends(database.get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    """Update quiz configuration."""
    try:
        lesson_uuid = UUID(lesson_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid lesson ID format")
    
    config = db.query(models.QuizConfig).filter(
        models.QuizConfig.lesson_id == lesson_uuid
    ).first()
    
    if not config:
        raise HTTPException(status_code=404, detail="Quiz config not found")
    
    # Update only provided fields
    for field, value in config_data.model_dump(exclude_unset=True).items():
        setattr(config, field, value)
    
    db.commit()
    db.refresh(config)
    
    return config

@app.get("/admin/quiz/config/{lesson_id}", response_model=schemas.QuizConfigResponse)
def get_quiz_config(
    lesson_id: str,
    db: Session = Depends(database.get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    """Get quiz configuration for a lesson."""
    try:
        lesson_uuid = UUID(lesson_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid lesson ID format")
    
    config = db.query(models.QuizConfig).filter(
        models.QuizConfig.lesson_id == lesson_uuid
    ).first()
    
    if not config:
        raise HTTPException(status_code=404, detail="Quiz config not found")
    
    return config

@app.get("/admin/suspicious-attempts", response_model=List[schemas.SuspiciousAttempt])
def get_suspicious_attempts(
    limit: int = 50,
    db: Session = Depends(database.get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    """Get list of flagged suspicious quiz attempts."""
    suspicious = (
        db.query(models.QuizAttempt, models.User, models.Lesson)
        .join(models.User, models.QuizAttempt.user_id == models.User.id)
        .join(models.Lesson, models.QuizAttempt.lesson_id == models.Lesson.id)
        .filter(models.QuizAttempt.flagged_suspicious == True)
        .order_by(desc(models.QuizAttempt.completed_at))
        .limit(limit)
        .all()
    )
    
    results = []
    for attempt, user, lesson in suspicious:
        config = db.query(models.QuizConfig).filter(
            models.QuizConfig.lesson_id == lesson.id
        ).first()
        
        expected_min_time = config.min_time_per_question * config.questions_per_quiz if config else 0
        
        results.append(schemas.SuspiciousAttempt(
            attempt_id=attempt.id,
            user_id=user.id,
            user_name=user.name,
            lesson_id=lesson.id,
            lesson_title=lesson.title,
            total_time_seconds=attempt.total_time_seconds or 0,
            expected_min_time=expected_min_time,
            score=attempt.score or 0,
            flagged_at=attempt.completed_at or attempt.started_at
        ))
    
    return results

# ----------------------------------------------------
# 4. ADMIN ENDPOINTS (Original)
# ----------------------------------------------------

@app.get("/admin/users", response_model=List[schemas.UserProfile])
def get_users(db: Session = Depends(database.get_db), current_admin: models.User = Depends(get_current_admin)):
    """Fetches all user profiles (Admin Only)."""
    return db.query(models.User).all()

@app.put("/admin/users/{user_id}/promote", status_code=status.HTTP_200_OK)
def promote_user(user_id: str, is_admin: bool, db: Session = Depends(database.get_db), current_admin: models.User = Depends(get_current_admin)):
    """Promotes/Demotes a user by setting is_admin flag (Admin Only)."""
    try:
        user_uuid = UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID format")

    if user_uuid == current_admin.id:  
        raise HTTPException(status_code=400, detail="You cannot change your own admin status.")  

    user = db.query(models.User).filter(models.User.id == user_uuid).first()  
    if not user:  
        raise HTTPException(status_code=404, detail="User not found")  

    user.is_admin = is_admin  
    db.commit()  
    return {"message": f"User {user.name} admin status set to {is_admin}"}

@app.get("/admin/lessons", response_model=List[schemas.LessonBase])
def get_all_lessons(db: Session = Depends(database.get_db), current_admin: models.User = Depends(get_current_admin)):
    """Returns a list of all lessons for Admin Content Management (Admin Only)."""
    lessons = db.query(models.Lesson).order_by(models.Lesson.category, models.Lesson.order_index).all()
    return lessons

@app.post("/admin/lessons", response_model=schemas.LessonDetail, status_code=status.HTTP_201_CREATED)
def create_lesson(
    lesson_data: schemas.LessonCreate, 
    db: Session = Depends(database.get_db), 
    current_admin: models.User = Depends(get_current_admin)
):
    """Creates a new lesson (Admin Only)."""
    new_lesson = models.Lesson(**lesson_data.model_dump())
    db.add(new_lesson)
    db.commit()
    db.refresh(new_lesson)
    return new_lesson

@app.delete("/admin/lessons/{lesson_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lesson(lesson_id: str, db: Session = Depends(database.get_db), current_admin: models.User = Depends(get_current_admin)):
    """Deletes a lesson and all associated records (Admin Only)."""

    try:  
        lesson_uuid = UUID(lesson_id)  
    except ValueError:  
        raise HTTPException(status_code=400, detail="Invalid lesson ID format")  

    lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_uuid).first()  
    if not lesson:  
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")  

    # Delete dependent records
    db.query(models.LessonProgress).filter(models.LessonProgress.lesson_id == lesson_uuid).delete(synchronize_session=False)  
    db.query(models.QuizQuestion).filter(models.QuizQuestion.lesson_id == lesson_uuid).delete(synchronize_session=False)  
    db.query(models.QuizResult).filter(models.QuizResult.lesson_id == lesson_uuid).delete(synchronize_session=False)  
    db.query(models.Reward).filter(models.Reward.lesson_id == lesson_uuid).delete(synchronize_session=False)
    db.query(models.QuizAttempt).filter(models.QuizAttempt.lesson_id == lesson_uuid).delete(synchronize_session=False)
    db.query(models.QuizConfig).filter(models.QuizConfig.lesson_id == lesson_uuid).delete(synchronize_session=False)

    db.delete(lesson)  
    db.commit()  

    return

@app.post("/admin/quiz", status_code=status.HTTP_201_CREATED)
def upload_quiz(quiz_request: schemas.QuizCreateRequest, db: Session = Depends(database.get_db), current_admin: models.User = Depends(get_current_admin)):
    """Creates/Updates the quiz questions for a lesson (Admin Only)."""

    lesson_id = quiz_request.lesson_id  
    lesson_id_str = str(lesson_id)  

    lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()  

    if not lesson:  
        print(f"Quiz Upload Fail (404): Lesson ID {lesson_id_str} not found.")  
        raise HTTPException(status_code=404, detail="Lesson not found for quiz association")  

    db.query(models.QuizQuestion).filter(models.QuizQuestion.lesson_id == lesson_id).delete(synchronize_session=False)  

    new_questions = []  
    for q_data in quiz_request.questions:  
        new_q = models.QuizQuestion(  
            lesson_id=lesson_id,   
            question=q_data.question,  
            options=q_data.options,  
            correct_option=q_data.correct_option  
        )  
        new_questions.append(new_q)  

    db.add_all(new_questions)  

    try:  
        db.commit()  
    except Exception as e:  
        db.rollback()  
        print(f"Database error (500) during quiz upload: {e}")  
        raise HTTPException(status_code=500, detail="Database integrity error during quiz save.")  

    return {"message": f"Successfully added {len(new_questions)} quiz questions for lesson {lesson_id_str}"}

@app.delete("/admin/quiz/{lesson_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_quiz(lesson_id: str, db: Session = Depends(database.get_db), current_admin: models.User = Depends(get_current_admin)):
    """Deletes all quiz questions associated with a lesson (Admin Only)."""

    try:  
        lesson_uuid = UUID(lesson_id)  
    except ValueError:  
        raise HTTPException(status_code=400, detail="Invalid lesson ID format")  

    db.query(models.QuizQuestion).filter(models.QuizQuestion.lesson_id == lesson_uuid).delete(synchronize_session=False)  
    db.commit()  

    return