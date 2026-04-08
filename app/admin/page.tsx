"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
// ĐÃ BỔ SUNG Loader2 VÀO DÒNG IMPORT NÀY:
import { 
  Users, Activity, CreditCard, Package, LogOut, Check, X, Edit, EyeOff, Plus, ArrowDownToLine, ArrowUpFromLine, Clock, LayoutDashboard,
  MoreVertical, ChevronUp, ChevronDown, Gift, Trash2, Search, Calendar, Trophy, Settings as SettingsIcon, Image as ImageIcon, UploadCloud, Loader2
} from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [userPackages, setUserPackages] = useState<any[]>([]); 
  const [isLoading, setIsLoading] = useState(true);

  const [events, setEvents] = useState<any[]>([]);
  const [leaderboards, setLeaderboards] = useState<any[]>([]);
  const [cskhLink, setCskhLink] = useState('');

  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [newBankName, setNewBankName] = useState('');
  const [newBankAccount, setNewBankAccount] = useState('');
  const [newAccountName, setNewAccountName] = useState(''); 

  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any>(null);
  const [pkgForm, setPkgForm] = useState({ name: '', return_rate: '', limits: '', duration: '', badge: '' });

  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [eventForm, setEventForm] = useState({ title: '', content: '', date: '', status: 'active', image_url: '' });
  const [isUploadingImg, setIsUploadingImg] = useState(false);

  const [isLbModalOpen, setIsLbModalOpen] = useState(false);
  const [editingLb, setEditingLb] = useState<any>(null);
  const [lbForm, setLbForm] = useState({ name: '', invites: 0, reward: '' });

  const [sortConfig, setSortConfig] = useState<{ key: 'totalDeposit' | 'totalWithdrawal', direction: 'asc' | 'desc' } | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const getBankCode = (fullName: string) => {
    if (!fullName) return '';
    const match = fullName.match(/\(([^)]+)\)/);
    if (match) return match[1].trim(); 
    return fullName.trim().replace(/\s+/g, ''); 
  };

  const getUserEmail = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user?.email) return user.email;
    if (user?.account_name) return `${user.account_name} (Chưa đồng bộ Email)`;
    return userId.substring(0, 8) + '...';
  };

  const loadData = async (isBackground = false) => {
    if (!isBackground) setIsLoading(true);
    try {
        const { data: rpcProfiles, error: rpcErr } = await supabase.rpc('get_admin_profiles');
        if (rpcProfiles && !rpcErr) {
            setUsers(rpcProfiles);
        } else {
            const { data: profiles } = await supabase.from('profiles').select('*');
            if (profiles) setUsers(profiles);
        }

        const { data: txs } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
        if (txs) setTransactions(txs);

        const { data: pkgs } = await supabase.from('packages').select('*').order('created_at', { ascending: true });
        if (pkgs) setPackages(pkgs);

        const { data: uPkgs } = await supabase.from('user_packages').select('*').order('purchased_at', { ascending: false });
        if (uPkgs) setUserPackages(uPkgs);

        const { data: evts } = await supabase.from('events').select('*').order('created_at', { ascending: false });
        if (evts) setEvents(evts);

        const { data: lbs } = await supabase.from('leaderboards').select('*').order('invites', { ascending: false });
        if (lbs) setLeaderboards(lbs);

        const { data: settings } = await supabase.from('settings').select('*').limit(1).single();
        if (settings) setCskhLink(settings.cskh_link);

    } catch (err) {
        console.error("Lỗi hệ thống:", err);
    } finally {
        if (!isBackground) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const profileSubscription = supabase.channel('public-profiles-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => loadData(true)).subscribe();

    const transactionSubscription = supabase.channel('public-transactions-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => loadData(true)).subscribe();

    const packageSubscription = supabase.channel('public-packages-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'packages' }, () => loadData(true)).subscribe();
        
    const uPkgSubscription = supabase.channel('public-user-packages-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'user_packages' }, () => loadData(true)).subscribe();

    const eventSubscription = supabase.channel('public-events-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => loadData(true)).subscribe();

    const lbSubscription = supabase.channel('public-leaderboards-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'leaderboards' }, () => loadData(true)).subscribe();

    return () => {
        supabase.removeChannel(profileSubscription);
        supabase.removeChannel(transactionSubscription);
        supabase.removeChannel(packageSubscription);
        supabase.removeChannel(uPkgSubscription);
        supabase.removeChannel(eventSubscription);
        supabase.removeChannel(lbSubscription);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const handleApproveWithdrawal = async (tx: any) => {
    if (!confirm(`Xác nhận DUYỆT lệnh rút ${tx.amount.toLocaleString()} VND?`)) return;
    
    const userToUpdate = users.find(u => u.id === tx.user_id);
    if (userToUpdate) {
        const newBalance = userToUpdate.balance - tx.amount;
        await supabase.from('profiles').update({ balance: newBalance }).eq('id', tx.user_id);
    }
    await supabase.from('transactions').update({ status: 'success' }).eq('id', tx.id);
    alert('Đã duyệt thành công!');
    await loadData(true);
  };

  const handleRejectWithdrawal = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn TỪ CHỐI lệnh rút này?')) return;
    await supabase.from('transactions').update({ status: 'rejected' }).eq('id', id);
    alert('Đã từ chối lệnh rút!');
    await loadData(true);
  };

  const handleSuspendWithdrawal = async (id: string) => {
    if (!confirm('Bạn có chắc muốn TREO lệnh này? (Lệnh sẽ bị ẩn khỏi danh sách chờ nhưng khách không biết)')) return;
    await supabase.from('transactions').update({ status: 'treo' }).eq('id', id);
    alert('Đã đưa lệnh rút vào trạng thái treo!');
    await loadData(true);
  };

  const openEditUser = (user: any) => {
    setEditingUser(user);
    setNewBankName(user.bank_name || '');
    setNewBankAccount(user.bank_account || '');
    setNewAccountName(user.account_name || ''); 
    setIsEditUserOpen(true);
  };

  const saveUserBankInfo = async () => {
    await supabase.from('profiles').update({
      bank_name: newBankName,
      bank_account: newBankAccount,
      account_name: newAccountName 
    }).eq('id', editingUser.id);
    alert('Cập nhật thông tin ngân hàng thành công!');
    setIsEditUserOpen(false);
    await loadData(true);
  };

  const openAddPackage = () => {
    setEditingPackage(null);
    setPkgForm({ name: '', return_rate: '', limits: '', duration: '', badge: '' });
    setIsPackageModalOpen(true);
  };

  const openEditPackage = (pkg: any) => {
    setEditingPackage(pkg);
    setPkgForm({ name: pkg.name, return_rate: pkg.return_rate, limits: pkg.limits, duration: pkg.duration, badge: pkg.badge || '' });
    setIsPackageModalOpen(true);
  };

  const savePackageInfo = async () => {
    if (editingPackage) {
        const { error } = await supabase.from('packages').update(pkgForm).eq('id', editingPackage.id);
        if (error) return alert('Lỗi cập nhật gói: ' + error.message);
        alert('Cập nhật chi tiết gói thành công!');
    } else {
        const { error } = await supabase.from('packages').insert([pkgForm]);
        if (error) return alert('Lỗi thêm gói: ' + error.message);
        alert('Đã thêm gói đầu tư mới!');
    }
    setIsPackageModalOpen(false);
    await loadData(true);
  };

  const handleDeletePackage = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa gói đầu tư này không?')) {
        const { error } = await supabase.from('packages').delete().eq('id', id);
        if (error) return alert('Lỗi xóa gói: ' + error.message);
        alert('Đã xóa gói đầu tư!');
        await loadData(true);
    }
  };

  const openAddEvent = () => {
    setEditingEvent(null);
    setEventForm({ title: '', content: '', date: '', status: 'active', image_url: '' });
    setIsEventModalOpen(true);
  };

  const openEditEvent = (evt: any) => {
    setEditingEvent(evt);
    setEventForm({ title: evt.title, content: evt.content, date: evt.date, status: evt.status, image_url: evt.image_url || '' });
    setIsEventModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImg(true);
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage.from('events').upload(fileName, file);
        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('events').getPublicUrl(fileName);
        setEventForm({ ...eventForm, image_url: data.publicUrl });
    } catch (err: any) {
        alert('Lỗi tải ảnh lên: ' + err.message + '\n(Vui lòng đảm bảo bạn đã tạo Storage bucket tên "events" và set Public)');
    } finally {
        setIsUploadingImg(false);
    }
  };

  const saveEventInfo = async () => {
    if (editingEvent) {
        const { error } = await supabase.from('events').update(eventForm).eq('id', editingEvent.id);
        if (error) return alert('Lỗi cập nhật sự kiện: ' + error.message);
        alert('Cập nhật sự kiện thành công!');
    } else {
        const { error } = await supabase.from('events').insert([eventForm]);
        if (error) return alert('Lỗi thêm sự kiện: ' + error.message);
        alert('Đã thêm sự kiện mới!');
    }
    setIsEventModalOpen(false);
    await loadData(true);
  };

  const handleDeleteEvent = async (id: string) => {
    if (confirm('Bạn có chắc muốn xóa sự kiện này?')) {
        await supabase.from('events').delete().eq('id', id);
        alert('Đã xóa sự kiện!');
        await loadData(true);
    }
  };

  const openAddLb = () => {
    setEditingLb(null);
    setLbForm({ name: '', invites: 0, reward: '' });
    setIsLbModalOpen(true);
  };

  const openEditLb = (lb: any) => {
    setEditingLb(lb);
    setLbForm({ name: lb.name, invites: lb.invites, reward: lb.reward });
    setIsLbModalOpen(true);
  };

  const saveLbInfo = async () => {
    const payload = { ...lbForm, invites: parseInt(lbForm.invites as any) || 0 };
    if (editingLb) {
        const { error } = await supabase.from('leaderboards').update(payload).eq('id', editingLb.id);
        if (error) return alert('Lỗi cập nhật: ' + error.message);
        alert('Cập nhật bảng xếp hạng thành công!');
    } else {
        const { error } = await supabase.from('leaderboards').insert([payload]);
        if (error) return alert('Lỗi thêm: ' + error.message);
        alert('Đã thêm người vào bảng xếp hạng!');
    }
    setIsLbModalOpen(false);
    await loadData(true);
  };

  const handleDeleteLb = async (id: string) => {
    if (confirm('Xóa người này khỏi bảng xếp hạng đua top?')) {
        await supabase.from('leaderboards').delete().eq('id', id);
        alert('Đã xóa thành công!');
        await loadData(true);
    }
  };

  const saveSettingsInfo = async () => {
    const { data } = await supabase.from('settings').select('id').limit(1);
    if (data && data.length > 0) {
        await supabase.from('settings').update({ cskh_link: cskhLink }).eq('id', data[0].id);
    } else {
        await supabase.from('settings').insert([{ cskh_link: cskhLink }]);
    }
    alert('Đã lưu cấu hình hệ thống!');
    await loadData(true);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let todayDeposits = 0;
  let totalDeposits = 0;
  let todayWithdrawals = 0;
  let totalWithdrawals = 0;

  transactions.forEach(tx => {
      if (tx.status === 'success' && tx.type === 'rut_tien') {
          const txDate = new Date(tx.created_at);
          const isToday = txDate >= today;
          totalWithdrawals += tx.amount || 0;
          if (isToday) todayWithdrawals += tx.amount || 0;
      }
  });

  userPackages.forEach(pkg => {
      const pkgDate = new Date(pkg.purchased_at || pkg.created_at);
      const isToday = pkgDate >= today;
      totalDeposits += pkg.invested_amount || 0;
      if (isToday) todayDeposits += pkg.invested_amount || 0;
  });

  const handleSort = (key: 'totalDeposit' | 'totalWithdrawal') => {
    let direction: 'asc' | 'desc' = 'desc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') direction = 'asc';
    setSortConfig({ key, direction });
  };

  let processedUsers = users.map(u => {
      const uPkgs = userPackages.filter(p => p.user_id === u.id);
      const userTxs = transactions.filter(t => t.user_id === u.id && t.status === 'success');
      
      const totalDeposit = uPkgs.reduce((sum, p) => sum + (p.invested_amount || 0), 0);
      const totalWithdrawal = userTxs.filter(t => t.type === 'rut_tien').reduce((sum, t) => sum + (t.amount || 0), 0);
      
      return { ...u, totalDeposit, totalWithdrawal, hasDeposited: totalDeposit > 0 };
  });

  if (searchQuery) {
      const q = searchQuery.toLowerCase();
      processedUsers = processedUsers.filter(u => 
          (u.email && u.email.toLowerCase().includes(q)) || 
          (u.id && u.id.toLowerCase().includes(q))
      );
  }

  if (sortConfig !== null) {
      processedUsers.sort((a, b) => {
          if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
          if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
      });
  }

  if (isLoading && users.length === 0) return <div className="min-h-screen flex items-center justify-center font-semibold text-slate-500">Đang tải dữ liệu hệ thống...</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* SIDEBAR */}
      <div className="w-64 bg-slate-900 text-slate-300 flex flex-col shadow-xl z-10 overflow-hidden">
        <div className="p-6 border-b border-slate-800 shrink-0">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-500" /> Admin Panel
          </h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
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
            <ArrowDownToLine className="w-5 h-5" /> Lịch sử Nạp (Mua gói)
          </button>
          <button onClick={() => setActiveTab('withdrawals')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'withdrawals' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'hover:bg-slate-800'}`}>
            <ArrowUpFromLine className="w-5 h-5" /> Lịch sử Rút
          </button>

          <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-6">Nội dung & Cấu hình</p>
          <button onClick={() => setActiveTab('events')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'events' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'hover:bg-slate-800'}`}>
            <Calendar className="w-5 h-5" /> Sự kiện
          </button>
          <button onClick={() => setActiveTab('leaderboards')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'leaderboards' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'hover:bg-slate-800'}`}>
            <Trophy className="w-5 h-5" /> Đua top
          </button>
          <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'settings' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'hover:bg-slate-800'}`}>
            <SettingsIcon className="w-5 h-5" /> Cài đặt hệ thống
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800 shrink-0">
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
            {activeTab === 'deposits' && 'Lịch sử Nạp tiền (Mua gói)'}
            {activeTab === 'withdrawals' && 'Lịch sử Rút tiền'}
            {activeTab === 'events' && 'Quản lý Sự kiện & Thông báo'}
            {activeTab === 'leaderboards' && 'Cấu hình Bảng Xếp Hạng'}
            {activeTab === 'settings' && 'Cài đặt Hệ thống'}
            </h2>
            
            {activeTab === 'packages' && (
                <button onClick={openAddPackage} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all">
                    <Plus className="w-5 h-5" /> Thêm Gói Mới
                </button>
            )}
            {activeTab === 'events' && (
                <button onClick={openAddEvent} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all">
                    <Plus className="w-5 h-5" /> Thêm Sự Kiện
                </button>
            )}
            {activeTab === 'leaderboards' && (
                <button onClick={openAddLb} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all">
                    <Plus className="w-5 h-5" /> Thêm Người Đua Top
                </button>
            )}
        </div>

        {/* TAB: OVERVIEW */}
        {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <p className="text-sm font-bold text-slate-500 uppercase">Khách Nạp Hôm Nay</p>
                    <h3 className="text-2xl font-black text-emerald-600 mt-2">+{todayDeposits.toLocaleString('vi-VN')} ₫</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <p className="text-sm font-bold text-slate-500 uppercase">Khách Rút Hôm Nay</p>
                    <h3 className="text-2xl font-black text-rose-600 mt-2">-{todayWithdrawals.toLocaleString('vi-VN')} ₫</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <p className="text-sm font-bold text-slate-500 uppercase">Tổng Nạp (All Time)</p>
                    <h3 className="text-2xl font-black text-emerald-600 mt-2">+{totalDeposits.toLocaleString('vi-VN')} ₫</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <p className="text-sm font-bold text-slate-500 uppercase">Tổng Rút (All Time)</p>
                    <h3 className="text-2xl font-black text-rose-600 mt-2">-{totalWithdrawals.toLocaleString('vi-VN')} ₫</h3>
                </div>
            </div>
        )}

        {/* TABLES AREA */}
        {activeTab !== 'overview' && activeTab !== 'settings' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-visible flex flex-col">
          
          {/* TAB: USERS */}
          {activeTab === 'users' && (
            <>
              <div className="p-4 border-b border-slate-200 bg-white">
                  <div className="relative max-w-md">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                          type="text"
                          placeholder="Tìm kiếm theo Email hoặc ID tài khoản..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-colors text-sm font-medium"
                      />
                  </div>
              </div>

              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                    <th className="p-4 font-semibold">Tài khoản Đăng ký</th>
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
                  {processedUsers.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-500">Không tìm thấy khách hàng nào.</td></tr>}
                  {processedUsers.map(u => (
                    <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-bold text-slate-700">
                          {u.email || u.account_name || u.id.substring(0, 8) + '...'}
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

                          {openDropdownId === u.id && (
                              <>
                                  <div className="fixed inset-0 z-10" onClick={() => setOpenDropdownId(null)}></div>
                                  <div className="absolute right-8 top-10 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden py-1">
                                      <button onClick={() => { openEditUser(u); setOpenDropdownId(null); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 flex items-center gap-3 text-slate-700 font-medium transition-colors">
                                          <Edit className="w-4 h-4 text-slate-400"/> Sửa thông tin tài khoản
                                      </button>
                                      <div className="h-px bg-slate-100 my-1"></div>
                                      <button onClick={() => { alert('Tính năng tặng gói'); setOpenDropdownId(null); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 flex items-center gap-3 text-blue-600 font-medium transition-colors">
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
            </>
          )}

          {/* TAB: PACKAGES */}
          {activeTab === 'packages' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                  <th className="p-4 font-semibold">Tên gói</th>
                  <th className="p-4 font-semibold">Lợi nhuận</th>
                  <th className="p-4 font-semibold">Mức giá</th>
                  <th className="p-4 font-semibold">Tag nổi bật</th>
                  <th className="p-4 font-semibold text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {packages.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-500">Chưa có gói đầu tư nào.</td></tr>}
                {packages.map(p => (
                  <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-bold text-slate-800">{p.name}</td>
                    <td className="p-4 font-bold text-emerald-500">{p.return_rate}</td>
                    <td className="p-4 text-slate-600 font-medium">{p.limits}</td>
                    <td className="p-4">
                        {p.badge ? <span className="bg-[#1E6EFF] text-white text-xs px-2 py-1 rounded font-bold uppercase">{p.badge}</span> : <span className="text-slate-400 italic text-xs">Không có</span>}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-2">
                          <button onClick={() => openEditPackage(p)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium transition-colors">
                            <Edit className="w-4 h-4" /> Sửa
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

          {/* TAB: EVENTS */}
          {activeTab === 'events' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                  <th className="p-4 font-semibold w-24 text-center">Hình ảnh</th>
                  <th className="p-4 font-semibold">Tên sự kiện</th>
                  <th className="p-4 font-semibold">Thời gian</th>
                  <th className="p-4 font-semibold">Nội dung</th>
                  <th className="p-4 font-semibold">Trạng thái</th>
                  <th className="p-4 font-semibold text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {events.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-500">Chưa có sự kiện nào.</td></tr>}
                {events.map(evt => (
                  <tr key={evt.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-center">
                        {evt.image_url ? (
                            <img src={evt.image_url} alt={evt.title} className="w-16 h-16 object-cover rounded-lg border border-slate-200 shadow-sm" />
                        ) : (
                            <div className="w-16 h-16 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400">
                                <ImageIcon className="w-6 h-6 opacity-50" />
                            </div>
                        )}
                    </td>
                    <td className="p-4 font-bold text-slate-800 max-w-[200px] truncate">{evt.title}</td>
                    <td className="p-4 text-slate-600 font-medium">{evt.date}</td>
                    <td className="p-4 text-slate-500 max-w-[250px] truncate">{evt.content}</td>
                    <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${evt.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                            {evt.status === 'active' ? 'Đang diễn ra' : 'Sắp diễn ra'}
                        </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-2">
                          <button onClick={() => openEditEvent(evt)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium transition-colors">
                            <Edit className="w-4 h-4" /> Sửa
                          </button>
                          <button onClick={() => handleDeleteEvent(evt.id)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 font-medium transition-colors">
                            <Trash2 className="w-4 h-4" /> Xóa
                          </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* TAB: LEADERBOARD */}
          {activeTab === 'leaderboards' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                  <th className="p-4 font-semibold">Tài khoản (Tên)</th>
                  <th className="p-4 font-semibold text-center">Số lượt mời</th>
                  <th className="p-4 font-semibold text-right">Phần thưởng</th>
                  <th className="p-4 font-semibold text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {leaderboards.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-slate-500">Chưa có người dùng nào trên bảng xếp hạng.</td></tr>}
                {leaderboards.map((lb, idx) => (
                  <tr key={lb.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-bold text-slate-800">
                        <span className="text-slate-400 mr-2">#{idx + 1}</span> {lb.name}
                    </td>
                    <td className="p-4 text-center font-bold text-blue-600">{lb.invites}</td>
                    <td className="p-4 text-right text-amber-600 font-bold">{lb.reward}</td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-2">
                          <button onClick={() => openEditLb(lb)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium transition-colors">
                            <Edit className="w-4 h-4" /> Sửa
                          </button>
                          <button onClick={() => handleDeleteLb(lb.id)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 font-medium transition-colors">
                            <Trash2 className="w-4 h-4" /> Xóa
                          </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* TAB: APPROVALS */}
          {activeTab === 'approvals' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                  <th className="p-4 font-semibold">Khách hàng</th>
                  <th className="p-4 font-semibold">Thông tin STK nhận (Rẽ chuột để quét QR)</th>
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
                    <td className="p-4 font-bold text-slate-700">{getUserEmail(t.user_id)}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                          {t.bank_name && t.bank_account && (
                              <div className="shrink-0 relative group">
                                  <img 
                                      src={`https://img.vietqr.io/image/${getBankCode(t.bank_name)}-${t.bank_account.trim()}-qr_only.png?amount=${t.amount || 0}&addInfo=Thanh toan rut tien&accountName=${encodeURIComponent(t.account_name || '')}`}
                                      alt="QR"
                                      className="w-12 h-12 object-contain bg-white border border-slate-200 rounded-lg p-1 shadow-sm cursor-pointer"
                                  />
                                  <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:block z-50">
                                      <img 
                                          src={`https://img.vietqr.io/image/${getBankCode(t.bank_name)}-${t.bank_account.trim()}-qr_only.png?amount=${t.amount || 0}&addInfo=Thanh toan rut tien&accountName=${encodeURIComponent(t.account_name || '')}`}
                                          alt="QR Zoom"
                                          className="w-56 h-56 max-w-none object-contain bg-white border border-slate-200 rounded-2xl p-3 shadow-2xl"
                                      />
                                  </div>
                              </div>
                          )}
                          <div>
                              <div className="font-bold text-slate-800">{t.bank_name || 'Không rõ NH'}</div>
                              <div className="text-slate-600 font-medium text-xs uppercase">{t.account_name || 'Chưa cập nhật Tên CTK'}</div>
                              <div className="text-slate-500 font-mono mt-0.5">{t.bank_account || 'Không có STK'}</div>
                          </div>
                      </div>
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
                  <th className="p-4 font-semibold">Tài khoản Khách hàng</th>
                  <th className="p-4 font-semibold text-blue-600">Số tiền nạp/mua (VNĐ)</th>
                  <th className="p-4 font-semibold">Thời gian</th>
                  <th className="p-4 font-semibold">Gói đầu tư</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {userPackages.length === 0 && (
                    <tr><td colSpan={4} className="p-8 text-center text-slate-500">Chưa có lịch sử nạp tiền/mua gói nào.</td></tr>
                )}
                {userPackages.map(pkg => (
                  <tr key={pkg.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-4 font-bold text-slate-700">{getUserEmail(pkg.user_id)}</td>
                    <td className="p-4 font-bold text-blue-600">+{pkg.invested_amount?.toLocaleString('vi-VN')} ₫</td>
                    <td className="p-4 text-slate-500">{new Date(pkg.purchased_at || pkg.created_at).toLocaleString('vi-VN')}</td>
                    <td className="p-4">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-600">
                            {pkg.package_name} (Thành công)
                        </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* TAB: WITHDRAWAL HISTORY */}
          {activeTab === 'withdrawals' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                  <th className="p-4 font-semibold">Tài khoản Khách hàng</th>
                  <th className="p-4 font-semibold">Thông tin Nhận</th>
                  <th className="p-4 font-semibold text-rose-600">Số tiền rút (VNĐ)</th>
                  <th className="p-4 font-semibold">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {transactions.filter(t => t.type === 'rut_tien' && t.status !== 'pending').map(t => (
                  <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-4 font-bold text-slate-700">{getUserEmail(t.user_id)}</td>
                    <td className="p-4">
                        <div className="font-bold text-slate-700">{t.bank_name || '-'}</div>
                        <div className="text-slate-600 text-xs font-medium uppercase">{t.account_name || ''}</div>
                        <div className="text-slate-500 font-mono mt-0.5">{t.bank_account || '-'}</div>
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

        {/* TAB: SETTINGS (CSKH) */}
        {activeTab === 'settings' && (
            <div className="max-w-2xl bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-xl text-slate-800 mb-6 flex items-center gap-2">
                    <SettingsIcon className="w-6 h-6 text-blue-600" /> Cấu hình Liên hệ Hỗ trợ (CSKH)
                </h3>
                <div className="mb-6">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Đường link Zalo / Telegram / Messenger</label>
                    <input 
                        type="text" 
                        placeholder="VD: https://zalo.me/0123456789" 
                        value={cskhLink} 
                        onChange={e => setCskhLink(e.target.value)} 
                        className="w-full border border-slate-200 bg-slate-50 focus:bg-white rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-800" 
                    />
                    <p className="text-sm text-slate-500 mt-2">Đường link này sẽ được hiển thị khi người dùng bấm vào nút "CSKH / Hỗ trợ" trên ứng dụng.</p>
                </div>
                <button onClick={saveSettingsInfo} className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all">
                    Lưu Cấu Hình
                </button>
            </div>
        )}

      </div>

      {/* POPUP: EDIT USER BANK CÓ THÊM TÊN CHỦ TÀI KHOẢN */}
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
                <div className="mb-4">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Số tài khoản</label>
                    <input type="text" placeholder="VD: 0123456789" value={newBankAccount} onChange={e => setNewBankAccount(e.target.value)} className="w-full border border-slate-200 bg-slate-50 focus:bg-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                </div>
                <div className="mb-8">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Tên Chủ Tài Khoản</label>
                    <input type="text" placeholder="VD: NGUYEN VAN A" value={newAccountName} onChange={e => setNewAccountName(e.target.value.toUpperCase())} className="w-full border border-slate-200 bg-slate-50 focus:bg-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                </div>
                <button onClick={saveUserBankInfo} className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all">Lưu Thay Đổi</button>
            </div>
        </div>
      )}

      {/* POPUP: ADD/EDIT PACKAGE */}
      {isPackageModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl relative">
                <button onClick={() => setIsPackageModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"><X className="w-6 h-6" /></button>
                <h3 className="font-bold text-xl text-slate-900 mb-6">{editingPackage ? 'Chỉnh sửa Gói' : 'Thêm Gói Mới'}</h3>
                <div className="space-y-4 mb-8">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Tên Gói</label>
                        <input type="text" placeholder="VD: VIP Elite" value={pkgForm.name} onChange={e => setPkgForm({...pkgForm, name: e.target.value})} className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Lợi nhuận (%)</label>
                        <input type="text" placeholder="VD: 18%" value={pkgForm.return_rate} onChange={e => setPkgForm({...pkgForm, return_rate: e.target.value})} className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Mức giá</label>
                        <input type="text" placeholder="VD: 200M+" value={pkgForm.limits} onChange={e => setPkgForm({...pkgForm, limits: e.target.value})} className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Thời gian (Duration)</label>
                        <input type="text" placeholder="VD: 24 Months" value={pkgForm.duration} onChange={e => setPkgForm({...pkgForm, duration: e.target.value})} className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Tag nổi bật (Badge)</label>
                        <input type="text" placeholder="VD: Most Popular" value={pkgForm.badge} onChange={e => setPkgForm({...pkgForm, badge: e.target.value})} className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                </div>
                <button onClick={savePackageInfo} className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all">{editingPackage ? 'Lưu Thay Đổi' : 'Tạo Gói Mới'}</button>
            </div>
        </div>
      )}

      {/* POPUP: ADD/EDIT EVENT KÈM UPLOAD ẢNH */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl relative max-h-[90vh] overflow-y-auto">
                <button onClick={() => setIsEventModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"><X className="w-6 h-6" /></button>
                <h3 className="font-bold text-xl text-slate-900 mb-6">{editingEvent ? 'Chỉnh sửa Sự kiện' : 'Thêm Sự kiện Mới'}</h3>
                
                <div className="space-y-4 mb-8">
                    {/* Phần Upload Ảnh */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Ảnh Sự kiện (Tùy chọn)</label>
                        
                        <div className="flex items-center gap-4">
                            {eventForm.image_url ? (
                                <div className="relative">
                                    <img src={eventForm.image_url} alt="Preview" className="w-20 h-20 object-cover rounded-xl border border-slate-200 shadow-sm" />
                                    <button onClick={() => setEventForm({...eventForm, image_url: ''})} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 hover:bg-rose-600 transition-colors">
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ) : (
                                <div className="w-20 h-20 bg-slate-100 rounded-xl border border-slate-200 border-dashed flex flex-col items-center justify-center text-slate-400">
                                    <ImageIcon className="w-6 h-6" />
                                </div>
                            )}

                            <label className="flex-1 cursor-pointer">
                                <div className={`w-full border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-xl p-3 flex items-center justify-center gap-2 transition-colors ${isUploadingImg ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    {isUploadingImg ? <Loader2 className="w-5 h-5 animate-spin text-blue-600" /> : <UploadCloud className="w-5 h-5 text-blue-600" />}
                                    <span className="font-medium text-slate-700 text-sm">
                                        {isUploadingImg ? 'Đang tải lên...' : 'Chọn ảnh từ máy...'}
                                    </span>
                                </div>
                                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploadingImg} />
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Tiêu đề Sự kiện</label>
                        <input type="text" placeholder="Nhập tiêu đề..." value={eventForm.title} onChange={e => setEventForm({...eventForm, title: e.target.value})} className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Thời gian</label>
                        <input type="text" placeholder="VD: 15/04/2026 - 30/04/2026" value={eventForm.date} onChange={e => setEventForm({...eventForm, date: e.target.value})} className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Nội dung / Thể lệ</label>
                        <textarea placeholder="Mô tả sự kiện..." value={eventForm.content} onChange={e => setEventForm({...eventForm, content: e.target.value})} className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Trạng thái</label>
                        <select value={eventForm.status} onChange={e => setEventForm({...eventForm, status: e.target.value})} className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium">
                            <option value="active">Đang diễn ra</option>
                            <option value="upcoming">Sắp diễn ra</option>
                        </select>
                    </div>
                </div>
                <button onClick={saveEventInfo} className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all">{editingEvent ? 'Lưu Thay Đổi' : 'Tạo Sự Kiện'}</button>
            </div>
        </div>
      )}

      {/* POPUP: ADD/EDIT LEADERBOARD */}
      {isLbModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl relative">
                <button onClick={() => setIsLbModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"><X className="w-6 h-6" /></button>
                <h3 className="font-bold text-xl text-slate-900 mb-6">{editingLb ? 'Chỉnh sửa Đua top' : 'Thêm Người vào Đua Top'}</h3>
                <div className="space-y-4 mb-8">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Tên / Tài khoản hiển thị</label>
                        <input type="text" placeholder="VD: hoang***@gmail.com" value={lbForm.name} onChange={e => setLbForm({...lbForm, name: e.target.value})} className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Số lượt mời (Làm mốc xếp hạng)</label>
                        <input type="number" placeholder="VD: 150" value={lbForm.invites} onChange={e => setLbForm({...lbForm, invites: Number(e.target.value)})} className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Phần thưởng (Nếu có)</label>
                        <input type="text" placeholder="VD: 10,000,000 VNĐ" value={lbForm.reward} onChange={e => setLbForm({...lbForm, reward: e.target.value})} className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                </div>
                <button onClick={saveLbInfo} className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all">{editingLb ? 'Lưu Thay Đổi' : 'Thêm Vào Bảng'}</button>
            </div>
        </div>
      )}

    </div>
  );
}