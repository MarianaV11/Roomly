import { z } from "zod";

const splitEmails = (value: string) =>
  value
    .split(/[,;\s]+/)
    .map((email) => email.trim())
    .filter(Boolean);

/** Typed as text ("a@x.com, b@y.com"), validated and returned as a list. */
const emailList = (min: number) =>
  z
    .string()
    .transform(splitEmails)
    .pipe(
      z
        .array(z.email("Algum dos e-mails é inválido"))
        .min(min, "Informe ao menos um e-mail")
        .max(99, "No máximo 99 pessoas por vez"),
    );

export const directSchema = z.object({
  email: z.email("E-mail inválido"),
});

export const groupSchema = z.object({
  name: z.string().trim().min(1, "Dê um nome ao grupo").max(100, "Máximo de 100 caracteres"),
  // Optional: groups are public, people can join later.
  emails: emailList(0),
});

export const addMembersSchema = z.object({
  emails: emailList(1),
});

export type DirectValues = z.infer<typeof directSchema>;
export type GroupInput = z.input<typeof groupSchema>;
export type GroupValues = z.output<typeof groupSchema>;
export type AddMembersInput = z.input<typeof addMembersSchema>;
export type AddMembersValues = z.output<typeof addMembersSchema>;
