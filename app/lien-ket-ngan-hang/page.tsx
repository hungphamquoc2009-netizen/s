"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Building2, CreditCard, ArrowLeft, 
  ShieldCheck, Loader2, CheckCircle2 
} from 'lucide-react';

const POPULAR_BANKS = [
  "Vietcombank (VCB)",
  "Techcombank (TCB)",
  "MBBank (MB)",
  "VPBank (VPB)",
  "ACB",
  "BIDV",
  "VietinBank (CTG)",
  "Sacombank (STB)",
  "TPBank (TPB)",
  "VIB",
  "HDBank (HDB)",
  "Agribank",
  "Khác (Nhập tên thủ công)"
];

export default function LinkBankPage() {
  const [userId, setUserId] = useState<string>('');
  const [bankName, setBankName] = useState<string>('');
  const [customBankName, setCustomBankName] = useState<string>('');
  const [bankAccount, setBankAccount] = useState<string>('');
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const fetchCurrentBankInfo = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        window.location.href = '/login';
        return;
      }

      setUserId(session.user.id);

      // Lấy thông tin ngân hàng hiện tại nếu đã liên kết
      const { data: profile } = await supabase
        .from('profiles')
        .select('bank_name, bank_account')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        if (profile.bank_account) setBankAccount(profile.bank_account);
        
        if (profile.bank_name) {
          // Kiểm tra xem tên ngân hàng có trong list có sẵn không
          if (POPULAR_BANKS.includes(profile.bank_name)) {
            setBankName(profile.bank_name);
          } else {
            setBankName("Khác (Nhập tên thủ công)");
            setCustomBankName(profile.bank_name);
          }
        } else {
          setBankName(POPULAR_BANKS[0]); // Mặc định chọn Vietcombank
        }
      }
      setIsLoading(false);
    };

    fetchCurrentBankInfo();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    const finalBankName = bankName === "Khác (Nhập tên thủ công)" ? customBankName : bankName;

    if (!finalBankName.trim()) {
      setMessage({ text: 'Vui lòng nhập tên ngân hàng!', type: 'error' });
      setIsSaving(false);
      return;
    }

    if (!bankAccount.trim()) {
      setMessage({ text: 'Vui lòng nhập số tài khoản!', type: 'error' });
      setIsSaving(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          bank_name: finalBankName, 
          bank_account: bankAccount 
        })
        .eq('id', userId);

      if (error) throw error;

      setMessage({ text: 'Liên kết ngân hàng thành công! Đang quay lại...', type: 'success' });
      
      // Chuyển hướng về trang chủ sau 1.5 giây
      setTimeout(() => {
        window.location.href = 'dashboard'; // Hoặc '/dashboard' tùy vào đường dẫn trang chủ của bạn
      }, 1500);

    } catch (err: any) {
      setMessage({ text: err.message || 'Có lỗi xảy ra khi lưu thông tin.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F7FB] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1E6EFF]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex items-center justify-center p-4 font-sans text-slate-800">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-900 p-6 text-white relative">
          <button 
            onClick={() => window.history.back()} 
            className="absolute top-6 left-4 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex justify-center mb-4 mt-2">
            <div className="p-3 bg-white/10 rounded-full">
              <ShieldCheck className="w-10 h-10 text-emerald-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center">Liên kết Ngân hàng</h2>
          <p className="text-center text-slate-400 text-sm mt-2">
            Thông tin này được sử dụng để nhận tiền rút từ hệ thống.
          </p>
        </div>

        {/* Form */}
        <div className="p-6 md:p-8">
          <form onSubmit={handleSave} className="space-y-6">
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#1E6EFF]" /> Tên Ngân hàng
              </label>
              <select 
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3.5 focus:outline-none focus:ring-2 focus:ring-[#1E6EFF] transition-all font-medium text-slate-700"
              >
                {POPULAR_BANKS.map((bank) => (
                  <option key={bank} value={bank}>{bank}</option>
                ))}
              </select>
            </div>

            {/* Hiển thị ô nhập tay nếu chọn "Khác" */}
            {bankName === "Khác (Nhập tên thủ công)" && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                <label className="block text-sm font-bold text-slate-700 mb-2">Nhập tên Ngân hàng của bạn</label>
                <input 
                  type="text" 
                  value={customBankName}
                  onChange={(e) => setCustomBankName(e.target.value)}
                  placeholder="VD: OceanBank"
                  className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3.5 focus:outline-none focus:ring-2 focus:ring-[#1E6EFF] transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#1E6EFF]" /> Số Tài Khoản
              </label>
              <input 
                type="text" 
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                placeholder="Nhập số tài khoản nhận tiền..."
                className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3.5 focus:outline-none focus:ring-2 focus:ring-[#1E6EFF] transition-all font-bold text-slate-800 tracking-wide"
              />
            </div>

            {/* Cảnh báo bảo mật */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 font-medium leading-relaxed">
                Vui lòng kiểm tra kỹ thông tin trước khi lưu. Hệ thống sẽ tự động chuyển tiền rút về số tài khoản này.
              </p>
            </div>

            {/* Thông báo lỗi / thành công */}
            {message && (
              <div className={`p-4 rounded-xl text-sm font-bold flex items-center gap-2 ${
                message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
              }`}>
                {message.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
                {message.text}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isSaving}
              className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 hover:-translate-y-0.5 transition-all disabled:opacity-70 flex justify-center items-center gap-2"
            >
              {isSaving ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Đang lưu...</>
              ) : (
                'Lưu Thông Tin Ngân Hàng'
              )}
            </button>

          </form>
        </div>

      </div>
    </div>
  );
}