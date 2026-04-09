"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Users, Activity, CreditCard, Package, LogOut, Check, X, Edit, EyeOff, Plus, ArrowDownToLine, ArrowUpFromLine, Clock, LayoutDashboard,
  MoreVertical, ChevronUp, ChevronDown, Gift, Trash2, Search, Calendar, Trophy, Settings as SettingsIcon, Image as ImageIcon, UploadCloud, Loader2,
  History, DollarSign, MinusCircle, UserPlus, ShieldAlert, Ticket // Bổ sung icon Ticket
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
  const [giftcodes, setGiftcodes] = useState<any[]>([]); // State lưu trữ Giftcodes

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

  // === STATE QUẢN LÝ MÃ CODE (GIFTCODE) ===
  const [isGiftcodeModalOpen, setIsGiftcodeModalOpen] = useState(false);
  const [editingGiftcode, setEditingGiftcode] = useState<any>(null);
  const [gcForm, setGcForm] = useState({ code: '', reward_amount: '', usage_limit: '', status: 'active' });

  const [sortConfig, setSortConfig] = useState<{ key: 'totalDeposit' | 'totalWithdrawal', direction: 'asc' | 'desc' } | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // === CÁC STATE CHO QUẢN LÝ KHÁCH HÀNG CHI TIẾT ===
  const [isTxsModalOpen, setIsTxsModalOpen] = useState(false);
  const [selectedUserTxs, setSelectedUserTxs] = useState<any>(null);
  const [txFilter, setTxFilter] = useState('all');

  const [isManagePkgModalOpen, setIsManagePkgModalOpen] = useState(false);
  const [managePkgUser, setManagePkgUser] = useState<any>(null);
  const [selectedNewPkgId, setSelectedNewPkgId] = useState('');
  const [newPkgAmount, setNewPkgAmount] = useState('');

  const [isAddMoneyModalOpen, setIsAddMoneyModalOpen] = useState(false);
  const [addMoneyUser, setAddMoneyUser] = useState<any>(null);
  const [addMoneyAmount, setAddMoneyAmount] = useState('');

  const [isDeductMoneyModalOpen, setIsDeductMoneyModalOpen] = useState(false);
  const [deductMoneyUser, setDeductMoneyUser] = useState<any>(null);
  const [deductMoneyAmount, setDeductMoneyAmount] = useState('');

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

        // Load danh sách Giftcode
        const { data: gcs } = await supabase.from('giftcodes').select('*').order('created_at', { ascending: false });
        if (gcs) setGiftcodes(gcs);

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

    const gcSubscription = supabase.channel('public-giftcodes-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'giftcodes' }, () => loadData(true)).subscribe();

    return () => {
        supabase.removeChannel(profileSubscription);
        supabase.removeChannel(transactionSubscription);
        supabase.removeChannel(packageSubscription);
        supabase.removeChannel(uPkgSubscription);
        supabase.removeChannel(eventSubscription);
        supabase.removeChannel(lbSubscription);
        supabase.removeChannel(gcSubscription);
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

  const openUserTxs = (user: any) => {
    setSelectedUserTxs(user);
    setTxFilter('all');
    setIsTxsModalOpen(true);
  };

  const openManageUserPackages = (user: any) => {
    setManagePkgUser(user);
    setSelectedNewPkgId('');
    setNewPkgAmount('');
    setIsManagePkgModalOpen(true);
  };

  const handleAddPackageToUser = async () => {
    if (!selectedNewPkgId || !newPkgAmount) return alert('Vui lòng chọn gói và nhập số tiền đầu tư!');
    const pkg = packages.find(p => p.id === selectedNewPkgId);
    if (!pkg) return;

    if (!confirm(`Xác nhận thêm gói "${pkg.name}" cho khách hàng này?`)) return;

    const { error } = await supabase.from('user_packages').insert([{
        user_id: managePkgUser.id,
        package_id: pkg.id,
        package_name: pkg.name,
        invested_amount: parseInt(newPkgAmount),
        status: 'active',
        purchased_at: new Date().toISOString()
    }]);

    if (error) return alert('Lỗi thêm gói: ' + error.message);
    alert('Thêm gói thành công!');
    setNewPkgAmount('');
    await loadData(true);
  };

  const handleRemovePackageFromUser = async (uPkgId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa gói đầu tư này của khách? (Sẽ không hoàn tiền tự động)')) return;
    const { error } = await supabase.from('user_packages').delete().eq('id', uPkgId);
    if (error) return alert('Lỗi xóa gói: ' + error.message);
    alert('Đã xóa gói thành công!');
    await loadData(true);
  };

  const openAddMoney = (user: any) => {
    setAddMoneyUser(user);
    setAddMoneyAmount('');
    setIsAddMoneyModalOpen(true);
  };

  const handleAddMoney = async () => {
    const amount = parseInt(addMoneyAmount);
    if (isNaN(amount) || amount <= 0) return alert('Số tiền không hợp lệ');

    if (!confirm(`Xác nhận cộng ${amount.toLocaleString('vi-VN')} VNĐ vào tài khoản khách hàng này?`)) return;

    const newBalance = (addMoneyUser.balance || 0) + amount;
    const { error: err1 } = await supabase.from('profiles').update({ balance: newBalance }).eq('id', addMoneyUser.id);
    if (err1) return alert('Lỗi cập nhật số dư: ' + err1.message);

    await supabase.from('transactions').insert([{
        user_id: addMoneyUser.id,
        type: 'nap_tien',
        amount: amount,
        status: 'success',
        bank_name: 'HỆ THỐNG',
        account_name: 'Admin cộng tiền trực tiếp'
    }]);

    alert('Cộng tiền thành công!');
    setIsAddMoneyModalOpen(false);
    await loadData(true);
  };

  const openDeductMoney = (user: any) => {
    setDeductMoneyUser(user);
    setDeductMoneyAmount('');
    setIsDeductMoneyModalOpen(true);
  };

  const handleDeductMoney = async () => {
    const amount = parseInt(deductMoneyAmount);
    if (isNaN(amount) || amount <= 0) return alert('Số tiền không hợp lệ');

    if ((deductMoneyUser.balance || 0) < amount) {
        if (!confirm('Số tiền muốn trừ lớn hơn số dư hiện tại của khách. Khách sẽ bị âm tiền. Bạn có chắc chắn muốn tiếp tục?')) return;
    } else {
        if (!confirm(`Xác nhận trừ ${amount.toLocaleString('vi-VN')} VNĐ khỏi tài khoản khách hàng này?`)) return;
    }

    const newBalance = (deductMoneyUser.balance || 0) - amount;
    const { error: err1 } = await supabase.from('profiles').update({ balance: newBalance }).eq('id', deductMoneyUser.id);
    if (err1) return alert('Lỗi cập nhật số dư: ' + err1.message);

    await supabase.from('transactions').insert([{
        user_id: deductMoneyUser.id,
        type: 'thu_hoi',
        amount: amount,
        status: 'success',
        bank_name: 'HỆ THỐNG',
        account_name: 'Admin thu hồi / trừ tiền'
    }]);

    alert('Trừ tiền thành công!');
    setIsDeductMoneyModalOpen(false);
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

  // === CÁC HÀM XỬ LÝ MÃ CODE (GIFTCODE) ===
  const openAddGiftcode = () => {
    setEditingGiftcode(null);
    setGcForm({ code: '', reward_amount: '', usage_limit: '100', status: 'active' });
    setIsGiftcodeModalOpen(true);
  };

  const openEditGiftcode = (gc: any) => {
    setEditingGiftcode(gc);
    setGcForm({ 
        code: gc.code, 
        reward_amount: gc.reward_amount?.toString() || '0', 
        usage_limit: gc.usage_limit?.toString() || '0', 
        status: gc.status 
    });
    setIsGiftcodeModalOpen(true);
  };

  const saveGiftcodeInfo = async () => {
    const payload = {
        code: gcForm.code.toUpperCase().trim(),
        reward_amount: parseInt(gcForm.reward_amount) || 0,
        usage_limit: parseInt(gcForm.usage_limit) || 0,
        status: gcForm.status
    };

    if (!payload.code) return alert('Vui lòng nhập Mã Code hợp lệ!');

    if (editingGiftcode) {
        const { error } = await supabase.from('giftcodes').update(payload).eq('id', editingGiftcode.id);
        if (error) return alert('Lỗi cập nhật mã code: ' + error.message);
        alert('Cập nhật mã code thành công!');
    } else {
        const { error } = await supabase.from('giftcodes').insert([payload]);
        if (error) return alert('Lỗi thêm mã code: ' + error.message);
        alert('Đã tạo mã code mới!');
    }
    setIsGiftcodeModalOpen(false);
    await loadData(true);
  };

  const handleDeleteGiftcode = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa mã code này? Người dùng sẽ không thể nhập mã này nữa.')) {
        const { error } = await supabase.from('giftcodes').delete().eq('id', id);
        if (error) return alert('Lỗi xóa mã code: ' + error.message);
        alert('Đã xóa mã code!');
        await loadData(true);
    }
  };
  // ==========================================

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

  let usersBoughtAllTime = new Set();
  let usersBoughtToday = new Set();

  userPackages.forEach(pkg => {
      const pkgDate = new Date(pkg.purchased_at || pkg.created_at);
      usersBoughtAllTime.add(pkg.user_id);
      
      const isToday = pkgDate >= today;
      if (isToday) {
          usersBoughtToday.add(pkg.user_id);
      }

      totalDeposits += pkg.invested_amount || 0;
      if (isToday) todayDeposits += pkg.invested_amount || 0;
  });

  const totalUsersBoughtAllTime = usersBoughtAllTime.size;
  const totalUsersBoughtToday = usersBoughtToday.size;
  const totalUsersNotBoughtAllTime = users.length - totalUsersBoughtAllTime;
  
  let totalUsersNotBoughtToday = 0;
  let newUsersTodayCount = 0;
  let lockedUsersCount = 0;

  users.forEach(u => {
      const uDate = new Date(u.created_at);
      const isToday = uDate >= today;
      
      if (isToday) newUsersTodayCount++;
      if (u.status === 'locked' || u.status === 'banned') lockedUsersCount++;

      if (isToday) {
          if (!usersBoughtAllTime.has(u.id)) {
              totalUsersNotBoughtToday++;
          }
      }
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

  let combinedTxs: any[] = [];
  if (selectedUserTxs) {
      transactions.filter(t => t.user_id === selectedUserTxs.id).forEach(t => {
          combinedTxs.push({
              id: t.id,
              date: new Date(t.created_at),
              type: t.type || 'khac',
              amount: t.amount || 0,
              status: t.status,
              desc: t.type === 'nap_tien' ? 'Nạp tiền / Cộng tiền' : t.type === 'rut_tien' ? 'Rút tiền' : t.type === 'hoa_hong' ? 'Nhận hoa hồng' : t.type === 'thu_hoi' ? 'Thu hồi / Trừ tiền' : 'Giao dịch khác'
          });
      });
      userPackages.filter(p => p.user_id === selectedUserTxs.id).forEach(p => {
          combinedTxs.push({
              id: p.id,
              date: new Date(p.purchased_at || p.created_at),
              type: 'mua_goi',
              amount: p.invested_amount || 0,
              status: p.status === 'active' ? 'success' : 'pending',
              desc: `Mua gói: ${p.package_name}`
          });
      });
      combinedTxs.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  const filteredTxs = txFilter === 'all' ? combinedTxs : combinedTxs.filter(t => t.type === txFilter);

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
          <button onClick={() => setActiveTab('giftcodes')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'giftcodes' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'hover:bg-slate-800'}`}>
            <Ticket className="w-5 h-5" /> Quản lý Mã Code
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
            {activeTab === 'giftcodes' && 'Quản lý Mã Code (Giftcode)'}
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
            {activeTab === 'giftcodes' && (
                <button onClick={openAddGiftcode} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all">
                    <Plus className="w-5 h-5" /> Tạo Mã Code
                </button>
            )}
        </div>

        {/* TAB: OVERVIEW */}
        {activeTab === 'overview' && (
            <>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
                <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" /> Tổng quan Người dùng
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><Users className="w-6 h-6"/></div>
                        <div>
                            <p className="text-sm font-bold text-slate-500 uppercase">Tổng Tài khoản</p>
                            <h3 className="text-2xl font-black text-slate-800">{users.length}</h3>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                        <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center"><UserPlus className="w-6 h-6"/></div>
                        <div>
                            <p className="text-sm font-bold text-emerald-700 uppercase">Đăng ký Hôm nay</p>
                            <h3 className="text-2xl font-black text-emerald-700">+{newUsersTodayCount}</h3>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 bg-rose-50 p-4 rounded-xl border border-rose-100">
                        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center"><ShieldAlert className="w-6 h-6"/></div>
                        <div>
                            <p className="text-sm font-bold text-rose-700 uppercase">Bị Khóa / Chặn</p>
                            <h3 className="text-2xl font-black text-rose-700">{lockedUsersCount}</h3>
                        </div>
                    </div>
                </div>
            </div>

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

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mt-6 mb-6">
                <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-600" /> Thống kê Khách mua gói
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border border-emerald-100 bg-emerald-50/30 rounded-xl p-5">
                        <p className="font-bold text-emerald-700 mb-3 text-center uppercase tracking-wide">Khách Đã Mua Gói</p>
                        <div className="flex justify-between items-center text-sm">
                            <div className="text-center w-1/2 border-r border-emerald-200/50">
                                <div className="text-slate-500 mb-1">Hôm nay</div>
                                <div className="font-black text-2xl text-emerald-600">{totalUsersBoughtToday}</div>
                            </div>
                            <div className="text-center w-1/2">
                                <div className="text-slate-500 mb-1">Tất cả thời gian</div>
                                <div className="font-black text-2xl text-emerald-600">{totalUsersBoughtAllTime}</div>
                            </div>
                        </div>
                    </div>

                    <div className="border border-slate-200 bg-slate-50/50 rounded-xl p-5">
                        <p className="font-bold text-slate-700 mb-3 text-center uppercase tracking-wide">Khách Chưa Mua Gói</p>
                        <div className="flex justify-between items-center text-sm">
                            <div className="text-center w-1/2 border-r border-slate-200">
                                <div className="text-slate-500 mb-1">Hôm nay (Tài khoản mới)</div>
                                <div className="font-black text-2xl text-slate-600">{totalUsersNotBoughtToday}</div>
                            </div>
                            <div className="text-center w-1/2">
                                <div className="text-slate-500 mb-1">Tất cả thời gian</div>
                                <div className="font-black text-2xl text-slate-600">{totalUsersNotBoughtAllTime}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            </>
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
                                  <div className="absolute right-8 top-10 w-60 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden py-1">
                                      <button onClick={() => { openEditUser(u); setOpenDropdownId(null); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 flex items-center gap-3 text-slate-700 font-medium transition-colors">
                                          <Edit className="w-4 h-4 text-slate-400"/> Sửa thông tin NH
                                      </button>
                                      <div className="h-px bg-slate-100 my-1"></div>
                                      <button onClick={() => { openUserTxs(u); setOpenDropdownId(null); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 flex items-center gap-3 text-slate-700 font-medium transition-colors">
                                          <History className="w-4 h-4 text-slate-400"/> Xem lịch sử giao dịch
                                      </button>
                                      <button onClick={() => { openManageUserPackages(u); setOpenDropdownId(null); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 flex items-center gap-3 text-slate-700 font-medium transition-colors">
                                          <Package className="w-4 h-4 text-slate-400"/> Quản lý gói (Thêm/Xóa)
                                      </button>
                                      <div className="h-px bg-slate-100 my-1"></div>
                                      <button onClick={() => { openAddMoney(u); setOpenDropdownId(null); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-emerald-50 flex items-center gap-3 text-emerald-600 font-bold transition-colors">
                                          <DollarSign className="w-4 h-4"/> Cộng tiền vào TK
                                      </button>
                                      <button onClick={() => { openDeductMoney(u); setOpenDropdownId(null); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-rose-50 flex items-center gap-3 text-rose-600 font-bold transition-colors">
                                          <MinusCircle className="w-4 h-4"/> Thu hồi / Trừ tiền
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
                    <td className="p-4 font-bold text-emerald-500">{p.return_rate} / ngày</td>
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

          {/* TAB: GIFTCODES (MỚI BỔ SUNG) */}
          {activeTab === 'giftcodes' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                  <th className="p-4 font-semibold">Mã Code</th>
                  <th className="p-4 font-semibold">Phần thưởng (VNĐ)</th>
                  <th className="p-4 font-semibold">Lượt dùng</th>
                  <th className="p-4 font-semibold">Trạng thái</th>
                  <th className="p-4 font-semibold text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {giftcodes.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-500">Chưa có mã Code nào được tạo.</td></tr>}
                {giftcodes.map(gc => (
                  <tr key={gc.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-bold text-slate-800 tracking-wider font-mono">{gc.code}</td>
                    <td className="p-4 font-bold text-emerald-600">+{gc.reward_amount.toLocaleString('vi-VN')} ₫</td>
                    <td className="p-4 text-slate-600 font-medium">
                        <span className={gc.used_count >= gc.usage_limit ? 'text-rose-500 font-bold' : 'text-blue-600 font-bold'}>
                            {gc.used_count}
                        </span> / {gc.usage_limit}
                    </td>
                    <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${gc.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                            {gc.status === 'active' ? 'Đang hoạt động' : 'Đã Khóa'}
                        </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-2">
                          <button onClick={() => openEditGiftcode(gc)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium transition-colors">
                            <Edit className="w-4 h-4" /> Sửa
                          </button>
                          <button onClick={() => handleDeleteGiftcode(gc.id)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 font-medium transition-colors">
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

      {/* TẤT CẢ CÁC MODALS */}
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

      {/* MODAL MÃ CODE (MỚI) */}
      {isGiftcodeModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl relative">
                <button onClick={() => setIsGiftcodeModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"><X className="w-6 h-6" /></button>
                <h3 className="font-bold text-xl text-slate-900 mb-6">{editingGiftcode ? 'Chỉnh sửa Mã Code' : 'Thêm Mã Code Mới'}</h3>
                <div className="space-y-4 mb-8">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Mã Code (Tự viết hoa)</label>
                        <input type="text" placeholder="VD: VIP2026" value={gcForm.code} onChange={e => setGcForm({...gcForm, code: e.target.value.toUpperCase()})} className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold tracking-widest" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Giá trị thưởng (VNĐ)</label>
                        <input type="number" placeholder="VD: 50000" value={gcForm.reward_amount} onChange={e => setGcForm({...gcForm, reward_amount: e.target.value})} className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Số lượt dùng tối đa</label>
                        <input type="number" placeholder="VD: 100" value={gcForm.usage_limit} onChange={e => setGcForm({...gcForm, usage_limit: e.target.value})} className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Trạng thái</label>
                        <select value={gcForm.status} onChange={e => setGcForm({...gcForm, status: e.target.value})} className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium">
                            <option value="active">Đang hoạt động</option>
                            <option value="locked">Đã Khóa</option>
                        </select>
                    </div>
                </div>
                <button onClick={saveGiftcodeInfo} className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition-all">{editingGiftcode ? 'Lưu Thay Đổi' : 'Tạo Mã Code'}</button>
            </div>
        </div>
      )}

      {isEventModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl relative max-h-[90vh] overflow-y-auto">
                <button onClick={() => setIsEventModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"><X className="w-6 h-6" /></button>
                <h3 className="font-bold text-xl text-slate-900 mb-6">{editingEvent ? 'Chỉnh sửa Sự kiện' : 'Thêm Sự kiện Mới'}</h3>
                
                <div className="space-y-4 mb-8">
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

      {/* 1. Modal Xem LSGD */}
      {isTxsModalOpen && selectedUserTxs && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-2xl w-full max-w-3xl shadow-2xl relative max-h-[90vh] overflow-hidden flex flex-col">
                <button onClick={() => setIsTxsModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"><X className="w-6 h-6" /></button>
                <h3 className="font-bold text-xl text-slate-900 mb-1">Lịch sử giao dịch</h3>
                <p className="text-sm text-slate-500 mb-4 border-b border-slate-200 pb-4">Tài khoản: <span className="font-bold text-blue-600">{getUserEmail(selectedUserTxs.id)}</span></p>
                
                {/* Tabs Bộ lọc */}
                <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2 mb-4">
                    <button onClick={() => setTxFilter('all')} className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${txFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Tất cả</button>
                    <button onClick={() => setTxFilter('nap_tien')} className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${txFilter === 'nap_tien' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>Nạp tiền</button>
                    <button onClick={() => setTxFilter('rut_tien')} className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${txFilter === 'rut_tien' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'}`}>Rút tiền</button>
                    <button onClick={() => setTxFilter('mua_goi')} className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${txFilter === 'mua_goi' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}>Mua gói</button>
                    <button onClick={() => setTxFilter('hoa_hong')} className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${txFilter === 'hoa_hong' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'}`}>Hoa hồng</button>
                    <button onClick={() => setTxFilter('thu_hoi')} className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${txFilter === 'thu_hoi' ? 'bg-orange-600 text-white' : 'bg-orange-50 text-orange-700 hover:bg-orange-100'}`}>Thu hồi (Trừ)</button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 bg-slate-50 rounded-xl border border-slate-200">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-100 border-b border-slate-200 text-slate-500 sticky top-0 shadow-sm z-10">
                            <tr>
                                <th className="p-3 font-semibold">Thời gian</th>
                                <th className="p-3 font-semibold">Loại / Mô tả</th>
                                <th className="p-3 font-semibold">Trạng thái</th>
                                <th className="p-3 font-semibold text-right">Số tiền (VNĐ)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTxs.length === 0 ? (
                                <tr><td colSpan={4} className="p-8 text-center text-slate-500 font-medium bg-white">Không có giao dịch nào phù hợp.</td></tr>
                            ) : (
                                filteredTxs.map((t, idx) => {
                                    let amountColor = 'text-slate-600';
                                    let amountPrefix = '';
                                    if (t.type === 'nap_tien' || t.type === 'hoa_hong') { amountColor = 'text-emerald-600'; amountPrefix = '+'; }
                                    else if (t.type === 'rut_tien' || t.type === 'mua_goi' || t.type === 'thu_hoi') { amountColor = 'text-rose-600'; amountPrefix = '-'; }

                                    return (
                                        <tr key={`${t.id}-${idx}`} className="border-b border-slate-100 bg-white hover:bg-slate-50 transition-colors">
                                            <td className="p-3 text-slate-500">{t.date.toLocaleString('vi-VN')}</td>
                                            <td className="p-3 font-bold text-slate-700">{t.desc}</td>
                                            <td className="p-3">
                                                <span className={`text-xs font-bold ${t.status === 'success' ? 'text-emerald-600' : t.status === 'rejected' ? 'text-rose-600' : t.status === 'pending' ? 'text-amber-600' : 'text-slate-500'}`}>
                                                    {t.status === 'success' ? 'Thành công' : t.status === 'pending' ? 'Đang xử lý' : t.status === 'rejected' ? 'Từ chối' : 'Treo/Lỗi'}
                                                </span>
                                            </td>
                                            <td className={`p-3 font-bold text-right ${amountColor}`}>
                                                {amountPrefix}{t.amount?.toLocaleString('vi-VN')} ₫
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}

      {/* 2. Modal Quản lý Gói của Khách */}
      {isManagePkgModalOpen && managePkgUser && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-2xl w-full max-w-xl shadow-2xl relative max-h-[90vh] overflow-y-auto">
                <button onClick={() => setIsManagePkgModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"><X className="w-6 h-6" /></button>
                <h3 className="font-bold text-xl text-slate-900 mb-1">Quản lý Gói Đầu Tư</h3>
                <p className="text-sm text-slate-500 mb-6 border-b border-slate-200 pb-4">Tài khoản: <span className="font-bold text-blue-600">{getUserEmail(managePkgUser.id)}</span></p>

                {/* Danh sách gói hiện tại */}
                <h4 className="font-bold text-slate-700 mb-3 text-sm">Gói khách đang có:</h4>
                <div className="space-y-3 mb-8">
                    {userPackages.filter(p => p.user_id === managePkgUser.id).length === 0 ? (
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-500 text-sm">Khách hàng chưa có gói nào.</div>
                    ) : (
                        userPackages.filter(p => p.user_id === managePkgUser.id).map(p => (
                            <div key={p.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-xl bg-slate-50">
                                <div>
                                    <div className="font-bold text-slate-800">{p.package_name}</div>
                                    <div className="text-xs text-slate-500">Vốn: {p.invested_amount?.toLocaleString('vi-VN')} VNĐ • Mua lúc: {new Date(p.purchased_at || p.created_at).toLocaleDateString('vi-VN')}</div>
                                </div>
                                <button onClick={() => handleRemovePackageFromUser(p.id)} className="p-2 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors" title="Xóa gói này">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* Form thêm gói mới */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
                    <h4 className="font-bold text-blue-800 mb-4 flex items-center gap-2"><Plus className="w-4 h-4"/> Thêm gói mới cho khách</h4>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-blue-800 mb-1">Chọn gói hệ thống</label>
                            <select value={selectedNewPkgId} onChange={(e) => setSelectedNewPkgId(e.target.value)} className="w-full border border-blue-200 bg-white rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                                <option value="">-- Chọn Gói --</option>
                                {packages.map(pkg => (
                                    <option key={pkg.id} value={pkg.id}>{pkg.name} ({pkg.limits})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-blue-800 mb-1">Số tiền đầu tư thực tế (VNĐ)</label>
                            <input 
                                type="number" 
                                placeholder="VD: 50000000" 
                                value={newPkgAmount} 
                                onChange={(e) => setNewPkgAmount(e.target.value)} 
                                className="w-full border border-blue-200 bg-white rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                        <button onClick={handleAddPackageToUser} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors text-sm">
                            Xác Nhận Thêm Gói
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* 3. Modal Cộng tiền */}
      {isAddMoneyModalOpen && addMoneyUser && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-2xl relative">
                <button onClick={() => setIsAddMoneyModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"><X className="w-6 h-6" /></button>
                <h3 className="font-bold text-xl text-slate-900 mb-1 flex items-center gap-2">
                    <DollarSign className="w-6 h-6 text-emerald-600" /> Cộng tiền
                </h3>
                <p className="text-sm text-slate-500 mb-6">Tài khoản: <span className="font-bold text-blue-600">{getUserEmail(addMoneyUser.id)}</span></p>

                <div className="mb-2">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Số tiền muốn cộng (VNĐ)</label>
                    <input 
                        type="number" 
                        placeholder="VD: 1000000" 
                        value={addMoneyAmount} 
                        onChange={e => setAddMoneyAmount(e.target.value)} 
                        className="w-full border border-slate-200 bg-slate-50 focus:bg-white rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-bold text-lg text-emerald-600" 
                    />
                </div>
                <div className="mb-6 text-xs text-slate-500">
                    * Hành động này sẽ cộng trực tiếp tiền vào số dư của khách hàng và ghi nhận 1 giao dịch "Nạp tiền" thành công vào lịch sử.
                </div>
                
                <button onClick={handleAddMoney} className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition-all">
                    Xác Nhận Cộng
                </button>
            </div>
        </div>
      )}

      {/* 4. Modal Trừ tiền */}
      {isDeductMoneyModalOpen && deductMoneyUser && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-2xl relative border-t-4 border-rose-500">
                <button onClick={() => setIsDeductMoneyModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"><X className="w-6 h-6" /></button>
                <h3 className="font-bold text-xl text-slate-900 mb-1 flex items-center gap-2">
                    <MinusCircle className="w-6 h-6 text-rose-600" /> Thu hồi / Trừ tiền
                </h3>
                <p className="text-sm text-slate-500 mb-4">Tài khoản: <span className="font-bold text-blue-600">{getUserEmail(deductMoneyUser.id)}</span></p>
                <div className="bg-rose-50 rounded-xl p-3 mb-6 flex justify-between items-center border border-rose-100">
                    <span className="text-sm font-bold text-rose-800">Số dư hiện tại:</span>
                    <span className="font-black text-rose-600">{(deductMoneyUser.balance || 0).toLocaleString('vi-VN')} ₫</span>
                </div>

                <div className="mb-2">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Số tiền muốn trừ (VNĐ)</label>
                    <input 
                        type="number" 
                        placeholder="VD: 500000" 
                        value={deductMoneyAmount} 
                        onChange={e => setDeductMoneyAmount(e.target.value)} 
                        className="w-full border border-slate-200 bg-slate-50 focus:bg-white rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all font-bold text-lg text-rose-600" 
                    />
                </div>
                <div className="mb-6 text-xs text-slate-500">
                    * Hành động này sẽ trừ trực tiếp tiền từ số dư của khách hàng. Lịch sử sẽ ghi nhận là giao dịch "Thu hồi/Trừ tiền" do Admin thực hiện.
                </div>
                
                <button onClick={handleDeductMoney} className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-lg shadow-rose-600/30 transition-all">
                    Xác Nhận Trừ Tiền
                </button>
            </div>
        </div>
      )}

    </div>
  );
}