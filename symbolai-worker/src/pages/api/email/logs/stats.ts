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
    const hours = parseInt(url.searchParams.get('hours') || '24');

    // Calculate time range
    const now = new Date();
    const startDate = new Date(now.getTime() - hours * 60 * 60 * 1000);
    const startDateStr = startDate.toISOString();

    // Get counts by status
    const statusResult = await locals.runtime.env.DB.prepare(`
      SELECT
        status,
        COUNT(*) as count
      FROM email_logs
      WHERE created_at >= ?
      GROUP BY status
    `).bind(startDateStr).all();

    const statusCounts = (statusResult.results || []).reduce((acc: any, row: any) => {
      acc[row.status] = row.count;
      return acc;
    }, {});

    // Get counts by trigger type
    const triggerResult = await locals.runtime.env.DB.prepare(`
      SELECT
        trigger_type,
        COUNT(*) as count
      FROM email_logs
      WHERE created_at >= ?
      GROUP BY trigger_type
      ORDER BY count DESC
      LIMIT 10
    `).bind(startDateStr).all();

    const triggerCounts = triggerResult.results || [];

    // Get total counts
    const totalResult = await locals.runtime.env.DB.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN status = 'queued' THEN 1 ELSE 0 END) as queued,
        SUM(CASE WHEN status = 'rate_limited' THEN 1 ELSE 0 END) as rate_limited
      FROM email_logs
      WHERE created_at >= ?
    `).bind(startDateStr).first();

    // Get hourly breakdown for chart
    const hourlyResult = await locals.runtime.env.DB.prepare(`
      SELECT
        strftime('%Y-%m-%d %H:00:00', created_at) as hour,
        COUNT(*) as count,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
      FROM email_logs
      WHERE created_at >= ?
      GROUP BY hour
      ORDER BY hour ASC
    `).bind(startDateStr).all();

    const hourlyBreakdown = hourlyResult.results || [];

    // Get delivery rate
    const deliveryResult = await locals.runtime.env.DB.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN delivery_status = 'delivered' THEN 1 ELSE 0 END) as delivered,
        SUM(CASE WHEN delivery_status = 'bounced' THEN 1 ELSE 0 END) as bounced,
        SUM(CASE WHEN delivery_status = 'complained' THEN 1 ELSE 0 END) as complained
      FROM email_logs
      WHERE created_at >= ? AND status = 'sent'
    `).bind(startDateStr).first();

    const deliveryRate = deliveryResult?.total
      ? ((deliveryResult.delivered / deliveryResult.total) * 100).toFixed(2)
      : '0';

    return new Response(
      JSON.stringify({
        success: true,
        stats: {
          timeRange: `${hours} hours`,
          total: totalResult?.total || 0,
          sent: totalResult?.sent || 0,
          failed: totalResult?.failed || 0,
          queued: totalResult?.queued || 0,
          rate_limited: totalResult?.rate_limited || 0,
          statusCounts,
          triggerCounts,
          hourlyBreakdown,
          delivery: {
            total: deliveryResult?.total || 0,
            delivered: deliveryResult?.delivered || 0,
            bounced: deliveryResult?.bounced || 0,
            complained: deliveryResult?.complained || 0,
            rate: deliveryRate
          }
        }
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Email stats error:', error);
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
