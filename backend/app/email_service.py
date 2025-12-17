# app/email_service.py
import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content
from fastapi import HTTPException, status

# Initialize SendGrid client
SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
SENDGRID_FROM_EMAIL = os.getenv("SENDGRID_FROM_EMAIL", "noreply@readstechnologies.com")
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://reads-phi.vercel.app")
LOGO_URL = "https://i.imgur.com/SMSSYph.png"  # Direct Imgur link to your logo

print(f"📧 Email Service Initialized:")
print(f"   - API Key Present: {'Yes' if SENDGRID_API_KEY else 'NO - EMAIL WILL NOT WORK'}")
print(f"   - From Email: {SENDGRID_FROM_EMAIL}")
print(f"   - Frontend URL: {FRONTEND_URL}")
print(f"   - Logo URL: {LOGO_URL}")

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
                        <!-- Header with Logo -->
                        <div style="text-align: center; margin-bottom: 30px;">
                            <img src="{LOGO_URL}" alt="READS Logo" style="max-width: 150px; height: auto; margin-bottom: 10px;" />
                            <h1 style="color: #4F46E5; margin: 10px 0;">$READS</h1>
                            <p style="color: #666; margin: 5px 0;">Learn to Earn</p>
                        </div>
                        
                        <!-- Main Content -->
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
                        <!-- Header with Logo -->
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
                        
                        <!-- Footer -->
                        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
                            <p>© 2025 READS Technologies. All rights reserved.</p>
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

def send_account_deletion_confirmation_email(user_email: str, user_name: str):
    """
    Send a confirmation email when a user deletes their account.
    This serves as a final record and security measure.
    """
    print(f"\n🔄 Attempting to send account deletion email to: {user_email}")
    
    if not SENDGRID_API_KEY:
        print(f"⚠️  Deletion email not sent (API key not configured).")
        return False
    
    try:
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        
        message = Mail(
            from_email=Email(SENDGRID_FROM_EMAIL, "READS Team"),
            to_emails=To(user_email),
            subject="Your $READS Account Has Been Deleted",
            html_content=f"""
            <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px; border-radius: 8px;">
                        <!-- Header with Logo -->
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
                        
                        <!-- Footer -->
                        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
                            <p>© 2025 READS Technologies. All rights reserved.</p>
                        </div>
                    </div>
                </body>
            </html>
            """
        )
        
        print(f"📤 Sending deletion confirmation email via SendGrid...")
        response = sg.send(message)
        
        print(f"✅ Account deletion email sent successfully!")
        print(f"   Status Code: {response.status_code}")
        print(f"   To: {user_email}")
        
        return True
        
    except Exception as e:
        print(f"❌ Failed to send deletion confirmation email!")
        print(f"   Error Type: {type(e).__name__}")
        print(f"   Error Message: {str(e)}")
        print(f"   To: {user_email}")
        return False