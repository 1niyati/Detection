import { NextRequest } from "next/server";
import axios from "axios";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    console.log('Login attempt for:', email); // Log login attempt

    // The backend expects data in 'x-www-form-urlencoded' format for the /token endpoint.
    const params = new URLSearchParams();
    params.append('username', email);
    params.append('password', password);

    // Call the correct backend API endpoint: /token
    const response = await axios.post('http://localhost:3001/auth/login', { email, password }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Login successful:', { email, data: response.data }); // Log successful response

    return new Response(JSON.stringify({
      success: true,
      user: response.data.user,
      token: response.data.token
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    // Detailed error logging
    console.error('Login error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      url: 'http://localhost:3001/auth/login'
    });
    
    const errorData = error.response?.data;
    const status = error.response?.status || 500;

    // Check for the detailed anomaly structure from our FastAPI backend
    if (status === 403 && typeof errorData.detail === 'object' && errorData.detail !== null) {
        // It's a structured anomaly alert, forward the details
        return new Response(
            JSON.stringify({
                success: false,
                anomalyDetails: errorData.detail,
            }),
            {
                status: 403,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }

    // Handle other errors (like simple "Incorrect password" string in detail)
    const errorMessage = typeof errorData?.detail === 'string'
        ? errorData.detail
        : errorData?.message || 'Login failed. Please try again.';

    return new Response(
        JSON.stringify({
            success: false,
            error: errorMessage,
        }),
        {
            status: status,
            headers: { 'Content-Type': 'application/json' },
        }
    );
  }
} 