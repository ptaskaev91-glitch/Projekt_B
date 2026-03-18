export const modelsActionTypes = {
  select: "models/select",
} as const;

export type ModelsSelectPayload = {
  chatId?: string;
  model?: string;
};
