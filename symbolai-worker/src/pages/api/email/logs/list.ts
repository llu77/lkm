import type { APIRoute } from 'astro';
import { requireAuth } from '@/lib/session';

export const GET: APIRoute = async ({ request, locals }) => {
  // Check authentication
  const authResult = await requireAuth(locals.runtime.env.SESSIONS, request);
  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const triggerType = url.searchParams.get('triggerType');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    let query = `
      SELECT *
      FROM email_logs
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }

    if (triggerType) {
      query += ` AND trigger_type = ?`;
      params.push(triggerType);
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const stmt = locals.runtime.env.DB.prepare(query);
    const result = params.length > 0
      ? await stmt.bind(...params).all()
      : await stmt.all();

    const logs = (result.results || []).map((log: any) => ({
      ...log,
      to_addresses: JSON.parse(log.to_addresses || '[]'),
      cc_addresses: log.cc_addresses ? JSON.parse(log.cc_addresses) : null,
      template_variables: log.template_variables ? JSON.parse(log.template_variables) : null
    }));

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total
      FROM email_logs
      WHERE 1=1
    `;
    const countParams: any[] = [];

    if (status) {
      countQuery += ` AND status = ?`;
      countParams.push(status);
    }

    if (triggerType) {
      countQuery += ` AND trigger_type = ?`;
      countParams.push(triggerType);
    }

    const countStmt = locals.runtime.env.DB.prepare(countQuery);
    const countResult = countParams.length > 0
      ? await countStmt.bind(...countParams).first()
      : await countStmt.first();

    const total = (countResult?.total as number) || 0;

    return new Response(
      JSON.stringify({
        success: true,
        logs,
        total,
        limit,
        offset
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('List email logs error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
