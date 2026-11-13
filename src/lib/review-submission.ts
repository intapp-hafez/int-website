import { z } from "zod";

export const reviewSubmissionSchema = z.object({
  author: z.string().trim().min(1).max(100),
  company: z.string().trim().max(150),
  rating: z.number().int().min(1).max(5),
  text: z.string().trim().min(1).max(2000),
});

export function pendingReview(input: unknown) {
  return { ...reviewSubmissionSchema.parse(input), approved: false as const };
}