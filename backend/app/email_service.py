# app/email_service.py
import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content
from fastapi import HTTPException, status

# Initialize SendGrid client
SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
SENDGRID_FROM_EMAIL = os.getenv("SENDGRID_FROM_EMAIL", "noreply@readstechnologies.com")
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://reads-phi.vercel.app")

print(f"📧 Email Service Initialized:")
print(f"   - API Key Present: {'Yes' if SENDGRID_API_KEY else 'NO - EMAIL WILL NOT WORK'}")
print(f"   - From Email: {SENDGRID_FROM_EMAIL}")
print(f"   - Frontend URL: {FRONTEND_URL}")

if not SENDGRID_API_KEY:
    print("⚠️  WARNING: SENDGRID_API_KEY not set. Email functionality will not work.")
    print("   Set environment variable SENDGRID_API_KEY in Vercel settings.")

def send_password_reset_email(user_email: str, reset_token: str):
    """
    Sends a password reset email to the user with a reset token.
    
    Args:
        user_email: The user's email address
        reset_token: The secure reset token
    """
    print(f"\n🔄 Attempting to send password reset email to: {user_email}")
    
    if not SENDGRID_API_KEY:
        print(f"⚠️  Email not sent (API key not configured).")
        print(f"   Token for testing: {reset_token}")
        return False
    
    # Create reset link that user clicks
    reset_link = f"{FRONTEND_URL}/reset-password?token={reset_token}"
    
    try:
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        
        # Create email content
        message = Mail(
            from_email=Email(SENDGRID_FROM_EMAIL, "READS Notifications"),
            to_emails=To(user_email),
            subject="Password Reset Request - $READS",
            html_content=f"""
            <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px; border-radius: 8px;">
                        <!-- Header -->
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="color: #4F46E5; margin: 0;">$READS</h1>
                            <p style="color: #666; margin: 5px 0;">Learn to Earn</p>
                        </div>
                        
                        <!-- Main Content -->
                        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            <h2 style="color: #333; margin-top: 0;">Password Reset Request</h2>
                            
                            <p>Hi there,</p>
                            
                            <p>We received a request to reset your password for your $READS account. If you didn't make this request, you can safely ignore this email.</p>
                            
                            <p style="margin: 30px 0;">
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
                        
                        <!-- Footer -->
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
        )
        
        # Send email
        print(f"📤 Sending email via SendGrid...")
        response = sg.send(message)
        
        print(f"✅ Email sent successfully!")
        print(f"   Status Code: {response.status_code}")
        print(f"   To: {user_email}")
        
        return True
        
    except Exception as e:
        print(f"❌ Failed to send password reset email!")
        print(f"   Error Type: {type(e).__name__}")
        print(f"   Error Message: {str(e)}")
        print(f"   To: {user_email}")
        return False

def send_welcome_email(user_email: str, user_name: str):
    """
    Sends a welcome email to new users.
    """
    print(f"\n🔄 Attempting to send welcome email to: {user_email}")
    
    if not SENDGRID_API_KEY:
        print(f"⚠️  Welcome email not sent (API key not configured).")
        return False
    
    try:
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        
        message = Mail(
            from_email=Email(SENDGRID_FROM_EMAIL, "READS Team"),
            to_emails=To(user_email),
            subject="Welcome to $READS - Start Learning and Earning!",
            html_content=f"""
            <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px; border-radius: 8px;">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="color: #4F46E5; margin: 0;">$READS</h1>
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
                            
                            <p style="margin: 30px 0;">
                                <a href="{FRONTEND_URL}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                                    Start Learning Now
                                </a>
                            </p>
                            
                            <p style="color: #666; font-size: 14px;">
                                You started with <strong>50 $READS tokens</strong> as a welcome bonus. Use them wisely!
                            </p>
                        </div>
                    </div>
                </body>
            </html>
            """
        )
        
        print(f"📤 Sending welcome email via SendGrid...")
        response = sg.send(message)
        
        print(f"✅ Welcome email sent successfully!")
        print(f"   Status Code: {response.status_code}")
        print(f"   To: {user_email}")
        
        return True
        
    except Exception as e:
        print(f"❌ Failed to send welcome email!")
        print(f"   Error Type: {type(e).__name__}")
        print(f"   Error Message: {str(e)}")
        print(f"   To: {user_email}")
        return False