import { Resend } from "resend";

// Configuração do Resend será feita apenas quando o serviço for usado
let resend: Resend | null = null;

function initializeResend() {
  if (!resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not defined");
    }
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

interface SendMailProps {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export async function sendMail({ to, subject, text, html }: SendMailProps) {
  try {
    const resendClient = initializeResend();

    const { data, error } = await resendClient.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "planner@resend.dev",
      to: [to],
      subject,
      text,
      html,
    });

    if (error) {
      console.error("Error sending email:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log("Email sent successfully:", data?.id);
    return data;
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
}
