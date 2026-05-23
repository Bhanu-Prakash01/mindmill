const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  return transporter;
}

/**
 * Send test invitation email to a test taker
 */
async function sendTestInvite({ to, testTakerName, assessmentTitle, assessmentCategory, organizationName, testLink, instructions, timeLimit, totalQuestions }) {
  const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER;
  const fromName = process.env.FROM_NAME || 'MindMil';

  // Category display name
  const categoryNames = {
    big5: 'Big Five Personality',
    disc: 'DISC Assessment',
    mbti: 'MBTI Assessment',
    hogan: 'Hogan Assessment',
    'firo-b': 'FIRO-B Assessment',
    firo: 'FIRO Assessment',
    general: 'Assessment'
  };
  const categoryLabel = categoryNames[assessmentCategory] || assessmentCategory?.toUpperCase() || 'Assessment';

  // Build meta line
  const metaParts = [];
  if (totalQuestions) metaParts.push(`${totalQuestions} questions`);
  if (timeLimit) metaParts.push(`${timeLimit} min`);
  const metaLine = metaParts.length > 0 ? metaParts.join(' · ') : '';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f0f0f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f0f0f0;padding:32px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color:#ffffff;border-radius:6px;overflow:hidden;">

          <!-- Top accent bar -->
          <tr>
            <td style="background-color:#4f46e5;height:4px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">
                    ${categoryLabel}
                  </td>
                </tr>
                <tr>
                  <td style="font-size:22px;font-weight:700;color:#111827;padding-top:6px;">
                    ${assessmentTitle}
                  </td>
                </tr>
                ${metaLine ? `
                <tr>
                  <td style="font-size:14px;color:#9ca3af;padding-top:4px;">
                    ${metaLine}
                  </td>
                </tr>
                ` : ''}
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:24px 40px 0;">
              <div style="border-top:1px solid #e5e7eb;"></div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:24px 40px 0;">
              <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px;">
                Hello ${testTakerName},
              </p>
              <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px;">
                <strong>${organizationName}</strong> has invited you to complete the
                <strong>${assessmentTitle}</strong>. This is a ${categoryLabel.toLowerCase()} designed to
                ${assessmentCategory === 'big5' ? 'measure your personality across five key dimensions' :
                  assessmentCategory === 'disc' ? 'understand your behavioral style and communication preferences' :
                  'evaluate your skills and capabilities'}.
              </p>
            </td>
          </tr>

          ${instructions ? `
          <!-- Instructions box -->
          <tr>
            <td style="padding:16px 40px 0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#fefce8;border:1px solid #fde68a;border-radius:6px;">
                <tr>
                  <td style="padding:16px;">
                    <p style="color:#92400e;font-size:13px;font-weight:600;margin:0 0 6px;text-transform:uppercase;letter-spacing:0.3px;">
                      Before you begin
                    </p>
                    <p style="color:#78350f;font-size:14px;line-height:1.6;margin:0;">
                      ${instructions}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- CTA -->
          <tr>
            <td style="padding:28px 40px 0;" align="center">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="background-color:#4f46e5;border-radius:6px;">
                    <a href="${testLink}" target="_blank" style="display:inline-block;padding:14px 40px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;border-radius:6px;">
                      Begin Assessment &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Tips -->
          <tr>
            <td style="padding:28px 40px 0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f9fafb;border-radius:6px;">
                <tr>
                  <td style="padding:20px;">
                    <p style="color:#374151;font-size:13px;font-weight:600;margin:0 0 12px;">
                      Quick tips
                    </p>
                    <table role="presentation" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="color:#6b7280;font-size:13px;line-height:1.8;padding-bottom:4px;">
                          &bull; Use a stable internet connection
                        </td>
                      </tr>
                      <tr>
                        <td style="color:#6b7280;font-size:13px;line-height:1.8;padding-bottom:4px;">
                          &bull; Avoid switching tabs during the assessment
                        </td>
                      </tr>
                      <tr>
                        <td style="color:#6b7280;font-size:13px;line-height:1.8;padding-bottom:4px;">
                          &bull; Answer honestly — there are no right or wrong answers
                        </td>
                      </tr>
                      ${timeLimit ? `
                      <tr>
                        <td style="color:#6b7280;font-size:13px;line-height:1.8;">
                          &bull; You have ${timeLimit} minutes once you start
                        </td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Fallback link -->
          <tr>
            <td style="padding:20px 40px 0;">
              <p style="color:#9ca3af;font-size:12px;line-height:1.6;margin:0;text-align:center;">
                Trouble with the button? Copy this link:<br>
                <a href="${testLink}" style="color:#4f46e5;word-break:break-all;">${testLink}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 40px;border-top:1px solid #e5e7eb;margin-top:24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="color:#9ca3af;font-size:12px;line-height:1.6;">
                    Sent by ${organizationName} via MindMil
                  </td>
                  <td style="color:#9ca3af;font-size:12px;text-align:right;">
                    Do not reply to this email
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
  `;

  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject: `${assessmentTitle} — Invitation from ${organizationName}`,
    html
  };

  const transport = getTransporter();
  const info = await transport.sendMail(mailOptions);
  return info;
}

/**
 * Send password reset email to a user
 */
async function sendPasswordResetEmail({ to, fullName, organizationName, resetLink }) {
  const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER;
  const fromName = process.env.FROM_NAME || 'MindMil';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f0f0f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f0f0f0;padding:32px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color:#ffffff;border-radius:6px;overflow:hidden;">

          <!-- Top accent bar -->
          <tr>
            <td style="background-color:#4f46e5;height:4px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">
                    Password Reset
                  </td>
                </tr>
                <tr>
                  <td style="font-size:22px;font-weight:700;color:#111827;padding-top:6px;">
                    Reset Your Password
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:24px 40px 0;">
              <div style="border-top:1px solid #e5e7eb;"></div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:24px 40px 0;">
              <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px;">
                Hello ${fullName},
              </p>
              <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px;">
                You requested a password reset for your <strong>${organizationName}</strong> account on MindMil.
                Click the button below to set a new password.
              </p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:28px 40px 0;" align="center">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="background-color:#4f46e5;border-radius:6px;">
                    <a href="${resetLink}" target="_blank" style="display:inline-block;padding:14px 40px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;border-radius:6px;">
                      Reset Password &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Warning -->
          <tr>
            <td style="padding:20px 40px 0;" align="center">
              <p style="color:#dc2626;font-size:13px;font-weight:600;margin:0;">
                This link expires in 1 hour
              </p>
            </td>
          </tr>

          <!-- Fallback link -->
          <tr>
            <td style="padding:20px 40px 0;">
              <p style="color:#9ca3af;font-size:12px;line-height:1.6;margin:0;text-align:center;">
                Trouble with the button? Copy this link:<br>
                <a href="${resetLink}" style="color:#4f46e5;word-break:break-all;">${resetLink}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 40px;border-top:1px solid #e5e7eb;margin-top:24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="color:#9ca3af;font-size:12px;line-height:1.6;">
                    Sent by ${organizationName} via MindMil
                  </td>
                  <td style="color:#9ca3af;font-size:12px;text-align:right;">
                    Do not reply to this email
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
  `;

  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject: `Password Reset — ${organizationName}`,
    html
  };

  const transport = getTransporter();
  const info = await transport.sendMail(mailOptions);
  return info;
}

async function sendEmailVerificationOtp({ to, fullName, otp }) {
  const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER;
  const fromName = process.env.FROM_NAME || 'MindMil';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f0f0f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f0f0f0;padding:32px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color:#ffffff;border-radius:6px;overflow:hidden;">

          <tr>
            <td style="background-color:#4f46e5;height:4px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <tr>
            <td style="padding:32px 40px 0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">
                    Email Verification
                  </td>
                </tr>
                <tr>
                  <td style="font-size:22px;font-weight:700;color:#111827;padding-top:6px;">
                    Verify Your Email Address
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 40px 0;">
              <div style="border-top:1px solid #e5e7eb;"></div>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 40px 0;">
              <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px;">
                Hello ${fullName},
              </p>
              <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px;">
                Thank you for signing up! Use the OTP below to verify your email address and complete your registration.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 40px;" align="center">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="background-color:#f3f4f6;border-radius:8px;padding:20px 40px;letter-spacing:12px;font-size:36px;font-weight:700;color:#4f46e5;font-family:monospace;">
                    ${otp}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:0 40px;">
              <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0;text-align:center;">
                This OTP expires in 10 minutes. If you did not create an account, please ignore this email.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 40px;border-top:1px solid #e5e7eb;margin-top:24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="color:#9ca3af;font-size:12px;line-height:1.6;">
                    Sent via MindMil
                  </td>
                  <td style="color:#9ca3af;font-size:12px;text-align:right;">
                    Do not reply to this email
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
  `;

  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject: 'Verify Your Email — MindMil',
    html
  };

  const transport = getTransporter();
  const info = await transport.sendMail(mailOptions);
  return info;
}

async function sendReportShareEmail({ to, sharedByName, assessmentTitle, shareUrl, expiresInDays }) {
  const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER;
  const fromName = process.env.FROM_NAME || 'MindMil';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f0f0f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f0f0f0;padding:32px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color:#ffffff;border-radius:6px;overflow:hidden;">
          <tr>
            <td style="background-color:#4f46e5;height:4px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:32px 40px 0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">
                    Report Shared With You
                  </td>
                </tr>
                <tr>
                  <td style="font-size:22px;font-weight:700;color:#111827;padding-top:6px;">
                    ${assessmentTitle}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px 0;">
              <div style="border-top:1px solid #e5e7eb;"></div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px 0;">
              <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px;">
                <strong>${sharedByName}</strong> has shared their <strong>${assessmentTitle}</strong> report with you.
              </p>
              <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px;">
                Click the button below to view the report. The link will expire in ${expiresInDays} days.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 40px 0;" align="center">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="background-color:#4f46e5;border-radius:6px;">
                    <a href="${shareUrl}" target="_blank" style="display:inline-block;padding:14px 40px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;border-radius:6px;">
                      View Report &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px 0;">
              <p style="color:#9ca3af;font-size:12px;line-height:1.6;margin:0;text-align:center;">
                Trouble with the button? Copy this link:<br>
                <a href="${shareUrl}" style="color:#4f46e5;word-break:break-all;">${shareUrl}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 40px;border-top:1px solid #e5e7eb;margin-top:24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="color:#9ca3af;font-size:12px;line-height:1.6;">
                    Sent via MindMil
                  </td>
                  <td style="color:#9ca3af;font-size:12px;text-align:right;">
                    Do not reply to this email
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
  `;

  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject: `${sharedByName} shared a ${assessmentTitle} report with you`,
    html
  };

  const transport = getTransporter();
  const info = await transport.sendMail(mailOptions);
  return info;
}

async function sendTestTakerThankYouEmail({ to, testTakerName, assessmentTitle, organizationName }) {
  const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER;
  const fromName = process.env.FROM_NAME || 'MindMil';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f0f0f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f0f0f0;padding:32px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color:#ffffff;border-radius:6px;overflow:hidden;">
          <tr>
            <td style="background-color:#4f46e5;height:4px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:32px 40px 0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">
                    Thank You
                  </td>
                </tr>
                <tr>
                  <td style="font-size:22px;font-weight:700;color:#111827;padding-top:6px;">
                    Assessment Completed
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px 0;">
              <div style="border-top:1px solid #e5e7eb;"></div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px 0;">
              <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px;">
                Hi ${testTakerName},
              </p>
              <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px;">
                Thank you for completing the <strong>${assessmentTitle}</strong> assessment.
              </p>
              <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px;">
                Your responses have been successfully submitted and saved. If the organization has made the results visible to you, you may be able to view them in your dashboard.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px 32px;">
              <p style="margin:0;font-size:14px;color:#6b7280;">
                Best regards,<br>
                The ${organizationName || 'MindMil'} Team
              </p>
            </td>
          </tr>
        </table>
        <table role="presentation" width="600" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding:24px 0;text-align:center;font-size:12px;color:#9ca3af;">
              &copy; ${new Date().getFullYear()} ${organizationName || 'MindMil'}. All rights reserved.<br>
              This is an automated message, please do not reply.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject: `Thank you for completing: ${assessmentTitle}`,
    html
  };

  const transporter = getTransporter();
  return transporter.sendMail(mailOptions);
}

/**
 * Send test completion notification to the inviter/admin
 */
async function sendTestCompletedEmail({ to, testTakerName, assessmentTitle, organizationName, reportUrl, percentage, passed }) {
  const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER;
  const fromName = process.env.FROM_NAME || 'MindMil';

  const statusBadge = passed
    ? `<span style="display:inline-block;padding:4px 12px;border-radius:4px;font-size:13px;font-weight:600;color:#059669;background:#d1fae5;">PASSED</span>`
    : `<span style="display:inline-block;padding:4px 12px;border-radius:4px;font-size:13px;font-weight:600;color:#dc2626;background:#fee2e2;">NOT PASSED</span>`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f0f0f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f0f0f0;padding:32px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color:#ffffff;border-radius:6px;overflow:hidden;">
          <tr>
            <td style="background-color:#059669;height:4px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:32px 40px 0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">
                    Assessment Completed
                  </td>
                </tr>
                <tr>
                  <td style="font-size:22px;font-weight:700;color:#111827;padding-top:6px;">
                    ${assessmentTitle}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px 0;">
              <div style="border-top:1px solid #e5e7eb;"></div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px 0;">
              <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px;">
                Hello,
              </p>
              <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px;">
                <strong>${testTakerName}</strong> has completed the <strong>${assessmentTitle}</strong> assessment.
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f9fafb;border-radius:6px;">
                <tr>
                  <td style="padding:20px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="color:#6b7280;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.3px;padding-bottom:12px;">
                          Result Summary
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom:8px;">
                          <table role="presentation" cellspacing="0" cellpadding="0">
                            <tr>
                              <td style="color:#9ca3af;font-size:13px;width:140px;">Test Taker</td>
                              <td style="color:#111827;font-size:14px;font-weight:600;">${testTakerName}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom:8px;">
                          <table role="presentation" cellspacing="0" cellpadding="0">
                            <tr>
                              <td style="color:#9ca3af;font-size:13px;width:140px;">Score</td>
                              <td style="color:#111827;font-size:14px;font-weight:600;">${percentage !== undefined && percentage !== null ? `${Math.round(percentage)}%` : '—'}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <table role="presentation" cellspacing="0" cellpadding="0">
                            <tr>
                              <td style="color:#9ca3af;font-size:13px;width:140px;">Status</td>
                              <td>${passed !== undefined && passed !== null ? statusBadge : '—'}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 40px 0;" align="center">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="background-color:#059669;border-radius:6px;">
                    <a href="${reportUrl}" target="_blank" style="display:inline-block;padding:14px 40px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;border-radius:6px;">
                      View Report &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px 0;">
              <p style="color:#9ca3af;font-size:12px;line-height:1.6;margin:0;text-align:center;">
                Trouble with the button? Copy this link:<br>
                <a href="${reportUrl}" style="color:#059669;word-break:break-all;">${reportUrl}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 40px;border-top:1px solid #e5e7eb;margin-top:24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="color:#9ca3af;font-size:12px;line-height:1.6;">
                    Sent by ${organizationName} via MindMil
                  </td>
                  <td style="color:#9ca3af;font-size:12px;text-align:right;">
                    Do not reply to this email
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
  `;

  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject: `Completed: ${testTakerName} finished ${assessmentTitle}`,
    html
  };

  const transport = getTransporter();
  const info = await transport.sendMail(mailOptions);
  return info;
}

/**
 * Send test abandoned notification to the inviter/admin
 */
async function sendTestAbandonedEmail({ to, testTakerName, assessmentTitle, organizationName, questionsAnswered, totalQuestions }) {
  const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER;
  const fromName = process.env.FROM_NAME || 'MindMil';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f0f0f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f0f0f0;padding:32px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color:#ffffff;border-radius:6px;overflow:hidden;">
          <tr>
            <td style="background-color:#f59e0b;height:4px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:32px 40px 0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">
                    Assessment Abandoned
                  </td>
                </tr>
                <tr>
                  <td style="font-size:22px;font-weight:700;color:#111827;padding-top:6px;">
                    ${assessmentTitle}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px 0;">
              <div style="border-top:1px solid #e5e7eb;"></div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px 0;">
              <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px;">
                Hello,
              </p>
              <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px;">
                <strong>${testTakerName}</strong> has abandoned the <strong>${assessmentTitle}</strong> assessment before completing it.
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#fefce8;border:1px solid #fde68a;border-radius:6px;">
                <tr>
                  <td style="padding:20px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="color:#6b7280;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.3px;padding-bottom:12px;">
                          Summary
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom:8px;">
                          <table role="presentation" cellspacing="0" cellpadding="0">
                            <tr>
                              <td style="color:#9ca3af;font-size:13px;width:140px;">Test Taker</td>
                              <td style="color:#111827;font-size:14px;font-weight:600;">${testTakerName}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom:8px;">
                          <table role="presentation" cellspacing="0" cellpadding="0">
                            <tr>
                              <td style="color:#9ca3af;font-size:13px;width:140px;">Questions Answered</td>
                              <td style="color:#111827;font-size:14px;font-weight:600;">${questionsAnswered} of ${totalQuestions}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <table role="presentation" cellspacing="0" cellpadding="0">
                            <tr>
                              <td style="color:#9ca3af;font-size:13px;width:140px;">Status</td>
                              <td><span style="display:inline-block;padding:4px 12px;border-radius:4px;font-size:13px;font-weight:600;color:#92400e;background:#fef3c7;">ABANDONED</span></td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px 0;">
              <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0;">
                You may want to reach out to the test taker to understand why they abandoned the assessment and consider resending the invite if needed.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 40px;border-top:1px solid #e5e7eb;margin-top:24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="color:#9ca3af;font-size:12px;line-height:1.6;">
                    Sent by ${organizationName} via MindMil
                  </td>
                  <td style="color:#9ca3af;font-size:12px;text-align:right;">
                    Do not reply to this email
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
  `;

  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject: `Abandoned: ${testTakerName} did not complete ${assessmentTitle}`,
    html
  };

  const transport = getTransporter();
  const info = await transport.sendMail(mailOptions);
  return info;
}

module.exports = {
  sendTestInvite,
  sendTestTakerThankYouEmail,
  sendPasswordResetEmail,
  sendCreditRequestNotification,
  sendEmailVerificationOtp,
  sendReportShareEmail,
  sendTestCompletedEmail,
  sendTestAbandonedEmail
};

async function sendCreditRequestNotification({ adminEmail, requesterName, organizationName, creditsRequested, reason }) {
  const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER;
  const fromName = process.env.FROM_NAME || 'MindMil';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f0f0f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f0f0f0;padding:32px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color:#ffffff;border-radius:6px;overflow:hidden;">

          <!-- Top accent bar -->
          <tr>
            <td style="background-color:#f59e0b;height:4px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">
                    Credit Request
                  </td>
                </tr>
                <tr>
                  <td style="font-size:22px;font-weight:700;color:#111827;padding-top:6px;">
                    New Credit Request Submitted
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:24px 40px 0;">
              <div style="border-top:1px solid #e5e7eb;"></div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:24px 40px 0;">
              <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px;">
                A new credit request has been submitted by <strong>${requesterName}</strong> from <strong>${organizationName}</strong>.
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#fefce8;border:1px solid #fde68a;border-radius:6px;">
                <tr>
                  <td style="padding:20px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="color:#6b7280;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.3px;padding-bottom:12px;">
                          Request Details
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom:8px;">
                          <table role="presentation" cellspacing="0" cellpadding="0">
                            <tr>
                              <td style="color:#9ca3af;font-size:13px;width:140px;">Credits Requested</td>
                              <td style="color:#111827;font-size:15px;font-weight:600;">${creditsRequested}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom:8px;">
                          <table role="presentation" cellspacing="0" cellpadding="0">
                            <tr>
                              <td style="color:#9ca3af;font-size:13px;width:140px;">Organization</td>
                              <td style="color:#111827;font-size:15px;font-weight:600;">${organizationName}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      ${reason ? `
                      <tr>
                        <td>
                          <table role="presentation" cellspacing="0" cellpadding="0">
                            <tr>
                              <td style="color:#9ca3af;font-size:13px;width:140px;vertical-align:top;">Reason</td>
                              <td style="color:#374151;font-size:14px;">${reason}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:28px 40px 0;" align="center">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="background-color:#6366f1;border-radius:6px;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/credits" target="_blank" style="display:inline-block;padding:14px 40px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;border-radius:6px;">
                      Review Request &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 40px;border-top:1px solid #e5e7eb;margin-top:24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="color:#9ca3af;font-size:12px;line-height:1.6;">
                    Automated notification from MindMil
                  </td>
                  <td style="color:#9ca3af;font-size:12px;text-align:right;">
                    Do not reply to this email
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
  `;

  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to: adminEmail,
    subject: `Credit Request — ${creditsRequested} credits from ${organizationName}`,
    html
  };

  const transport = getTransporter();
  const info = await transport.sendMail(mailOptions);
  return info;
}
