import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const API_BANK = "https://thueapibank.vn/historyapivpbankneov2/d33a5cde4962560a0138920f20d550df";

export async function GET() {
  // 1. LẤY BIẾN VÀ KIỂM TRA NGAY TẠI ĐÂY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.MY_SECRET_KEY;

  if (!supabaseUrl) {
    return NextResponse.json({ error: "LỖI: Vercel đang thiếu biến NEXT_PUBLIC_SUPABASE_URL" }, { status: 500 });
  }
  if (!supabaseKey) {
    return NextResponse.json({ error: "LỖI: Vercel đang thiếu biến SUPABASE_SERVICE_ROLE_KEY" }, { status: 500 });
  }

  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    // 2. Lấy đơn hàng pending
    const { data: pendingOrders, error: fetchError } = await supabaseAdmin
      .from('user_packages')
      .select('*')
      .eq('status', 'pending');

    if (fetchError) return NextResponse.json({ error: "Lỗi DB: " + fetchError.message }, { status: 500 });

    if (!pendingOrders || pendingOrders.length === 0) {
      return NextResponse.json({ message: "No pending orders." });
    }

    // 3. Gọi API ngân hàng
    const bankRes = await fetch(API_BANK);
    const bankData = await bankRes.json();
    const transactions = bankData.data || bankData.transactions || bankData.records || bankData || [];

    let updatedCount = 0;

    // 4. Đối soát
    for (const order of pendingOrders) {
      const targetContent = order.transfer_content?.toLowerCase().trim();
      if (!targetContent) continue;
      
      const matchedTx = transactions.find((tx: any) => {
        const txString = JSON.stringify(tx).toLowerCase();
        return txString.includes(targetContent);
      });

      if (matchedTx) {
        const paidAmount = Number(matchedTx.amount || matchedTx.creditAmount || matchedTx.sotien || 0);

        // Thực hiện cập nhật
        await Promise.all([
            supabaseAdmin.from('user_packages').update({ status: 'active', invested_amount: paidAmount }).eq('id', order.id),
            supabaseAdmin.from('profiles').update({ has_purchased_package: true }).eq('id', order.user_id),
            supabaseAdmin.rpc('distribute_commission', { p_buyer_id: order.user_id, p_amount: paidAmount })
        ]);

        updatedCount++;
      }
    }

    return NextResponse.json({ success: true, updated: updatedCount });

  } catch (error: any) {
    return NextResponse.json({ error: "Lỗi hệ thống: " + error.message }, { status: 500 });
  }
}