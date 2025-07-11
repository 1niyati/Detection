import { NextRequest } from "next/server";
import axios from "axios";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, role, department } = body;

    console.log('Attempting signup with:', { name, email, role, department }); // Log signup attempt

    // Call the correct backend API endpoint: http://localhost:8000/signup
    const response = await axios.post('http://localhost:3001/auth/signup', {
      name,
      email,
      password,
      role,
      department
    });

    console.log('Signup successful:', response.data); // Log successful response

    return new Response(JSON.stringify({
      success: true,
      user: response.data.user,
      token: response.data.token,
      message: 'Signup successful!'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    // Detailed error logging
    console.error('Signup error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    
    const errorMessage = error.response?.data?.message 
      || error.response?.data?.error 
      || error.message 
      || 'Signup failed. Please try again.';

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: error.response?.status || 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
} 