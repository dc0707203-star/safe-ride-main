import { z } from "zod";

// Student Registration Schema
export const studentRegistrationSchema = z.object({
  studentIdNumber: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{5}$/, "Invalid student ID format (must be XXXX-XXXXX)")
    .min(1, "Student ID is required"),
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must not exceed 100 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Full name can only contain letters, spaces, hyphens, and apostrophes"),
  course: z
    .string()
    .min(1, "Course is required")
    .max(100, "Course name must not exceed 100 characters"),
  yearLevel: z
    .string()
    .min(1, "Year level is required"),
  section: z
    .string()
    .min(1, "Section is required"),
  address: z
    .string()
    .trim()
    .min(5, "Address must be at least 5 characters")
    .max(200, "Address must not exceed 200 characters"),
  contactNumber: z
    .string()
    .trim()
    .regex(/^09\d{9}$/, "Contact number must be a valid Philippine mobile number (09XXXXXXXXX)"),
});

// Driver Registration Schema
export const driverRegistrationSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Invalid email address"),
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must not exceed 100 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Full name can only contain letters, spaces, hyphens, and apostrophes"),
  licenseNumber: z
    .string()
    .trim()
    .min(5, "License number must be at least 5 characters")
    .max(20, "License number must not exceed 20 characters"),
  contactNumber: z
    .string()
    .trim()
    .regex(/^09\d{9}$/, "Contact number must be a valid Philippine mobile number (09XXXXXXXXX)"),
  vehicleType: z
    .string()
    .min(1, "Vehicle type is required"),
  licensePlate: z
    .string()
    .trim()
    .min(5, "License plate must be at least 5 characters")
    .max(10, "License plate must not exceed 10 characters"),
});

// PNP Registration Schema
export const pnpRegistrationSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Invalid email address"),
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must not exceed 100 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Full name can only contain letters, spaces, hyphens, and apostrophes"),
  badgeNumber: z
    .string()
    .trim()
    .min(3, "Badge number must be at least 3 characters")
    .max(20, "Badge number must not exceed 20 characters"),
  contactNumber: z
    .string()
    .trim()
    .regex(/^09\d{9}$/, "Contact number must be a valid Philippine mobile number (09XXXXXXXXX)"),
  department: z
    .string()
    .min(1, "Department is required")
    .max(100, "Department name must not exceed 100 characters"),
});

// Login Schema
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Invalid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
});

// Report Schema
export const reportSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title must not exceed 200 characters"),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description must not exceed 2000 characters"),
  category: z
    .string()
    .min(1, "Category is required"),
  priority: z
    .enum(["low", "medium", "high", "critical"], {
      errorMap: () => ({ message: "Invalid priority level" }),
    }),
});

// Contact Form Schema
export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Name can only contain letters, spaces, hyphens, and apostrophes"),
  email: z
    .string()
    .trim()
    .email("Invalid email address"),
  subject: z
    .string()
    .trim()
    .min(5, "Subject must be at least 5 characters")
    .max(200, "Subject must not exceed 200 characters"),
  message: z
    .string()
    .trim()
    .min(10, "Message must be at least 10 characters")
    .max(2000, "Message must not exceed 2000 characters"),
});

// Type exports
export type StudentRegistration = z.infer<typeof studentRegistrationSchema>;
export type DriverRegistration = z.infer<typeof driverRegistrationSchema>;
export type PNPRegistration = z.infer<typeof pnpRegistrationSchema>;
export type Login = z.infer<typeof loginSchema>;
export type Report = z.infer<typeof reportSchema>;
export type Contact = z.infer<typeof contactSchema>;
