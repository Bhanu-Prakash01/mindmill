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

module.exports = {
  sendTestInvite
};
