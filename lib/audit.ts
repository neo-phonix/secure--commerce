import { createClient } from '@/lib/supabase/server';

export async function logAction(
  action: string,
  resourceType: string,
  resourceId?: string,
  userId?: string,
  details: any = {},
  severity: 'low' | 'medium' | 'high' | 'critical' = 'low'
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase.from('audit_logs').insert({
      user_id: userId || user?.id || null,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      severity,
      details,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to log action:', error);
  }
}
