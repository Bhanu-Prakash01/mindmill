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
async function sendTestInvite({ to, testTakerName, assessmentTitle, organizationName, testLink, instructions }) {
  const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER;
  const fromName = process.env.FROM_NAME || 'Mindmil Assessments';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Assessment Invitation</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f4f7;padding:40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:40px 40px 30px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:bold;">Assessment Invitation</h1>
              <p style="color:#c7d2fe;margin:8px 0 0;font-size:14px;">${organizationName}</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 16px;">
                Hi <strong>${testTakerName}</strong>,
              </p>
              <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 16px;">
                You have been invited to take the <strong>${assessmentTitle}</strong> assessment by <strong>${organizationName}</strong>.
              </p>
              ${instructions ? `
              <div style="background-color:#f9fafb;border-left:4px solid #6366f1;padding:16px;margin:20px 0;border-radius:0 4px 4px 0;">
                <p style="color:#374151;font-size:14px;margin:0;"><strong>Instructions:</strong> ${instructions}</p>
              </div>
              ` : ''}
              <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">
                Click the button below to start your assessment. The link is valid for 30 days.
              </p>
              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto;">
                <tr>
                  <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:8px;">
                    <a href="${testLink}" target="_blank" style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-size:16px;font-weight:bold;border-radius:8px;">
                      Start Assessment
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color:#9ca3af;font-size:12px;line-height:1.6;margin:24px 0 0;text-align:center;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${testLink}" style="color:#6366f1;word-break:break-all;">${testLink}</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f9fafb;padding:24px 40px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="color:#9ca3af;font-size:12px;margin:0;">
                This is an automated email from Mindmil Assessments. Please do not reply.
              </p>
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
    subject: `Assessment Invitation: ${assessmentTitle}`,
    html
  };

  const transport = getTransporter();
  const info = await transport.sendMail(mailOptions);
  return info;
}

module.exports = {
  sendTestInvite
};
