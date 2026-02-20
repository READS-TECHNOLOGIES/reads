# app/email_service.py
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Gmail SMTP config
GMAIL_USER = os.getenv("GMAIL_USER")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://readst.vercel.app")

print(f"📧 Email Service Initialized:")
print(f"   - Gmail User: {GMAIL_USER or 'NOT SET - EMAIL WILL NOT WORK'}")
print(f"   - App Password Present: {'Yes' if GMAIL_APP_PASSWORD else 'NO - EMAIL WILL NOT WORK'}")
print(f"   - Frontend URL: {FRONTEND_URL}")

if not GMAIL_USER or not GMAIL_APP_PASSWORD:
    print("⚠️  WARNING: GMAIL_USER or GMAIL_APP_PASSWORD not set. Email functionality will not work.")


def _send_email(to_email: str, subject: str, html_content: str) -> bool:
    """Core helper that sends an email via Gmail SMTP."""
    if not GMAIL_USER or not GMAIL_APP_PASSWORD:
        print(f"⚠️  Email not sent (Gmail credentials not configured).")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"$READS Technologies <{GMAIL_USER}>"
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


def send_welcome_email(user_email: str, user_name: str):
    """Sends a professional welcome email to new users."""
    print(f"\n🔄 Attempting to send welcome email to: {user_email}")

    html_content = f"""
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Welcome to $READS Technologies</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f0;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f0;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-right:10px;vertical-align:middle;">
                    <div style="width:44px;height:44px;background:linear-gradient(135deg,#c9a227,#e8c547);border-radius:50%;text-align:center;line-height:44px;font-size:20px;">🎓</div>
                  </td>
                  <td style="vertical-align:middle;">
                    <span style="font-size:26px;font-weight:900;color:#0f2044;">$READS</span>
                  </td>
                </tr>
              </table>
              <p style="margin:6px 0 0;font-size:12px;color:#6b7280;letter-spacing:1.5px;">LEARN. EARN. EXCEL.</p>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.07);">

                <!-- Green hero -->
                <tr>
                  <td style="background:linear-gradient(135deg,#1a7a4a,#22a862);padding:32px;text-align:center;">
                    <div style="font-size:48px;margin-bottom:12px;">🎉</div>
                    <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;">Welcome to $READS Technologies!</h1>
                    <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Your Learn-to-Earn journey starts now</p>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding:32px;">
                    <p style="margin:0 0 8px;font-size:15px;color:#374151;">Dear <strong style="color:#0f2044;">{user_name}</strong>,</p>
                    <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.7;">
                      Welcome to <strong style="color:#0f2044;">$READS Technologies</strong> — a blockchain-powered education platform designed to make learning measurable, rewarding, and accessible. Your account has been successfully created within our Learn-to-Earn ecosystem.
                    </p>

                    <!-- Token bonus -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1px solid #e8c547;border-radius:12px;margin-bottom:24px;">
                      <tr>
                        <td style="padding:16px 20px;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="vertical-align:middle;font-size:26px;width:40px;">🪙</td>
                              <td style="vertical-align:middle;padding-left:12px;">
                                <p style="margin:0;font-size:15px;font-weight:800;color:#92400e;">+50 $READS Tokens</p>
                                <p style="margin:2px 0 0;font-size:12px;color:#b45309;">Onboarding bonus credited to your wallet</p>
                              </td>
                              <td align="right" style="vertical-align:middle;">
                                <span style="background:#c9a227;color:#ffffff;font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;">EARNED</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Platform features -->
                    <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#0f2044;">Platform Access Includes:</p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                      <tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#374151;">📚 &nbsp;Structured CBT preparation (JAMB, WAEC, IELTS, SAT, and more)</td></tr>
                      <tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#374151;">📊 &nbsp;Performance analytics and assessment tracking</td></tr>
                      <tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#374151;">💰 &nbsp;Earning $READS tokens upon successful quiz completion</td></tr>
                      <tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#374151;">🏪 &nbsp;Token utility for exam payments, marketplace access, and premium services</td></tr>
                      <tr><td style="padding:8px 0;font-size:13px;color:#374151;">🔗 &nbsp;Secure blockchain wallet integration</td></tr>
                    </table>

                    <!-- CTA -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                      <tr>
                        <td align="center">
                          <a href="{FRONTEND_URL}" style="display:inline-block;background:linear-gradient(135deg,#1a7a4a,#22a862);color:#ffffff;font-size:15px;font-weight:700;padding:14px 44px;border-radius:50px;text-decoration:none;box-shadow:0 4px 12px rgba(26,122,74,0.3);">
                            Start Learning Now →
                          </a>
                        </td>
                      </tr>
                    </table>

                    <hr style="border:none;border-top:1px solid #f3f4f6;margin:0 0 24px;"/>

                    <!-- Data Protection -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;margin-bottom:24px;">
                      <tr>
                        <td style="padding:20px 24px;">
                          <p style="margin:0 0 10px;font-size:14px;font-weight:700;color:#0f2044;">🔐 Data Protection &amp; Compliance</p>
                          <p style="margin:0 0 10px;font-size:13px;color:#374151;line-height:1.6;">$READS Technologies processes your personal data in accordance with applicable data protection laws, including:</p>
                          <table cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
                            <tr><td style="font-size:13px;color:#374151;padding:3px 0;">• Nigeria Data Protection Act (NDPA/NDPR equivalent standards)</td></tr>
                            <tr><td style="font-size:13px;color:#374151;padding:3px 0;">• General international data protection principles aligned with GDPR</td></tr>
                          </table>
                          <p style="margin:0 0 10px;font-size:13px;color:#374151;line-height:1.6;">Your data is processed lawfully, transparently, and strictly for educational service delivery, reward tracking, security, and compliance purposes.</p>
                          <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#0f2044;">We implement:</p>
                          <table cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
                            <tr><td style="font-size:13px;color:#374151;padding:3px 0;">🔒 &nbsp;Encrypted data transmission (SSL/TLS)</td></tr>
                            <tr><td style="font-size:13px;color:#374151;padding:3px 0;">🛡️ &nbsp;Role-based access controls</td></tr>
                            <tr><td style="font-size:13px;color:#374151;padding:3px 0;">🔑 &nbsp;Secure authentication protocols</td></tr>
                            <tr><td style="font-size:13px;color:#374151;padding:3px 0;">⛓️ &nbsp;Blockchain-backed transaction integrity</td></tr>
                          </table>
                          <p style="margin:0;font-size:12px;color:#6b7280;line-height:1.6;">
                            For details, review our <strong>Privacy Policy</strong> and <strong>Terms of Use</strong> within the app.<br/>
                            For data rights inquiries (access, correction, deletion, restriction, portability):<br/>
                            <a href="mailto:readstechnologies@gmail.com" style="color:#1a7a4a;font-weight:600;">📧 readstechnologies@gmail.com</a>
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Sign off -->
                    <p style="margin:0;font-size:14px;color:#374151;line-height:1.8;">
                      Sincerely,<br/>
                      <strong style="color:#0f2044;">$READS Technologies</strong><br/>
                      <span style="color:#1a7a4a;font-size:13px;font-style:italic;">Empowering You to Study Smarter</span>
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background:#f9fafb;border-top:1px solid #f3f4f6;padding:20px 32px;text-align:center;border-radius:0 0 20px 20px;">
                    <p style="margin:0;font-size:12px;color:#9ca3af;">
                      © 2026 READS Technologies. All rights reserved.<br/>
                      <a href="{FRONTEND_URL}" style="color:#1a7a4a;text-decoration:none;">Visit Platform</a>
                      &nbsp;·&nbsp;
                      <a href="mailto:readstechnologies@gmail.com" style="color:#1a7a4a;text-decoration:none;">Contact Support</a>
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    """

    return _send_email(user_email, "Welcome to $READS Technologies – Your Account is Ready 🎓", html_content)


def send_password_reset_email(user_email: str, reset_token: str):
    """Sends a password reset email."""
    print(f"\n🔄 Attempting to send password reset email to: {user_email}")

    reset_link = f"{FRONTEND_URL}/reset-password?token={reset_token}"

    html_content = f"""
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Password Reset – $READS</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f0;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f0;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">

          <tr>
            <td align="center" style="padding-bottom:24px;">
              <span style="font-size:26px;font-weight:900;color:#0f2044;">$READS</span>
              <p style="margin:4px 0 0;font-size:12px;color:#6b7280;letter-spacing:1.5px;">LEARN. EARN. EXCEL.</p>
            </td>
          </tr>

          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.07);">
                <tr>
                  <td style="background:linear-gradient(135deg,#0f2044,#1a3a6e);padding:32px;text-align:center;">
                    <div style="font-size:44px;margin-bottom:12px;">🔐</div>
                    <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:800;">Password Reset Request</h1>
                    <p style="margin:8px 0 0;color:rgba(255,255,255,0.75);font-size:13px;">We received a request to reset your $READS password</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px;">
                    <p style="margin:0 0 20px;font-size:14px;color:#374151;line-height:1.7;">
                      Hi there,<br/><br/>
                      We received a request to reset the password for your <strong>$READS</strong> account. If you didn't make this request, you can safely ignore this email — your account remains secure.
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                      <tr>
                        <td align="center">
                          <a href="{reset_link}" style="display:inline-block;background:linear-gradient(135deg,#1a7a4a,#22a862);color:#ffffff;font-size:15px;font-weight:700;padding:14px 44px;border-radius:50px;text-decoration:none;box-shadow:0 4px 12px rgba(26,122,74,0.3);">
                            Reset My Password →
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">Or copy this link into your browser:</p>
                    <div style="background:#f3f4f6;padding:12px 16px;border-radius:8px;word-break:break-all;font-size:12px;color:#374151;font-family:monospace;">{reset_link}</div>
                    <p style="margin:16px 0 0;font-size:12px;color:#9ca3af;">⏰ This link expires in 24 hours.</p>
                  </td>
                </tr>
                <tr>
                  <td style="background:#f9fafb;border-top:1px solid #f3f4f6;padding:20px 32px;text-align:center;border-radius:0 0 20px 20px;">
                    <p style="margin:0;font-size:12px;color:#9ca3af;">© 2026 READS Technologies. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    """

    return _send_email(user_email, "Password Reset Request – $READS Technologies", html_content)


def send_account_deletion_confirmation_email(user_email: str, user_name: str):
    """Sends a formal data erasure confirmation email on account deletion."""
    print(f"\n🔄 Attempting to send account deletion email to: {user_email}")

    html_content = f"""
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Confirmation of Data Erasure – $READS Technologies</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f0;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f0;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <span style="font-size:26px;font-weight:900;color:#0f2044;">$READS</span>
              <p style="margin:4px 0 0;font-size:12px;color:#6b7280;letter-spacing:1.5px;">LEARN. EARN. EXCEL.</p>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.07);">

                <!-- Dark red hero -->
                <tr>
                  <td style="background:linear-gradient(135deg,#7f1d1d,#b91c1c);padding:32px;text-align:center;">
                    <div style="font-size:44px;margin-bottom:12px;">🗑️</div>
                    <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:800;">Confirmation of Data Erasure</h1>
                    <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">$READS Technologies — Official Compliance Notice</p>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding:32px;">

                    <p style="margin:0 0 8px;font-size:15px;color:#374151;">Dear <strong style="color:#0f2044;">{user_name}</strong>,</p>
                    <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.7;">
                      This notice confirms that your request for <strong style="color:#0f2044;">permanent account deletion</strong> has been successfully executed across our systems.
                    </p>

                    <!-- Data removed list -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;margin-bottom:24px;">
                      <tr>
                        <td style="padding:20px 24px;">
                          <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#7f1d1d;">Data Removed from Our Systems:</p>
                          <table cellpadding="0" cellspacing="0">
                            <tr><td style="font-size:13px;color:#374151;padding:5px 0;border-bottom:1px solid #fee2e2;">✗ &nbsp;Personal identification information</td></tr>
                            <tr><td style="font-size:13px;color:#374151;padding:5px 0;border-bottom:1px solid #fee2e2;">✗ &nbsp;User profile and authentication credentials</td></tr>
                            <tr><td style="font-size:13px;color:#374151;padding:5px 0;border-bottom:1px solid #fee2e2;">✗ &nbsp;Academic progress and assessment records</td></tr>
                            <tr><td style="font-size:13px;color:#374151;padding:5px 0;border-bottom:1px solid #fee2e2;">✗ &nbsp;Marketplace and transaction history</td></tr>
                            <tr><td style="font-size:13px;color:#374151;padding:5px 0;">✗ &nbsp;Wallet interface and associated token balance</td></tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Blockchain notice -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;margin-bottom:24px;">
                      <tr>
                        <td style="padding:20px 24px;">
                          <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#0f2044;">🔒 Blockchain &amp; Data Retention Notice</p>
                          <p style="margin:0 0 12px;font-size:13px;color:#374151;line-height:1.7;">
                            Due to the immutable nature of blockchain technology, certain transaction records may remain permanently recorded on-chain. However:
                          </p>
                          <table cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
                            <tr><td style="font-size:13px;color:#374151;padding:4px 0;">✅ &nbsp;These records are <strong>pseudonymous</strong></td></tr>
                            <tr><td style="font-size:13px;color:#374151;padding:4px 0;">✅ &nbsp;They do <strong>not</strong> directly contain personally identifiable information</td></tr>
                            <tr><td style="font-size:13px;color:#374151;padding:4px 0;">✅ &nbsp;They <strong>cannot</strong> be linked to your deleted account profile</td></tr>
                          </table>
                          <p style="margin:0;font-size:13px;color:#374151;line-height:1.7;">
                            All off-chain personal data associated with your identity has been securely erased in accordance with applicable data protection regulations.
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Irreversible warning -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1px solid #e8c547;border-radius:12px;margin-bottom:24px;">
                      <tr>
                        <td style="padding:16px 20px;">
                          <p style="margin:0;font-size:13px;color:#92400e;line-height:1.7;">
                            ⚠️ <strong>Please note: This action is irreversible.</strong><br/>
                            If you did not authorize this request, notify us immediately at:<br/>
                            <a href="mailto:readstechnologies@gmail.com" style="color:#1a7a4a;font-weight:700;">📧 readstechnologies@gmail.com</a>
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Sign off -->
                    <p style="margin:0 0 4px;font-size:14px;color:#374151;line-height:1.8;">
                      We appreciate your participation in the $READS ecosystem and remain committed to transparent, compliant, and secure educational innovation.<br/><br/>
                      Sincerely,<br/>
                      <strong style="color:#0f2044;">$READS Technologies</strong><br/>
                      <span style="color:#1a7a4a;font-size:13px;font-style:italic;">Empowering You to Study Smarter</span>
                    </p>

                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background:#f9fafb;border-top:1px solid #f3f4f6;padding:20px 32px;text-align:center;border-radius:0 0 20px 20px;">
                    <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;font-style:italic;">
                      This is an automated compliance notification. Please do not reply.
                    </p>
                    <p style="margin:0;font-size:12px;color:#9ca3af;">
                      © 2026 READS Technologies. All rights reserved.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    """

    return _send_email(user_email, "Confirmation of Data Erasure – $READS Technologies", html_content)
