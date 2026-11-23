import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("E-mail inválido"),
  password: z.string().min(1, "Informe a senha").max(128),
});

export const registerSchema = loginSchema.extend({
  name: z.string().trim().min(1, "Informe seu nome").max(100, "Máximo de 100 caracteres"),
  password: z
    .string()
    .min(8, "A senha precisa ter pelo menos 8 caracteres")
    .max(128, "Máximo de 128 caracteres"),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
