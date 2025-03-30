import sgMail from "@sendgrid/mail";

// Configuração do SendGrid será feita apenas quando o serviço for usado
let isInitialized = false;

function initializeSendGrid() {
  if (!isInitialized) {
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error("SENDGRID_API_KEY is not defined");
    }
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    isInitialized = true;
  }
}

interface SendMailProps {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export async function sendMail({ to, subject, text, html }: SendMailProps) {
  try {
    initializeSendGrid();

    const msg = {
      to,
      from: process.env.SENDGRID_FROM_EMAIL || "planner.contato@outlook.com.br",
      subject,
      text,
      html,
    };

    await sgMail.send(msg);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
}
