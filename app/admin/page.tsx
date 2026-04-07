"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Users, Activity, CreditCard, Package, LogOut, Check, X, Edit 
} from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([
    { id: 1, name: 'Basic', return: '8%' },
    { id: 2, name: 'Advanced', return: '12%' },
    { id: 3, name: 'VIP Elite', return: '18%' }
  ]); // Tạm dùng state cho Gói nếu chưa có bảng packages trong DB
  const [isLoading, setIsLoading] = useState(true);

  // States cho Popup Sửa STK Khách hàng
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [newBankName, setNewBankName] = useState('');
  const [newBankAccount, setNewBankAccount] = useState('');

  // States cho Popup Sửa Gói
  const [isEditPackageOpen, setIsEditPackageOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any>(null);
  const [newReturn, setNewReturn] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    // Lấy danh sách user
    const { data: profiles } = await supabase.from('profiles').select('*');
    if (profiles) setUsers(profiles);

    // Lấy lịch sử giao dịch
    const { data: txs } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
    if (txs) setTransactions(txs);
    
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  // --- LOGIC DUYỆT / TỪ CHỐI RÚT TIỀN ---
  const handleApproveWithdrawal = async (tx: any) => {
    if (!confirm(`Xác nhận duyệt lệnh rút ${tx.amount.toLocaleString()} VND?`)) return;
    
    // 1. Trừ tiền trong profile (Vì khi đặt lệnh pending tiền vẫn còn trong số dư)
    const userToUpdate = users.find(u => u.id === tx.user_id);
    if (userToUpdate) {
        const newBalance = userToUpdate.balance - tx.amount;
        await supabase.from('profiles').update({ balance: newBalance }).eq('id', tx.user_id);
    }
    
    // 2. Cập nhật trạng thái giao dịch
    await supabase.from('transactions').update({ status: 'success' }).eq('id', tx.id);
    alert('Đã duyệt thành công!');
    loadData();
  };

  const handleRejectWithdrawal = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn TỪ CHỐI lệnh rút này?')) return;
    await supabase.from('transactions').update({ status: 'rejected' }).eq('id', id);
    alert('Đã từ chối lệnh rút!');
    loadData();
  };

  // --- LOGIC SỬA TÀI KHOẢN KHÁCH HÀNG ---
  const openEditUser = (user: any) => {
    setEditingUser(user);
    setNewBankName(user.bank_name || '');
    setNewBankAccount(user.bank_account || '');
    setIsEditUserOpen(true);
  };

  const saveUserBankInfo = async () => {
    await supabase.from('profiles').update({
      bank_name: newBankName,
      bank_account: newBankAccount
    }).eq('id', editingUser.id);
    alert('Cập nhật thông tin ngân hàng thành công!');
    setIsEditUserOpen(false);
    loadData();
  };

  // --- LOGIC SỬA GÓI ĐẦU TƯ ---
  const openEditPackage = (pkg: any) => {
    setEditingPackage(pkg);
    setNewReturn(pkg.return);
    setIsEditPackageOpen(true);
  };

  const savePackageInfo = () => {
    const updated = packages.map(p => p.id === editingPackage.id ? { ...p, return: newReturn } : p);
    setPackages(updated);
    // Nếu bạn có bảng 'packages' trên supabase thì gọi update tại đây
    alert('Cập nhật lợi nhuận gói thành công!');
    setIsEditPackageOpen(false);
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Đang tải dữ liệu...</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* SIDEBAR */}
      <div className="w-64 bg-slate-900 text-slate-300 flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-500" /> Admin Panel
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'users' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}>
            <Users className="w-5 h-5" /> Khách hàng
          </button>
          <button onClick={() => setActiveTab('packages')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'packages' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}>
            <Package className="w-5 h-5" /> Gói đầu tư
          </button>
          <button onClick={() => setActiveTab('withdrawals')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'withdrawals' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}>
            <CreditCard className="w-5 h-5" /> Nạp / Rút tiền
          </button>
          <button onClick={() => setActiveTab('transactions')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'transactions' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}>
            <Activity className="w-5 h-5" /> Lịch sử hệ thống
          </button>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-rose-500/10 hover:text-rose-500 transition-colors">
            <LogOut className="w-5 h-5" /> Đăng xuất
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 p-8 overflow-y-auto">
        <h2 className="text-2xl font-bold text-slate-800 mb-8 capitalize">
          Quản lý {activeTab === 'users' ? 'Khách hàng' : activeTab === 'packages' ? 'Gói đầu tư' : activeTab === 'withdrawals' ? 'Yêu cầu Nạp/Rút' : 'Lịch sử giao dịch'}
        </h2>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          
          {/* TAB: USERS */}
          {activeTab === 'users' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                  <th className="p-4 font-semibold">User ID</th>
                  <th className="p-4 font-semibold">Số dư (VNĐ)</th>
                  <th className="p-4 font-semibold">Ngân hàng</th>
                  <th className="p-4 font-semibold">Số tài khoản</th>
                  <th className="p-4 font-semibold">Hành động</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {users.map(u => (
                  <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-4 truncate max-w-[150px]">{u.id}</td>
                    <td className="p-4 font-bold text-blue-600">{u.balance?.toLocaleString('vi-VN')}</td>
                    <td className="p-4">{u.bank_name || 'Chưa LK'}</td>
                    <td className="p-4">{u.bank_account || 'Chưa LK'}</td>
                    <td className="p-4">
                      <button onClick={() => openEditUser(u)} className="flex items-center gap-1 text-blue-500 hover:text-blue-700 font-medium">
                        <Edit className="w-4 h-4" /> Sửa STK
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* TAB: PACKAGES */}
          {activeTab === 'packages' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                  <th className="p-4 font-semibold">Tên gói</th>
                  <th className="p-4 font-semibold">Lợi nhuận</th>
                  <th className="p-4 font-semibold">Hành động</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {packages.map(p => (
                  <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-4 font-bold text-slate-800">{p.name}</td>
                    <td className="p-4 font-bold text-emerald-500">{p.return}</td>
                    <td className="p-4">
                      <button onClick={() => openEditPackage(p)} className="flex items-center gap-1 text-blue-500 hover:text-blue-700 font-medium">
                        <Edit className="w-4 h-4" /> Sửa Lợi nhuận
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* TAB: WITHDRAWALS & DEPOSITS */}
          {activeTab === 'withdrawals' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                  <th className="p-4 font-semibold">User ID</th>
                  <th className="p-4 font-semibold">Loại</th>
                  <th className="p-4 font-semibold">Số tiền (VNĐ)</th>
                  <th className="p-4 font-semibold">Trạng thái</th>
                  <th className="p-4 font-semibold">Hành động</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {transactions.filter(t => t.type === 'rut_tien' || t.type === 'nap_tien').map(t => (
                  <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-4 truncate max-w-[150px]">{t.user_id}</td>
                    <td className="p-4 font-bold uppercase">{t.type === 'rut_tien' ? 'Rút tiền' : 'Nạp tiền'}</td>
                    <td className="p-4 font-bold">{t.amount?.toLocaleString('vi-VN')}</td>
                    <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${t.status === 'pending' ? 'bg-amber-100 text-amber-600' : t.status === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                            {t.status}
                        </span>
                    </td>
                    <td className="p-4 flex gap-2">
                      {t.status === 'pending' && t.type === 'rut_tien' && (
                        <>
                          <button onClick={() => handleApproveWithdrawal(t)} className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200">
                              <Check className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleRejectWithdrawal(t.id)} className="p-1.5 bg-rose-100 text-rose-600 rounded-lg hover:bg-rose-200">
                              <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* TAB: ALL TRANSACTIONS */}
          {activeTab === 'transactions' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                  <th className="p-4 font-semibold">ID Giao dịch</th>
                  <th className="p-4 font-semibold">User ID</th>
                  <th className="p-4 font-semibold">Loại</th>
                  <th className="p-4 font-semibold">Số tiền (VNĐ)</th>
                  <th className="p-4 font-semibold">Thời gian</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {transactions.map(t => (
                  <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-4 truncate max-w-[100px] text-slate-400">{t.id}</td>
                    <td className="p-4 truncate max-w-[150px]">{t.user_id}</td>
                    <td className="p-4 uppercase">{t.type}</td>
                    <td className="p-4 font-bold">{t.amount?.toLocaleString('vi-VN')}</td>
                    <td className="p-4 text-slate-500">{new Date(t.created_at).toLocaleString('vi-VN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

        </div>
      </div>

      {/* POPUP EDIT USER BANK */}
      {isEditUserOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-2xl w-full max-w-sm">
                <h3 className="font-bold text-lg mb-4">Sửa thông tin Ngân hàng</h3>
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Tên Ngân hàng</label>
                    <input type="text" value={newBankName} onChange={e => setNewBankName(e.target.value)} className="w-full border rounded-lg p-2" />
                </div>
                <div className="mb-6">
                    <label className="block text-sm font-medium mb-1">Số tài khoản</label>
                    <input type="text" value={newBankAccount} onChange={e => setNewBankAccount(e.target.value)} className="w-full border rounded-lg p-2" />
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setIsEditUserOpen(false)} className="flex-1 py-2 bg-slate-100 rounded-lg">Hủy</button>
                    <button onClick={saveUserBankInfo} className="flex-1 py-2 bg-blue-600 text-white rounded-lg">Lưu</button>
                </div>
            </div>
        </div>
      )}

      {/* POPUP EDIT PACKAGE */}
      {isEditPackageOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-2xl w-full max-w-sm">
                <h3 className="font-bold text-lg mb-4">Sửa Lợi nhuận: {editingPackage?.name}</h3>
                <div className="mb-6">
                    <label className="block text-sm font-medium mb-1">Lợi nhuận (%)</label>
                    <input type="text" value={newReturn} onChange={e => setNewReturn(e.target.value)} className="w-full border rounded-lg p-2" />
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setIsEditPackageOpen(false)} className="flex-1 py-2 bg-slate-100 rounded-lg">Hủy</button>
                    <button onClick={savePackageInfo} className="flex-1 py-2 bg-blue-600 text-white rounded-lg">Lưu</button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}