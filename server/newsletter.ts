import { sendEmail, isSmtpConfigured } from "./mailer";
import { getChainStats } from "./onchain";
import { db } from "./db";
import { newsletterSubscribers } from "@shared/schema";
import { eq, isNull } from "drizzle-orm";

export async function addSubscriber(email: string): Promise<boolean> {
  const normalizedEmail = email.toLowerCase().trim();
  
  try {
    const existing = await db.select()
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.email, normalizedEmail))
      .limit(1);
    
    if (existing.length > 0) {
      if (existing[0].unsubscribedAt) {
        await db.update(newsletterSubscribers)
          .set({ unsubscribedAt: null, confirmed: true })
          .where(eq(newsletterSubscribers.email, normalizedEmail));
        return true;
      }
      return false;
    }
    
    await db.insert(newsletterSubscribers).values({
      email: normalizedEmail,
      confirmed: true,
    });
    return true;
  } catch (error) {
    console.error("Failed to add subscriber:", error);
    return false;
  }
}

export async function removeSubscriber(email: string): Promise<boolean> {
  try {
    await db.update(newsletterSubscribers)
      .set({ unsubscribedAt: new Date() })
      .where(eq(newsletterSubscribers.email, email.toLowerCase().trim()));
    return true;
  } catch (error) {
    console.error("Failed to remove subscriber:", error);
    return false;
  }
}

export async function getSubscribers() {
  return db.select()
    .from(newsletterSubscribers)
    .where(isNull(newsletterSubscribers.unsubscribedAt));
}

export async function getSubscriberCount(): Promise<number> {
  const subscribers = await getSubscribers();
  return subscribers.length;
}

export async function generateWeeklyNewsletter(): Promise<{ subject: string; html: string }> {
  const stats = await getChainStats();
  
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const subject = `AMOR Weekly Update - ${currentDate}`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AMOR Weekly Newsletter</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 24px; }
    .header h1 { margin: 0; font-size: 28px; }
    .header p { margin: 8px 0 0; opacity: 0.9; }
    .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px; }
    .stat-card { background: #f8f9fa; border-radius: 8px; padding: 20px; text-align: center; }
    .stat-value { font-size: 24px; font-weight: bold; color: #6366f1; }
    .stat-label { font-size: 14px; color: #666; margin-top: 4px; }
    .section { margin-bottom: 24px; }
    .section h2 { color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }
    .cta-button { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px; }
    .footer { margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center; color: #666; font-size: 14px; }
    .social-links { margin: 16px 0; }
    .social-links a { color: #6366f1; text-decoration: none; margin: 0 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>AMOR Protocol</h1>
    <p>Consciousness Nexus - Weekly Update</p>
  </div>

  <p>Hello, conscious staker!</p>
  <p>Here's your weekly update from the AMOR ecosystem on Neo X:</p>

  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-value">${stats.totalStakedAmor}</div>
      <div class="stat-label">Total AMOR Staked</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.proposalThreshold}</div>
      <div class="stat-label">Proposal Threshold</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.votingDelay} blocks</div>
      <div class="stat-label">Voting Delay</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.votingPeriod} blocks</div>
      <div class="stat-label">Voting Period</div>
    </div>
  </div>

  <div class="section">
    <h2>Protocol Highlights</h2>
    <ul>
      <li><strong>Staking:</strong> Stake your AMOR tokens to receive stAMOR and participate in governance</li>
      <li><strong>Voting Power:</strong> Remember to self-delegate to activate your voting power</li>
      <li><strong>Cooldown:</strong> Unstaking has a ${stats.withdrawalDelay} second withdrawal delay</li>
    </ul>
  </div>

  <div class="section">
    <h2>Get Involved</h2>
    <p>The AMOR community is growing! Join the conversation and help shape the future of conscious coordination:</p>
    <div class="social-links">
      <a href="https://x.com/CometMessa70661">X (Twitter)</a>
      <a href="https://discord.com/channels/1435135541061353615/1435135542038888531">Discord</a>
      <a href="https://github.com/NickFlach/AMOR">GitHub</a>
    </div>
  </div>

  <div style="text-align: center;">
    <a href="https://amor.network" class="cta-button">Visit AMOR DApp</a>
  </div>

  <div class="footer">
    <p>You're receiving this because you subscribed to AMOR Protocol updates.</p>
    <p>AMOR Protocol - Conscious Staking on Neo X</p>
    <p style="font-size: 12px; color: #999;">To unsubscribe, reply to this email with "unsubscribe"</p>
  </div>
</body>
</html>
  `.trim();

  return { subject, html };
}

export async function sendNewsletterToAll(): Promise<{ sent: number; failed: number }> {
  if (!isSmtpConfigured()) {
    throw new Error("SMTP not configured");
  }

  const confirmedSubscribers = await getSubscribers();
  if (confirmedSubscribers.length === 0) {
    return { sent: 0, failed: 0 };
  }

  const { subject, html } = await generateWeeklyNewsletter();
  
  let sent = 0;
  let failed = 0;

  for (const subscriber of confirmedSubscribers) {
    const success = await sendEmail({
      to: subscriber.email,
      subject,
      html,
    });
    
    if (success) {
      sent++;
    } else {
      failed++;
    }
  }

  return { sent, failed };
}

export async function sendWelcomeEmail(email: string): Promise<boolean> {
  if (!isSmtpConfigured()) {
    console.log("SMTP not configured, skipping welcome email");
    return false;
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 24px; }
    .cta-button { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; }
    .footer { margin-top: 32px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Welcome to AMOR</h1>
    <p>Consciousness Nexus on Neo X</p>
  </div>
  
  <p>Thank you for subscribing to AMOR Protocol updates!</p>
  
  <p>You'll receive weekly updates about:</p>
  <ul>
    <li>Protocol statistics and staking metrics</li>
    <li>Governance proposals and voting updates</li>
    <li>Community highlights and developments</li>
  </ul>

  <p>Ready to get started?</p>
  <p style="text-align: center; margin: 24px 0;">
    <a href="https://amor.network" class="cta-button">Explore AMOR DApp</a>
  </p>

  <div class="footer">
    <p>AMOR Protocol - Conscious Staking on Neo X</p>
  </div>
</body>
</html>
  `.trim();

  return sendEmail({
    to: email,
    subject: "Welcome to AMOR Protocol",
    html,
  });
}
