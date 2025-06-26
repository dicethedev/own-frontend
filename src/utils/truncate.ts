export function truncateMessage(message: string, length: number = 50): string {
  if (!message) return "";
  return message.length > 100 ? `${message.slice(0, length)}...` : message;
}
