import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/rbac';

export async function GET() {
  try {
    const isUserAdmin = await isAdmin();
    if (!isUserAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // 1. Fetch Total Revenue
    const { data: revenueData, error: revError } = await supabase
      .from('orders')
      .select('final_amount')
      .eq('payment_status', 'paid');
    
    if (revError) throw revError;
    const totalRevenue = revenueData?.reduce((acc, curr) => acc + Number(curr.final_amount), 0) || 0;

    // 2. Fetch Active Users (Total Profiles)
    const { count: userCount, error: userError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    if (userError) throw userError;

    // 3. Fetch Total Orders
    const { count: orderCount, error: orderError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });
    
    if (orderError) throw orderError;

    // 4. Fetch Recent Orders with Profile info
    const { data: recentOrders, error: recentError } = await supabase
      .from('orders')
      .select(`
        id,
        final_amount,
        created_at,
        profiles:user_id (full_name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (recentError) throw recentError;

    // 5. Aggregate Sales by Day (Last 7 Days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: chartData, error: chartError } = await supabase
      .from('orders')
      .select('final_amount, created_at')
      .eq('payment_status', 'paid')
      .gte('created_at', sevenDaysAgo.toISOString());

    if (chartError) throw chartError;

    // Process chart data
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dailyStats = days.map(day => ({ name: day, sales: 0 }));

    chartData?.forEach(order => {
      const dayIndex = new Date(order.created_at).getDay();
      dailyStats[dayIndex].sales += Number(order.final_amount);
    });

    // Reorder to start from 7 days ago
    const today = new Date().getDay();
    const orderedStats = [];
    for (let i = 1; i <= 7; i++) {
      const index = (today - 7 + i + 7) % 7;
      orderedStats.push(dailyStats[index]);
    }

    return NextResponse.json({
      stats: {
        totalRevenue,
        activeUsers: userCount || 0,
        totalOrders: orderCount || 0,
        conversionRate: 3.42, // Still mocked as it requires session tracking
      },
      recentOrders: recentOrders || [],
      chartData: orderedStats,
    });
  } catch (error) {
    console.error('Admin analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
