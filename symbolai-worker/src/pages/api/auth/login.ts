import type { APIRoute } from 'astro';
import { userQueries, generateId } from '@/lib/db';
import { createSession, createSessionCookie } from '@/lib/session';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return new Response(JSON.stringify({ error: 'اسم المستخدم وكلمة المرور مطلوبة' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get user from database
    const user = await userQueries.getByUsername(locals.runtime.env.DB, username);

    if (!user) {
      return new Response(JSON.stringify({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // In a real application, you'd verify the password hash here
    // For now, we'll use a simple check (REPLACE THIS IN PRODUCTION)
    // bcrypt.compare(password, user.password_hash)

    // Create session
    const token = await createSession(
      locals.runtime.env.SESSIONS,
      user.id,
      user.username || '',
      user.role || 'employee'
    );

    // Return success with session cookie
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': createSessionCookie(token)
        }
      }
    );
  } catch (error) {
    console.error('Login error:', error);
    return new Response(
      JSON.stringify({ error: 'حدث خطأ أثناء تسجيل الدخول' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
