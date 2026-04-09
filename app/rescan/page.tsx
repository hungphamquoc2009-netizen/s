"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, RefreshCcw, CheckCircle2, AlertTriangle, ShieldCheck, History } from 'lucide-react';

export default function RescanPayments() {
    const [isProcessing, setIsProcessing] = useState(false);
    const [results, setResults] = useState<{msg: string, type: 'success' | 'error' | 'info'}[]>([]);
    const API_BANK = "https://thueapibank.vn/historyapivpbankneov2/d33a5cde4962560a0138920f20d550df";

    const addLog = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
        setResults(prev => [{ msg, type }, ...prev]);
    };

    const handleRescan = async () => {
        if (isProcessing) return;
        setIsProcessing(true);
        setResults([]);
        addLog("Bắt đầu quá trình quét lại toàn bộ đơn hàng Pending...", 'info');

        try {
            // 1. Lấy danh sách các gói đang trạng thái pending
            const { data: pendingOrders, error: fetchErr } = await supabase
                .from('user_packages')
                .select('*')
                .eq('status', 'pending');

            if (fetchErr) throw fetchErr;
            if (!pendingOrders || pendingOrders.length === 0) {
                addLog("Không có đơn hàng nào đang chờ xử lý.", 'success');
                setIsProcessing(false);
                return;
            }

            addLog(`Tìm thấy ${pendingOrders.length} đơn hàng đang chờ. Đang gọi API ngân hàng...`, 'info');

            // 2. Gọi API ngân hàng
            const res = await fetch(API_BANK);
            const bankData = await res.json();
            
            let transactionsArray = [];
            if (Array.isArray(bankData)) transactionsArray = bankData;
            else if (bankData.data) transactionsArray = bankData.data;
            else if (bankData.records) transactionsArray = bankData.records;

            // 3. Duyệt từng đơn pending để đối soát
            for (const order of pendingOrders) {
                const targetContent = order.transfer_content?.toLowerCase().trim();
                
                if (!targetContent) {
                    addLog(`Đơn hàng ${order.id.substring(0,8)} thiếu nội dung đối soát. Bỏ qua.`, 'error');
                    continue;
                }

                const matchedTx = transactionsArray.find((tx: any) => {
                    const txString = JSON.stringify(tx).toLowerCase();
                    return txString.includes(targetContent);
                });

                if (matchedTx) {
                    addLog(`Khớp giao dịch! Đang kích hoạt gói cho User ID: ${order.user_id.substring(0,8)}`, 'success');
                    
                    const paidAmount = Number(matchedTx.amount || matchedTx.creditAmount || matchedTx.sotien || 0);

                    // Cập nhật Profile
                    await supabase.from('profiles').update({ has_purchased_package: true }).eq('id', order.user_id);

                    // Kích hoạt gói
                    const { error: updateErr } = await supabase
                        .from('user_packages')
                        .update({ status: 'active', invested_amount: paidAmount })
                        .eq('id', order.id);

                    if (!updateErr) {
                        // Gọi hàm chia hoa hồng
                        await supabase.rpc('distribute_commission', { 
                            p_buyer_id: order.user_id, 
                            p_amount: paidAmount 
                        });
                        addLog(`Đã kích hoạt và chia hoa hồng thành công cho đơn: ${targetContent}`, 'success');
                    }
                } else {
                    addLog(`Đơn hàng "${targetContent}" vẫn chưa thấy tiền vào ngân hàng.`, 'info');
                }
            }

            addLog("Hoàn tất quá trình quét lại.", 'success');

        } catch (error: any) {
            addLog(`Lỗi hệ thống: ${error.message}`, 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8 font-sans">
            <div className="max-w-3xl mx-auto">
                <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
                    <div className="bg-slate-900 p-8 text-white">
                        <div className="flex items-center gap-3 mb-2">
                            <ShieldCheck className="w-8 h-8 text-blue-400" />
                            <h1 className="text-2xl font-bold">Hệ thống Đối soát Thanh toán</h1>
                        </div>
                        <p className="text-slate-400 text-sm italic">
                            Chức năng này sẽ quét tất cả các đơn hàng "Pending" và kiểm tra lại lịch sử ngân hàng để kích hoạt bù nếu bị sót.
                        </p>
                    </div>

                    <div className="p-8">
                        <button 
                            onClick={handleRescan}
                            disabled={isProcessing}
                            className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all ${
                                isProcessing 
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200 active:scale-[0.98]'
                            }`}
                        >
                            {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : <RefreshCcw className="w-6 h-6" />}
                            {isProcessing ? 'Đang quét lại...' : 'Bắt đầu Quét lại & Kích hoạt bù'}
                        </button>

                        <div className="mt-8">
                            <div className="flex items-center gap-2 mb-4 text-slate-600 font-bold border-b pb-2">
                                <History className="w-5 h-5" />
                                Nhật ký xử lý
                            </div>
                            
                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {results.length === 0 && (
                                    <div className="text-center py-10 text-slate-400 italic">
                                        Chưa có nhật ký nào. Nhấn nút phía trên để bắt đầu.
                                    </div>
                                )}
                                {results.map((res, i) => (
                                    <div key={i} className={`p-4 rounded-xl text-sm font-medium flex items-start gap-3 border animate-in slide-in-from-left-2 duration-300 ${
                                        res.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                        res.type === 'error' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                        'bg-blue-50 text-blue-700 border-blue-100'
                                    }`}>
                                        {res.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : 
                                         res.type === 'error' ? <AlertTriangle className="w-5 h-5 shrink-0" /> : 
                                         <Loader2 className="w-5 h-5 shrink-0" />}
                                        {res.msg}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}