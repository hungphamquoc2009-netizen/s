"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, RefreshCcw, CheckCircle2, AlertTriangle, ShieldCheck, History, Search, Check } from 'lucide-react';

export default function RescanPayments() {
    const [isProcessing, setIsProcessing] = useState(false);
    const [pendingOrders, setPendingOrders] = useState<any[]>([]);
    const [results, setResults] = useState<{msg: string, type: 'success' | 'error' | 'info'}[]>([]);
    const API_BANK = "https://thueapibank.vn/historyapivpbankneov2/d33a5cde4962560a0138920f20d550df";

    const addLog = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
        setResults(prev => [{ msg, type }, ...prev]);
    };

    // Tải danh sách đơn pending khi vào trang
    const loadPending = async () => {
        const { data } = await supabase.from('user_packages').select('*').eq('status', 'pending').order('purchased_at', { ascending: false });
        if (data) setPendingOrders(data);
    };

    useEffect(() => { loadPending(); }, []);

    // HÀM 1: QUÉT TỰ ĐỘNG THEO NGÂN HÀNG
    const handleRescan = async () => {
        if (isProcessing) return;
        setIsProcessing(true);
        setResults([]);
        addLog("Bắt đầu đối soát tự động với ngân hàng...", 'info');

        try {
            if (pendingOrders.length === 0) {
                addLog("Không có đơn hàng nào đang chờ.", 'success');
                setIsProcessing(false);
                return;
            }

            const res = await fetch(API_BANK);
            const bankData = await res.json();
            let transactionsArray = Array.isArray(bankData) ? bankData : (bankData.data || bankData.records || []);

            for (const order of pendingOrders) {
                const targetContent = order.transfer_content?.toLowerCase().trim();
                if (!targetContent) continue;

                const matchedTx = transactionsArray.find((tx: any) => JSON.stringify(tx).toLowerCase().includes(targetContent));

                if (matchedTx) {
                    await processActivate(order, Number(matchedTx.amount || matchedTx.creditAmount || 0), "Tự động");
                }
            }
            addLog("Đã quét xong lịch sử ngân hàng.", 'info');
            loadPending();
        } catch (error: any) {
            addLog(`Lỗi: ${error.message}`, 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    // HÀM 2: DUYỆT ÉP (DÀNH CHO ĐƠN BỊ SÓT HOẶC SAI NỘI DUNG)
    const handleManualApprove = async (order: any) => {
        const amount = prompt(`Xác nhận duyệt tay cho đơn này?\nNhập số tiền đã nhận (VNĐ):`, order.invested_amount);
        if (amount === null) return;
        
        setIsProcessing(true);
        await processActivate(order, parseInt(amount), "Thủ công");
        setIsProcessing(false);
        loadPending();
    };

    // LOGIC KÍCH HOẠT CHUNG
    const processActivate = async (order: any, amount: number, method: string) => {
        try {
            // 1. Cập nhật Profile
            await supabase.from('profiles').update({ has_purchased_package: true }).eq('id', order.user_id);

            // 2. Kích hoạt gói
            const { error: updateErr } = await supabase
                .from('user_packages')
                .update({ status: 'active', invested_amount: amount })
                .eq('id', order.id);

            if (!updateErr) {
                // 3. Chia hoa hồng (Gọi RPC)
                const { error: rpcErr } = await supabase.rpc('distribute_commission', { 
                    p_buyer_id: order.user_id, 
                    p_amount: amount 
                });
                
                if (rpcErr) {
                    addLog(`Gói đã kích hoạt nhưng LỖI CHIA HOA HỒNG: ${rpcErr.message}`, 'error');
                } else {
                    addLog(`[${method}] Đã bù đơn thành công cho User: ${order.user_id.substring(0,6)}`, 'success');
                }
            }
        } catch (err: any) {
            addLog(`Lỗi xử lý: ${err.message}`, 'error');
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans">
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
                    <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
                        <div>
                            <h1 className="text-xl font-bold flex items-center gap-2">
                                <ShieldCheck className="text-blue-400" /> Quản lý Đối soát & Bù đơn
                            </h1>
                            <p className="text-slate-400 text-xs mt-1">Tìm thấy {pendingOrders.length} đơn chưa xử lý</p>
                        </div>
                        <button onClick={handleRescan} disabled={isProcessing} className="bg-blue-600 hover:bg-blue-700 px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50">
                            {isProcessing ? <Loader2 className="animate-spin w-4 h-4" /> : <RefreshCcw className="w-4 h-4" />} Quét Ngân Hàng
                        </button>
                    </div>

                    <div className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* CỘT TRÁI: DANH SÁCH ĐƠN CHỜ */}
                            <div>
                                <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2 uppercase text-xs tracking-wider">
                                    <Search className="w-4 h-4" /> Đơn hàng đang treo (Pending)
                                </h3>
                                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                    {pendingOrders.length === 0 ? (
                                        <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400">
                                            Không có đơn hàng nào cần bù.
                                        </div>
                                    ) : (
                                        pendingOrders.map(order => (
                                            <div key={order.id} className="p-4 bg-white border border-slate-200 rounded-2xl hover:border-blue-300 transition-all shadow-sm group">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <div className="font-black text-slate-800">{order.package_name}</div>
                                                        <div className="text-xs text-blue-600 font-mono font-bold mt-1 bg-blue-50 px-2 py-0.5 rounded inline-block">
                                                            Nội dung: {order.transfer_content || 'TRỐNG'}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 mt-2">ID: {order.user_id}</div>
                                                    </div>
                                                    <button 
                                                        onClick={() => handleManualApprove(order)}
                                                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-black shadow-lg shadow-emerald-200 transition-all active:scale-95"
                                                    >
                                                        DUYỆT TAY
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* CỘT PHẢI: NHẬT KÝ */}
                            <div>
                                <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2 uppercase text-xs tracking-wider">
                                    <History className="w-4 h-4" /> Nhật ký bù đơn
                                </h3>
                                <div className="bg-slate-900 rounded-2xl p-4 h-[500px] overflow-y-auto font-mono text-[11px] space-y-2 custom-scrollbar">
                                    {results.length === 0 && <div className="text-slate-600 italic">Hệ thống sẵn sàng...</div>}
                                    {results.map((res, i) => (
                                        <div key={i} className={`${res.type === 'success' ? 'text-emerald-400' : res.type === 'error' ? 'text-rose-400' : 'text-blue-400'}`}>
                                            [{new Date().toLocaleTimeString()}] {res.msg}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}