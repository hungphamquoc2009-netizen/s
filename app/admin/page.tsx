"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Users, Activity, CreditCard, Package, LogOut, Check, X, Edit, EyeOff, Plus, ArrowDownToLine, ArrowUpFromLine, Clock, LayoutDashboard,
  MoreVertical, ChevronUp, ChevronDown, Gift, Trash2
} from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([
    { id: 1, name: 'Basic', return: '8%', limits: '5M - 50M', duration: '6 Months' },
    { id: 2, name: 'Advanced', return: '12%', limits: '50M - 200M', duration: '12 Months' },
    { id: 3, name: 'VIP Elite', return: '18%', limits: '200M+', duration: '24 Months' }
  ]);
  const [isLoading, setIsLoading] = useState(true);

  // States cho Popup Sửa/Thêm Khách hàng & Gói
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [newBankName, setNewBankName] = useState('');
  const [newBankAccount, setNewBankAccount] = useState('');

  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any>(null);
  const [pkgForm, setPkgForm] = useState({ name: '', return: '', limits: '', duration: '' });

  // States cho Tab Users (Sắp xếp và Dropdown)
  const [sortConfig, setSortConfig] = useState<{ key: 'totalDeposit' | 'totalWithdrawal', direction: 'asc' | 'desc' } | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
        // Lấy danh sách user (Đảm bảo RLS trên Supabase cho phép)
        const { data: profiles, error: profileError } = await supabase.from('profiles').select('*');
        if (profileError) {
            console.error("Lỗi lấy danh sách user:", profileError);
        } else if (profiles) {
            setUsers(profiles);
        }

        // Lấy lịch sử giao dịch
        const { data: txs, error: txError } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
        if (txError) {
            console.error("Lỗi lấy giao dịch:", txError);
        } else if (txs) {
            setTransactions(txs);
        }
    } catch (err) {
        console.error("Lỗi hệ thống:", err);
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  // --- LOGIC 3 NÚT DUYỆT RÚT TIỀN ---
  const handleApproveWithdrawal = async (tx: any) => {
    if (!confirm(`Xác nhận DUYỆT lệnh rút ${tx.amount.toLocaleString()} VND?`)) return;
    
    const userToUpdate = users.find(u => u.id === tx.user_id);
    if (userToUpdate) {
        const newBalance = userToUpdate.balance - tx.amount;
        await supabase.from('profiles').update({ balance: newBalance }).eq('id', tx.user_id);
    }
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

  const handleSuspendWithdrawal = async (id: string) => {
    if (!confirm('Bạn có chắc muốn TREO lệnh này? (Lệnh sẽ bị ẩn khỏi danh sách chờ nhưng khách không biết)')) return;
    // Chuyển status thành 'treo' để lọc ẩn đi ở trang admin
    await supabase.from('transactions').update({ status: 'treo' }).eq('id', id);
    alert('Đã đưa lệnh rút vào trạng thái treo!');
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

  // --- LOGIC THÊM & SỬA GÓI ĐẦU TƯ ---
  const openAddPackage = () => {
    setEditingPackage(null);
    setPkgForm({ name: '', return: '', limits: '', duration: '' });
    setIsPackageModalOpen(true);
  };

  const openEditPackage = (pkg: any) => {
    setEditingPackage(pkg);
    setPkgForm({ name: pkg.name, return: pkg.return, limits: pkg.limits, duration: pkg.duration });
    setIsPackageModalOpen(true);
  };

  const savePackageInfo = () => {
    if (editingPackage) {
        // Cập nhật gói cũ
        const updated = packages.map(p => p.id === editingPackage.id ? { ...p, ...pkgForm } : p);
        setPackages(updated);
        alert('Cập nhật chi tiết gói thành công!');
    } else {
        // Thêm gói mới
        const newPkg = { id: Date.now(), ...pkgForm };
        setPackages([...packages, newPkg]);
        alert('Đã thêm gói đầu tư mới!');
    }
    // Nếu có DB packages thật, hãy thêm logic supabase.from('packages').upsert(...) ở đây
    setIsPackageModalOpen(false);
  };

  const handleDeletePackage = (id: number) => {
    if (confirm('Bạn có chắc chắn muốn xóa gói đầu tư này không?')) {
        const updatedPackages = packages.filter(p => p.id !== id);
        setPackages(updatedPackages);
        alert('Đã xóa gói đầu tư!');
    }
  };

  // --- TÍNH TOÁN THỐNG KÊ TỔNG QUAN ---
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overviewStats = transactions.reduce((acc, tx) => {
      if (tx.status === 'success') {
          const txDate = new Date(tx.created_at);
          const isToday = txDate >= today;
          
          if (tx.type === 'nap_tien') {
              acc.totalDeposits += tx.amount || 0;
              if (isToday) acc.todayDeposits += tx.amount || 0;
          } else if (tx.type === 'rut_tien') {
              acc.totalWithdrawals += tx.amount || 0;
              if (isToday) acc.todayWithdrawals += tx.amount || 0;
          }
      }
      return acc;
  }, { todayDeposits: 0, todayWithdrawals: 0, totalDeposits: 0, totalWithdrawals: 0 });

  // --- TÍNH TOÁN DỮ LIỆU USER CHO TAB KHÁCH HÀNG ---
  const handleSort = (key: 'totalDeposit' | 'totalWithdrawal') => {
    let direction: 'asc' | 'desc' = 'desc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
        direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const processedUsers = users.map(u => {
      const userTxs = transactions.filter(t => t.user_id === u.id && t.status === 'success');
      const totalDeposit = userTxs.filter(t => t.type === 'nap_tien').reduce((sum, t) => sum + (t.amount || 0), 0);
      const totalWithdrawal = userTxs.filter(t => t.type === 'rut_tien').reduce((sum, t) => sum + (t.amount || 0), 0);
      return {
          ...u,
          totalDeposit,
          totalWithdrawal,
          hasDeposited: totalDeposit > 0
      };
  });

  if (sortConfig !== null) {
      processedUsers.sort((a, b) => {
          if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
          if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
      });
  }

  if (isLoading) return <div className="min-h-screen flex items-center justify-center font-semibold text-slate-500">Đang tải dữ liệu hệ thống...</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* SIDEBAR */}
      <div className="w-64 bg-slate-900 text-slate-300 flex flex-col shadow-xl z-10">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-500" /> Admin Panel
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-2">Quản lý chung</p>
          <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'overview' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'hover:bg-slate-800'}`}>
            <LayoutDashboard className="w-5 h-5" /> Tổng quan
          </button>
          <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'users' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'hover:bg-slate-800'}`}>
            <Users className="w-5 h-5" /> Khách hàng
          </button>
          <button onClick={() => setActiveTab('packages')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'packages' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'hover:bg-slate-800'}`}>
            <Package className="w-5 h-5" /> Gói đầu tư
          </button>

          <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-6">Giao dịch</p>
          <button onClick={() => setActiveTab('approvals')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'approvals' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'hover:bg-slate-800'}`}>
            <Clock className="w-5 h-5" /> Duyệt Rút tiền
          </button>
          <button onClick={() => setActiveTab('deposits')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'deposits' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'hover:bg-slate-800'}`}>
            <ArrowDownToLine className="w-5 h-5" /> Lịch sử Nạp
          </button>
          <button onClick={() => setActiveTab('withdrawals')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'withdrawals' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'hover:bg-slate-800'}`}>
            <ArrowUpFromLine className="w-5 h-5" /> Lịch sử Rút
          </button>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-rose-500/10 hover:text-rose-500 transition-colors font-medium">
            <LogOut className="w-5 h-5" /> Đăng xuất
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 p-8 overflow-y-auto bg-[#F5F7FB]">
        <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-slate-800 capitalize">
            {activeTab === 'overview' && 'Tổng quan hệ thống'}
            {activeTab === 'users' && 'Danh sách Khách hàng'}
            {activeTab === 'packages' && 'Cấu hình Gói đầu tư'}
            {activeTab === 'approvals' && 'Yêu cầu Rút tiền đang chờ'}
            {activeTab === 'deposits' && 'Lịch sử Nạp tiền'}
            {activeTab === 'withdrawals' && 'Lịch sử Rút tiền'}
            </h2>
            
            {activeTab === 'packages' && (
                <button onClick={openAddPackage} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all">
                    <Plus className="w-5 h-5" /> Thêm Gói Mới
                </button>
            )}
        </div>

        {/* TAB: OVERVIEW */}
        {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <p className="text-sm font-bold text-slate-500 uppercase">Khách Nạp Hôm Nay</p>
                    <h3 className="text-2xl font-black text-emerald-600 mt-2">+{overviewStats.todayDeposits.toLocaleString('vi-VN')} ₫</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <p className="text-sm font-bold text-slate-500 uppercase">Khách Rút Hôm Nay</p>
                    <h3 className="text-2xl font-black text-rose-600 mt-2">-{overviewStats.todayWithdrawals.toLocaleString('vi-VN')} ₫</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <p className="text-sm font-bold text-slate-500 uppercase">Tổng Nạp (All Time)</p>
                    <h3 className="text-2xl font-black text-emerald-600 mt-2">+{overviewStats.totalDeposits.toLocaleString('vi-VN')} ₫</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <p className="text-sm font-bold text-slate-500 uppercase">Tổng Rút (All Time)</p>
                    <h3 className="text-2xl font-black text-rose-600 mt-2">-{overviewStats.totalWithdrawals.toLocaleString('vi-VN')} ₫</h3>
                </div>
            </div>
        )}

        {/* TABLES AREA */}
        {activeTab !== 'overview' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-visible">
          
          {/* TAB: USERS */}
          {activeTab === 'users' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                  <th className="p-4 font-semibold">Email đăng ký</th>
                  <th className="p-4 font-semibold text-center">Phân loại</th>
                  <th className="p-4 font-semibold">
                      <button onClick={() => handleSort('totalDeposit')} className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                          Tổng nạp
                          {sortConfig?.key === 'totalDeposit' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>) : <ChevronDown className="w-4 h-4 opacity-30"/>}
                      </button>
                  </th>
                  <th className="p-4 font-semibold">
                      <button onClick={() => handleSort('totalWithdrawal')} className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                          Tổng rút
                          {sortConfig?.key === 'totalWithdrawal' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>) : <ChevronDown className="w-4 h-4 opacity-30"/>}
                      </button>
                  </th>
                  <th className="p-4 font-semibold">Số dư hiện tại</th>
                  <th className="p-4 font-semibold text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {processedUsers.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-500">Chưa có khách hàng nào.</td></tr>}
                {processedUsers.map(u => (
                  <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-medium text-slate-700">
                        {u.email || u.id.substring(0, 8) + '...'}
                        <div className="text-xs text-slate-400 font-normal mt-1">Gia nhập: {u.created_at ? new Date(u.created_at).toLocaleDateString('vi-VN') : '-'}</div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${u.hasDeposited ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                         {u.hasDeposited ? 'Đã nạp' : 'Chưa nạp'}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-emerald-600">+{u.totalDeposit.toLocaleString('vi-VN')} ₫</td>
                    <td className="p-4 font-bold text-rose-600">-{u.totalWithdrawal.toLocaleString('vi-VN')} ₫</td>
                    <td className="p-4 font-bold text-blue-600">{u.balance?.toLocaleString('vi-VN')} ₫</td>
                    <td className="p-4 text-center relative">
                        <button 
                            onClick={() => setOpenDropdownId(openDropdownId === u.id ? null : u.id)} 
                            className="inline-flex items-center justify-center p-2 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                        >
                            <MoreVertical className="w-5 h-5" />
                        </button>

                        {/* Dropdown Menu */}
                        {openDropdownId === u.id && (
                            <>
                                {/* Overlay để đóng menu khi click ra ngoài */}
                                <div className="fixed inset-0 z-10" onClick={() => setOpenDropdownId(null)}></div>
                                
                                <div className="absolute right-8 top-10 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden py-1">
                                    <button 
                                        onClick={() => { openEditUser(u); setOpenDropdownId(null); }} 
                                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 flex items-center gap-3 text-slate-700 font-medium transition-colors"
                                    >
                                        <Edit className="w-4 h-4 text-slate-400"/> Sửa thông tin tài khoản
                                    </button>
                                    <div className="h-px bg-slate-100 my-1"></div>
                                    <button 
                                        onClick={() => { alert('Tính năng tặng gói'); setOpenDropdownId(null); }} 
                                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 flex items-center gap-3 text-blue-600 font-medium transition-colors"
                                    >
                                        <Gift className="w-4 h-4"/> Tặng gói thủ công
                                    </button>
                                </div>
                            </>
                        )}
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
                  <th className="p-4 font-semibold">Mức giá</th>
                  <th className="p-4 font-semibold">Thời gian</th>
                  <th className="p-4 font-semibold text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {packages.map(p => (
                  <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-bold text-slate-800">{p.name}</td>
                    <td className="p-4 font-bold text-emerald-500">{p.return}</td>
                    <td className="p-4 text-slate-600 font-medium">{p.limits}</td>
                    <td className="p-4 text-slate-600">{p.duration}</td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-2">
                          <button onClick={() => openEditPackage(p)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium transition-colors">
                            <Edit className="w-4 h-4" /> Chỉnh sửa
                          </button>
                          <button onClick={() => handleDeletePackage(p.id)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 font-medium transition-colors">
                            <Trash2 className="w-4 h-4" /> Xóa
                          </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* TAB: APPROVALS (DUYỆT RÚT TIỀN) */}
          {activeTab === 'approvals' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                  <th className="p-4 font-semibold">User ID</th>
                  <th className="p-4 font-semibold">Thông tin STK nhận</th>
                  <th className="p-4 font-semibold text-rose-600">Số tiền rút (VNĐ)</th>
                  <th className="p-4 font-semibold text-center">Hành động xử lý</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {transactions.filter(t => t.type === 'rut_tien' && t.status === 'pending').length === 0 && (
                    <tr><td colSpan={4} className="p-8 text-center text-slate-500 font-medium">Không có lệnh rút tiền nào đang chờ duyệt.</td></tr>
                )}
                {transactions.filter(t => t.type === 'rut_tien' && t.status === 'pending').map(t => (
                  <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-4 truncate max-w-[150px] font-medium text-slate-500">{t.user_id}</td>
                    <td className="p-4">
                        <div className="font-bold text-slate-800">{t.bank_name || 'Không rõ NH'}</div>
                        <div className="text-slate-500">{t.bank_account || 'Không có STK'}</div>
                    </td>
                    <td className="p-4 font-extrabold text-rose-600 text-base">{t.amount?.toLocaleString('vi-VN')} ₫</td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                          <button onClick={() => handleApproveWithdrawal(t)} title="Duyệt thành công" className="flex items-center gap-1 px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 font-bold transition-colors">
                              <Check className="w-4 h-4" /> Duyệt
                          </button>
                          <button onClick={() => handleRejectWithdrawal(t.id)} title="Từ chối lệnh" className="flex items-center gap-1 px-3 py-2 bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200 font-bold transition-colors">
                              <X className="w-4 h-4" /> Từ chối
                          </button>
                          <button onClick={() => handleSuspendWithdrawal(t.id)} title="Treo lệnh (Ẩn đi)" className="flex items-center gap-1 px-3 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 font-bold transition-colors">
                              <EyeOff className="w-4 h-4" /> Treo
                          </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* TAB: DEPOSIT HISTORY */}
          {activeTab === 'deposits' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                  <th className="p-4 font-semibold">User ID</th>
                  <th className="p-4 font-semibold text-blue-600">Số tiền nạp (VNĐ)</th>
                  <th className="p-4 font-semibold">Thời gian</th>
                  <th className="p-4 font-semibold">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {transactions.filter(t => t.type === 'nap_tien').map(t => (
                  <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-4 truncate max-w-[200px] text-slate-500">{t.user_id}</td>
                    <td className="p-4 font-bold text-blue-600">+{t.amount?.toLocaleString('vi-VN')} ₫</td>
                    <td className="p-4 text-slate-500">{new Date(t.created_at).toLocaleString('vi-VN')}</td>
                    <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${t.status === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                            {t.status === 'success' ? 'Thành công' : t.status}
                        </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* TAB: WITHDRAWAL HISTORY (Đã xử lý) */}
          {activeTab === 'withdrawals' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                  <th className="p-4 font-semibold">User ID</th>
                  <th className="p-4 font-semibold">Thông tin Nhận</th>
                  <th className="p-4 font-semibold text-rose-600">Số tiền rút (VNĐ)</th>
                  <th className="p-4 font-semibold">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {transactions.filter(t => t.type === 'rut_tien' && t.status !== 'pending').map(t => (
                  <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-4 truncate max-w-[150px] text-slate-500">{t.user_id}</td>
                    <td className="p-4">
                        <div className="font-bold text-slate-700">{t.bank_name || '-'}</div>
                        <div className="text-slate-500">{t.bank_account || '-'}</div>
                    </td>
                    <td className="p-4 font-bold text-rose-600">-{t.amount?.toLocaleString('vi-VN')} ₫</td>
                    <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            t.status === 'success' ? 'bg-emerald-100 text-emerald-600' : 
                            t.status === 'rejected' ? 'bg-rose-100 text-rose-600' : 'bg-slate-200 text-slate-600'
                        }`}>
                            {t.status === 'success' ? 'Thành công' : t.status === 'rejected' ? 'Đã từ chối' : 'Đã Treo'}
                        </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

        </div>
        )}
      </div>

      {/* POPUP: EDIT USER BANK */}
      {isEditUserOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-2xl relative">
                <button onClick={() => setIsEditUserOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700">
                    <X className="w-6 h-6" />
                </button>
                <h3 className="font-bold text-xl text-slate-900 mb-6">Sửa thông tin Ngân hàng</h3>
                <div className="mb-4">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Tên Ngân hàng</label>
                    <input type="text" placeholder="VD: Vietcombank" value={newBankName} onChange={e => setNewBankName(e.target.value)} className="w-full border border-slate-200 bg-slate-50 focus:bg-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                </div>
                <div className="mb-8">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Số tài khoản</label>
                    <input type="text" placeholder="VD: 0123456789" value={newBankAccount} onChange={e => setNewBankAccount(e.target.value)} className="w-full border border-slate-200 bg-slate-50 focus:bg-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                </div>
                <button onClick={saveUserBankInfo} className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all">Lưu Thay Đổi</button>
            </div>
        </div>
      )}

      {/* POPUP: ADD/EDIT PACKAGE */}
      {isPackageModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl relative">
                <button onClick={() => setIsPackageModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700">
                    <X className="w-6 h-6" />
                </button>
                <h3 className="font-bold text-xl text-slate-900 mb-6">{editingPackage ? 'Chỉnh sửa Gói' : 'Thêm Gói Mới'}</h3>
                
                <div className="space-y-4 mb-8">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Tên Gói</label>
                        <input type="text" placeholder="VD: VIP Elite" value={pkgForm.name} onChange={e => setPkgForm({...pkgForm, name: e.target.value})} className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Lợi nhuận (%)</label>
                        <input type="text" placeholder="VD: 18%" value={pkgForm.return} onChange={e => setPkgForm({...pkgForm, return: e.target.value})} className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Mức giá</label>
                        <input type="text" placeholder="VD: 200M+" value={pkgForm.limits} onChange={e => setPkgForm({...pkgForm, limits: e.target.value})} className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Thời gian (Duration)</label>
                        <input type="text" placeholder="VD: 24 Months" value={pkgForm.duration} onChange={e => setPkgForm({...pkgForm, duration: e.target.value})} className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                </div>

                <button onClick={savePackageInfo} className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all">
                    {editingPackage ? 'Lưu Thay Đổi' : 'Tạo Gói Mới'}
                </button>
            </div>
        </div>
      )}

    </div>
  );
}