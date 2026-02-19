# app/email_service.py
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Gmail SMTP config
GMAIL_USER = os.getenv("GMAIL_USER")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://readst.vercel.app")
LOGO_URL = "https://imgur.com/a/03JErUV"

print(f"📧 Email Service Initialized:")
print(f"   - Gmail User: {GMAIL_USER or 'NOT SET - EMAIL WILL NOT WORK'}")
print(f"   - App Password Present: {'Yes' if GMAIL_APP_PASSWORD else 'NO - EMAIL WILL NOT WORK'}")
print(f"   - Frontend URL: {FRONTEND_URL}")

if not GMAIL_USER or not GMAIL_APP_PASSWORD:
    print("⚠️  WARNING: GMAIL_USER or GMAIL_APP_PASSWORD not set. Email functionality will not work.")
    print("   Set both environment variables in Vercel settings.")


def _send_email(to_email: str, subject: str, html_content: str) -> bool:
    """
    Core helper that sends an email via Gmail SMTP.
    """
    if not GMAIL_USER or not GMAIL_APP_PASSWORD:
        print(f"⚠️  Email not sent (Gmail credentials not configured).")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"READS Notifications <{GMAIL_USER}>"
        msg["To"] = to_email

        msg.attach(MIMEText(html_content, "html"))

        print(f"📤 Connecting to Gmail SMTP...")
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(GMAIL_USER, GMAIL_APP_PASSWORD)
            server.sendmail(GMAIL_USER, to_email, msg.as_string())

        print(f"✅ Email sent successfully to: {to_email}")
        return True

    except Exception as e:
        print(f"❌ Failed to send email!")
        print(f"   Error Type: {type(e).__name__}")
        print(f"   Error Message: {str(e)}")
        print(f"   To: {to_email}")
        return False


def send_password_reset_email(user_email: str, reset_token: str):
    """
    Sends a password reset email to the user with a reset token.
    """
    print(f"\n🔄 Attempting to send password reset email to: {user_email}")

    if not GMAIL_USER or not GMAIL_APP_PASSWORD:
        print(f"⚠️  Email not sent (credentials not configured).")
        print(f"   Token for testing: {reset_token}")
        return False

    reset_link = f"{FRONTEND_URL}/reset-password?token={reset_token}"

    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px; border-radius: 8px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <img src="{LOGO_URL}" alt="READS Logo" style="max-width: 150px; height: auto; margin-bottom: 10px;" />
                    <h1 style="color: #4F46E5; margin: 10px 0;">$READS</h1>
                    <p style="color: #666; margin: 5px 0;">Learn to Earn</p>
                </div>
                
                <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <h2 style="color: #333; margin-top: 0;">Password Reset Request</h2>
                    
                    <p>Hi there,</p>
                    
                    <p>We received a request to reset your password for your $READS account. If you didn't make this request, you can safely ignore this email.</p>
                    
                    <p style="margin: 30px 0; text-align: center;">
                        <a href="{reset_link}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                            Reset Password
                        </a>
                    </p>
                    
                    <p style="color: #666; font-size: 14px;">
                        Or copy and paste this link in your browser:
                        <br/>
                        <code style="background-color: #f0f0f0; padding: 8px 12px; border-radius: 4px; display: inline-block; margin-top: 8px; word-break: break-all;">
                            {reset_link}
                        </code>
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    
                    <p style="color: #999; font-size: 12px;">
                        <strong>Important:</strong> This link will expire in 24 hours. If you need another reset link, please request it again.
                    </p>
                </div>
                
                <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
                    <p>© 2025 READS Technologies. All rights reserved.</p>
                    <p>
                        <a href="https://readstechnet.vercel.app/" style="color: #4F46E5; text-decoration: none;">Visit our website</a>
                    </p>
                </div>
            </div>
        </body>
    </html>
    """

    return _send_email(user_email, "Password Reset Request - $READS", html_content)


def send_welcome_email(user_email: str, user_name: str):
    """
    Sends a welcome email to new users.
    """
    print(f"\n🔄 Attempting to send welcome email to: {user_email}")

    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px; border-radius: 8px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <img src="{LOGO_URL}" alt="READS Logo" style="max-width: 150px; height: auto; margin-bottom: 10px;" />
                    <h1 style="color: #4F46E5; margin: 10px 0;">$READS</h1>
                    <p style="color: #666; margin: 5px 0;">Learn to Earn</p>
                </div>
                
                <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <h2 style="color: #333; margin-top: 0;">Welcome, {user_name}! 🎉</h2>
                    
                    <p>Thank you for joining $READS! We're excited to have you on your learning journey.</p>
                    
                    <h3 style="color: #4F46E5;">What You Can Do:</h3>
                    <ul style="color: #666;">
                        <li>📚 Study exam preparation content (JAMB, WAEC, IELTS, SAT)</li>
                        <li>✅ Take practice quizzes and get instant feedback</li>
                        <li>💰 Earn $READS tokens for completing lessons and passing quizzes</li>
                        <li>📊 Track your progress and performance</li>
                    </ul>
                    
                    <p style="margin: 30px 0; text-align: center;">
                        <a href="{FRONTEND_URL}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                            Start Learning Now
                        </a>
                    </p>
                    
                    <p style="color: #666; font-size: 14px; background-color: #f0fdf4; padding: 15px; border-radius: 6px; border-left: 4px solid #10b981;">
                        🎁 You started with <strong>50 $READS tokens</strong> as a welcome bonus. Use them wisely!
                    </p>
                </div>
                
                <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
                    <p>© 2025 READS Technologies. All rights reserved.</p>
                </div>
            </div>
        </body>
    </html>
    """

    return _send_email(user_email, "Welcome to $READS - Start Learning and Earning!", html_content)


def send_account_deletion_confirmation_email(user_email: str, user_name: str):
    """
    Send a confirmation email when a user deletes their account.
    """
    print(f"\n🔄 Attempting to send account deletion email to: {user_email}")

    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px; border-radius: 8px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <img src="{LOGO_URL}" alt="READS Logo" style="max-width: 150px; height: auto; margin-bottom: 10px;" />
                    <h1 style="color: #4F46E5; margin: 10px 0;">$READS</h1>
                    <p style="color: #666; margin: 5px 0;">Learn to Earn</p>
                </div>
                
                <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <h2 style="color: #333; margin-top: 0;">Account Deletion Confirmed</h2>
                    
                    <p>Hi {user_name},</p>
                    
                    <p>This email confirms that your $READS account has been permanently deleted as you requested.</p>
                    
                    <div style="background-color: #f7fafc; border-left: 4px solid #4299e1; padding: 15px; margin: 20px 0; border-radius: 4px;">
                        <p style="margin: 0; font-weight: bold; color: #2c5282;">What was deleted:</p>
                        <ul style="margin: 10px 0; color: #4a5568;">
                            <li>Your user profile and account information</li>
                            <li>All lesson progress and quiz results</li>
                            <li>Your wallet and token balance</li>
                            <li>All rewards and transaction history</li>
                        </ul>
                    </div>
                    
                    <div style="background-color: #fff5f5; border-left: 4px solid #fc8181; padding: 15px; margin: 20px 0; border-radius: 4px;">
                        <p style="margin: 0; color: #742a2a;">
                            <strong>⚠️ Important:</strong> If you didn't request this deletion, please contact our support team immediately at 
                            <a href="mailto:readstechnologies@gmail.com" style="color: #c53030;">readstechnologies@gmail.com</a>
                        </p>
                    </div>
                    
                    <p>We're sorry to see you go! If you'd like to share feedback about your experience, we'd love to hear from you.</p>
                    
                    <p>Thank you for being part of the $READS community. We hope to see you again in the future!</p>
                    
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
                    
                    <p style="color: #718096; font-size: 0.9em; margin: 0;">
                        <strong>The $READS Team</strong><br>
                        This is an automated message. Please do not reply to this email.
                    </p>
                </div>
                
                <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
                    <p>© 2025 READS Technologies. All rights reserved.</p>
                </div>
            </div>
        </body>
    </html>
    """

    return _send_email(user_email, "Your $READS Account Has Been Deleted", html_content)
