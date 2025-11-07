import { z } from "zod";

// Auth validation schemas
export const signupSchema = z.object({
  email: z.string()
    .email("Email non valida")
    .max(255, "Email troppo lunga")
    .transform(val => val.trim().toLowerCase()),
  password: z.string()
    .min(8, "La password deve contenere almeno 8 caratteri")
    .max(100, "Password troppo lunga")
    .regex(/[A-Z]/, "La password deve contenere almeno una lettera maiuscola")
    .regex(/[a-z]/, "La password deve contenere almeno una lettera minuscola")
    .regex(/[0-9]/, "La password deve contenere almeno un numero"),
  fullName: z.string()
    .min(2, "Il nome deve contenere almeno 2 caratteri")
    .max(100, "Nome troppo lungo")
    .transform(val => val.trim()),
  badgeCode: z.string()
    .min(1, "Codice badge obbligatorio")
    .max(50, "Codice badge troppo lungo")
    .transform(val => val.trim().toUpperCase()),
  canteenCode: z.string()
    .min(4, "Il codice mensa deve contenere almeno 4 caratteri")
    .max(50, "Codice mensa troppo lungo")
    .transform(val => val.trim().toUpperCase())
    .optional(),
});

export const loginSchema = z.object({
  email: z.string()
    .email("Email non valida")
    .max(255, "Email troppo lunga")
    .transform(val => val.trim().toLowerCase()),
  password: z.string()
    .min(1, "Password obbligatoria")
    .max(100, "Password troppo lunga"),
});

// Dish validation schemas
export const dishSchema = z.object({
  name: z.string()
    .min(2, "Il nome deve contenere almeno 2 caratteri")
    .max(200, "Nome troppo lungo")
    .transform(val => val.trim()),
  category: z.string()
    .min(1, "Categoria obbligatoria")
    .max(100, "Categoria troppo lunga"),
  variant: z.string()
    .max(100, "Variante troppo lunga")
    .optional()
    .transform(val => val?.trim() || ""),
  availableForTakeaway: z.boolean(),
  takeawayFrom: z.string().optional(),
  takeawayUntil: z.string().optional(),
});

// Order validation schemas
export const orderSchema = z.object({
  menuId: z.string().uuid("ID menu non valido"),
  selectedDishes: z.array(z.string().uuid("ID piatto non valido"))
    .min(1, "Seleziona almeno un piatto")
    .max(20, "Troppi piatti selezionati"),
  isTakeaway: z.boolean(),
  takeawayTime: z.string().optional(),
  notes: z.string()
    .max(500, "Note troppo lunghe")
    .optional()
    .transform(val => val?.trim() || ""),
});

// Allergen validation
export const allergenSelectionSchema = z.object({
  allergenIds: z.array(z.string().uuid("ID allergene non valido"))
    .max(30, "Troppi allergeni selezionati"),
});

// Sanitize HTML to prevent XSS
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
};
