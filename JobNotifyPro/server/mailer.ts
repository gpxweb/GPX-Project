import nodemailer from "nodemailer";
import { Job, Subscriber, Campaign } from "@shared/schema";

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  debug: true, // Enable debug logging
  logger: true  // Log to console
});

// Verify connection configuration on startup
transporter.verify(function(error, success) {
  if (error) {
    console.error('SMTP Connection Error:', error);
  } else {
    console.log('SMTP Server is ready to send messages');
  }
});

export async function sendCampaignEmails(
  campaign: Campaign,
  jobs: Job[],
  subscribers: Subscriber[]
): Promise<boolean> {
  try {
    console.log(`Starting campaign delivery to ${subscribers.length} subscribers`);

    if (!subscribers || subscribers.length === 0) {
      console.error('No subscribers provided');
      return false;
    }

    const html = generateEmailTemplate(campaign, jobs);
    console.log('Generated email template');

    // Send to all subscribers in a single batch using BCC
    try {
      const info = await transporter.sendMail({
        from: '"Job Board Notifications" <jobpush@jobberway.com>',
        bcc: subscribers.map(sub => sub.email),
        subject: campaign.subject,
        html,
        headers: {
          'List-Unsubscribe': '<mailto:unsubscribe@jobberway.com>',
          'Precedence': 'bulk'
        }
      });

      console.log('Message sent: %s', info.messageId);
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
      return true;
    } catch (error) {
      console.error('Failed to send campaign:', error);
      return false;
    }
  } catch (error) {
    console.error("Failed to send campaign emails:", error);
    return false;
  }
}

function generateEmailTemplate(campaign: Campaign, jobs: Job[]): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${campaign.subject}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2563eb;">${campaign.name}</h1>
        <div style="margin: 20px 0;">${campaign.content}</div>
        <h2 style="color: #1e40af;">Latest Jobs</h2>
        ${jobs
          .map(
            (job) => `
            <div style="margin-bottom: 30px; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
              <h3 style="color: #1e40af; margin: 0 0 10px 0;">${job.title}</h3>
              <p style="margin: 5px 0;"><strong>${job.company}</strong> - ${job.location}</p>
              <p style="margin: 10px 0;">${job.description}</p>
              <a href="${job.url}" 
                 style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 4px;">
                Apply Now
              </a>
            </div>
          `
          )
          .join("")}
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
          <p>You are receiving this email because you subscribed to job updates from Jobberway.</p>
          <p>To unsubscribe, please reply with "unsubscribe" in the subject line.</p>
        </div>
      </body>
    </html>
  `;
}