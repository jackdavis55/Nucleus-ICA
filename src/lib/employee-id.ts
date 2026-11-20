import { z } from "zod";

export const employeeIdSchema = z.string().length(6).regex(/^[0-9]{6}$/);
