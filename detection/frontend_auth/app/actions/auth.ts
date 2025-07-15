"use server"

import { redirect } from "next/navigation"
import { createSession, deleteSession } from "@/lib/session"

interface FormState {
  message: string
  errors: Record<string, string>
}

export async function signup(prevState: FormState, formData: FormData): Promise<FormState> {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  const errors: Record<string, string> = {};
  if (!name || name.length < 2) errors.name = "Name must be at least 2 characters long";
  if (!email || !email.includes("@")) errors.email = "Please enter a valid email address";
  if (!password || password.length < 6) errors.password = "Password must be at least 6 characters long";
  if (password !== confirmPassword) errors.confirmPassword = "Passwords do not match";

  if (Object.keys(errors).length > 0) {
    return { message: "Please correct the errors below.", errors };
  }

  try {
    // Call the local backend server directly
    const response = await fetch(`https://f7043b0e5985.ngrok-free.app/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return {
        message: errorData?.detail || "An error occurred during signup.",
        errors: {},
      };
    }
  } catch (error) {
    console.error("Signup Action Error:", error);
    return {
      message: 'An unexpected network error occurred. Please try again.',
      errors: {},
    };
  }

  redirect("/login");
}

export async function login(prevState: FormState, formData: FormData): Promise<FormState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const user_agent = formData.get('user_agent') as string; // Get user_agent from hidden field

  const errors: Record<string, string> = {}
  if (!email || !email.includes('@')) errors.email = 'Please enter a valid email address'
  if (!password) errors.password = "Password is required";

  if (Object.keys(errors).length > 0) {
    return { message: "", errors };
  }

  try {
    // Call the local backend server directly
    const response = await fetch(`https://f7043b0e5985.ngrok-free.app/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, user_agent }), // Send user_agent to backend
    });

    const data = await response.json()

    if (response.status === 429) {
      return {
        message: data.detail || "You are temporarily blocked due to suspicious activity. Please try again in 30 seconds.",
        errors: {},
      }
    }

    if (response.status === 403) { // Permanently Blocked
      return {
        message: data.detail || "This account is permanently blocked due to suspicious activity.",
        errors: {},
      }
    }

    if (!response.ok) {
      return {
        message: data.detail || 'Login failed. Please try again.',
        errors: {},
      }
    }

    // If anomaly is detected, show a specific message on the login page
    // and DO NOT create a session.
    if (data.anomaly_detected) {
      return {
        message: `Anomaly Detected: ${data.anomaly_details?.message || 'Suspicious activity was observed.'}`,
        errors: {},
      }
    }

    // Only create session and redirect if login is successful AND no anomaly was found.
    await createSession({
      userId: data.user_id,
      name: data.name,
      email: data.email,
    });
    
    redirect('/dashboard')

  } catch (error: any) {
    if (error.digest?.startsWith('NEXT_REDIRECT')) {
      throw error
    }

    console.error("Login Action Error:", error);
    return {
      message: 'Login failed due to an unexpected error.',
      errors: {},
    };
  }
}

export async function logout() {
  await deleteSession();
  redirect('/');
}