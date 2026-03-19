import { v4 } from 'crypto';

let counter = 0;
export function generateId(): string {
  counter++;
  return `block-${Date.now()}-${counter}-${Math.random().toString(36).slice(2, 8)}`;
}
