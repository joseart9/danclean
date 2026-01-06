import { getToken } from "@/lib/auth";

const WHATSAPP_API_URL =
  process.env.WHATSAPP_API_URL ||
  process.env.NEXT_PUBLIC_WHATSAPP_API_URL ||
  "";

export interface SendMessageInput {
  to: string;
  message: string;
}

export interface SendMessageResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class WhatsAppService {
  /**
   * Send a WhatsApp message
   * @param to - Phone number in format: "1234567890" (without + or country code prefix)
   * @param message - Message text to send
   */
  async sendMessage(to: string, message: string): Promise<SendMessageResponse> {
    try {
      const token = await getToken();

      if (!token) {
        throw new Error("Authentication required. No token provided.");
      }

      const response = await fetch(`${WHATSAPP_API_URL}/send-msg`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          to,
          message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || "Error al enviar mensaje",
        };
      }

      return {
        success: true,
        messageId: data.messageId || data.id,
      };
    } catch (error) {
      console.error("Error sending WhatsApp message:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error desconocido al enviar mensaje",
      };
    }
  }
}

export const whatsappService = new WhatsAppService();
