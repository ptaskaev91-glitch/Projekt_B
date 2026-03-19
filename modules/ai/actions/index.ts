export const aiActionTypes = {
  sendMessage: "chat/sendMessage",
} as const;

export type AiSendMessagePayload = {
  userText?: string;
  chatId?: string;
  effectiveModelName?: string;
};

