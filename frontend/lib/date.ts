import { format, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";

export function parseServerDate(value: string): Date {
  return new Date(/[zZ]|[+-]\d\d:\d\d$/.test(value) ? value : `${value}Z`);
}

export function formatMessageTime(value: string): string {
  const date = parseServerDate(value);

  return format(date, isToday(date) ? "HH:mm" : "dd/MM HH:mm", { locale: ptBR });
}
