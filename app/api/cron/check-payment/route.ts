import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cấu hình Supabase với Service Role Key để có quyền ghi (vì chạy ngầm ko có session user)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

const API_BANK = "https://thueapibank.vn/historyapivpbankneov2/d33a5cde4962560a0138920f20d550df";

export async function GET() {
  try {
    // 1. Lấy danh sách các đơn hàng đang chờ (pending) trong 24h qua
    const { data: pendingOrders } = await supabaseAdmin
      .from('user_packages')
      .select('*')
      .eq('status', 'pending');

    if (!pendingOrders || pendingOrders.length === 0) {
      return NextResponse.json({ message: "No pending orders." });
    }

    // 2. Lấy lịch sử giao dịch từ ngân hàng
    const res = await fetch(API_BANK);
    const bankData = await res.json();
    const transactions = bankData.data || bankData.transactions || bankData.records || bankData || [];

    let updatedCount = 0;

    // 3. Đối soát
    for (const order of pendingOrders) {
      const targetContent = order.transfer_content.toLowerCase().trim();
      
      const matchedTx = transactions.find((tx: any) => {
        const txString = JSON.stringify(tx).toLowerCase();
        return txString.includes(targetContent);
      });

      if (matchedTx) {
        const paidAmount = Number(matchedTx.amount || matchedTx.creditAmount || matchedTx.sotien || 0);

        // Cập nhật Database: Kích hoạt gói và Profile
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}