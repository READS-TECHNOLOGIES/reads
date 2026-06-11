import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, BookOpen, ClipboardList, Wallet,
  Settings, UserPlus, Upload, Download, ChevronRight,
  School, Loader2, ArrowLeft, CheckCircle, XCircle, Edit2, Trash2, GraduationCap, Plus, FileText, AlertCircle,
  Calendar, TrendingUp, User, UserCheck, Bell
} from 'lucide-react';
import { api } from '../../services/api.js';
import SchoolPortalModule from './SchoolPortalModule.jsx';
import { LoadingOverlay, EmptyState, Badge, Modal, Toast, SectionHeader, TokenBadge, StatCard } from '../../components/UI.jsx';

// ── Overview ──────────────────────────────────────────────────────────────────
function Overview({ stats, onNavigate }) {
  return (
    <div className="px-4 pt-2 pb-4 space-y-5 animate-fade-in">
      <SectionHeader title="Dashboard" subtitle="Partner overview" />
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={Users} label="Students" value={stats.total_students ?? 0} color="green" onClick={() => onNavigate('students')} />
        <StatCard icon={UserPlus} label="Staff" value={stats.total_staff ?? 0} color="navy" onClick={() => onNavigate('staff')} />
        <StatCard icon={GraduationCap} label="Classes" value={stats.total_classes ?? 0} color="gold" onClick={() => onNavigate('classes')} />
        <StatCard icon={BookOpen} label="School Portal" value="Manage →" color="red" onClick={() => onNavigate('portal')} />
        {(stats.pending_requests ?? 0) > 0 && (
          <div className="col-span-2">
            <button onClick={() => onNavigate('requests')}
              className="w-full flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
              <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Bell size={18} className="text-amber-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-bold text-amber-700 text-sm">{stats.pending_requests} Affiliation Request{stats.pending_requests !== 1 ? 's' : ''}</p>
                <p className="text-amber-600 text-xs">Students waiting for approval</p>
              </div>
              <ChevronRight size={16} className="text-amber-500" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Students Section ──────────────────────────────────────────────────────────
function StudentsSection() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [acting, setActing]     = useState(null);
  const [selected, setSelected] = useState(null);
  const [toast, setToast]       = useState(null);
  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const load = () => {
    api.partner.getStudents()
      .then(d => setStudents(d?.students || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleDeaffiliate = async (s) => {
    if (!confirm(`Remove ${s.full_name} from your school? They have 30 days to recover.`)) return;
    setActing(s.id);
    try {
      await api.partner.deaffiliateStudent(s.id, { reason: 'Removed by school admin' });
      showToast(`${s.full_name} removed`);
      load();
    } catch (e) {
      showToast(e.message || 'Failed', 'error');
    } finally { setActing(null); setSelected(null); }
  };

  const filtered = students.filter(s =>
    !search || s.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingOverlay />;

  return (
    <div className="px-4 pt-2 pb-4 animate-fade-in">
      <SectionHeader title="Students" subtitle={`${students.length} enrolled`} />
      <input className="reads-input mb-4" placeholder="Search students…"
        value={search} onChange={e => setSearch(e.target.value)} />
      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="No students" description="Students who enroll with your school code appear here." />
      ) : (
        <div className="space-y-2">
          {filtered.map(s => (
            <div key={s.id} className="reads-card px-4 py-3">
              <div className="flex items-center gap-3">
                <img src={`https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(s.full_name)}&backgroundColor=16a34a&fontColor=ffffff`}
                  alt={s.full_name} className="w-10 h-10 rounded-xl flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-reads-navy text-sm truncate">{s.full_name}</p>
                  <p className="text-reads-muted text-xs">{s.class_name || 'No class'} · {s.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge label={s.fee_status === 'paid' ? 'Paid' : 'Unpaid'} variant={s.fee_status === 'paid' ? 'green' : 'red'} />
                  <button onClick={() => setSelected(selected?.id === s.id ? null : s)}
                    className="p-1.5 rounded-lg hover:bg-reads-cream">
                    <ChevronRight size={14} className={`text-reads-muted transition-transform ${selected?.id === s.id ? 'rotate-90' : ''}`} />
                  </button>
                </div>
              </div>
              {selected?.id === s.id && (
                <div className="mt-3 pt-3 border-t border-reads-border">
                  <button onClick={() => handleDeaffiliate(s)} disabled={acting === s.id}
                    className="w-full py-2 text-xs font-bold text-red-500 border border-red-200 rounded-xl flex items-center justify-center gap-1">
                    {acting === s.id ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                    Remove from School
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// ── Staff Section ─────────────────────────────────────────────────────────────
function StaffSection() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('academic_officer');
  const [inviting, setInviting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000);
  };

  const loadStaff = () => {
    api.partner.getStaff()
      .then((d) => setStaff(d?.staff || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadStaff(); }, []);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      await api.partner.inviteStaff(inviteEmail.trim(), inviteRole);
      showToast(`Invite sent to ${inviteEmail}`);
      setShowInvite(false);
      setInviteEmail('');
      loadStaff();
    } catch (e) {
      showToast(e.message, 'error');
    } finally { setInviting(false); }
  };

  const handleRemove = async (staffId) => {
    if (!confirm('Remove this staff member?')) return;
    try {
      await api.partner.removeStaff(staffId);
      showToast('Staff removed.');
      loadStaff();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  if (loading) return <LoadingOverlay />;

  return (
    <div className="px-4 pt-2 pb-4 animate-fade-in">
      <SectionHeader
        title="Staff"
        action={
          <button onClick={() => setShowInvite(true)}
            className="flex items-center gap-1.5 text-reads-green font-bold text-sm">
            <UserPlus size={16} /> Invite
          </button>
        }
      />
      {staff.length === 0 ? (
        <EmptyState icon={Users} title="No staff" description="Invite staff members to help manage your school." />
      ) : (
        <div className="space-y-2">
          {staff.map((s) => (
            <div key={s.id} className="flex items-center gap-3 reads-card px-4 py-3">
              <div className="w-10 h-10 bg-reads-navy rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">{s.full_name?.[0] || '?'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-reads-navy text-sm truncate">{s.full_name || s.email}</p>
                <p className="text-reads-muted text-xs capitalize">{s.role?.replace('_', ' ')}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge label={s.status === 'active' ? 'Active' : 'Invited'} variant={s.status === 'active' ? 'green' : 'gold'} />
                <button onClick={() => handleRemove(s.id)} className="text-reads-muted hover:text-reads-red transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showInvite && (
        <Modal title="Invite Staff" onClose={() => setShowInvite(false)}>
          <div className="space-y-4">
            <div>
              <label className="reads-label">Email Address</label>
              <input className="reads-input" type="email" placeholder="staff@school.edu"
                value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
            </div>
            <div>
              <label className="reads-label">Role</label>
              <select className="reads-input" value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                <option value="academic_officer">Academic Officer</option>
                <option value="finance_officer">Finance Officer</option>
                <option value="principal">Principal</option>
              </select>
            </div>
            <button onClick={handleInvite} disabled={inviting}
              className="reads-btn-primary w-full flex items-center justify-center gap-2">
              {inviting && <Loader2 size={18} className="animate-spin" />}
              Send Invite
            </button>
          </div>
        </Modal>
      )}
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// ── Wallet Section ────────────────────────────────────────────────────────────
function PartnerWalletSection() {
  const [wallet, setWallet] = useState(null);
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([api.partner.getWallet(), api.partner.getTransactions()])
      .then(([w, t]) => {
        if (w.status === 'fulfilled') setWallet(w.value);
        if (t.status === 'fulfilled') setTxs(t.value?.transactions || []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingOverlay />;

  return (
    <div className="px-4 pt-2 pb-4 animate-fade-in">
      <SectionHeader title="Partner Wallet" />
      <div className="bg-reads-navy rounded-3xl p-5 mb-4">
        <p className="text-reads-muted-light text-xs uppercase tracking-widest mb-1">Token Balance</p>
        <p className="font-black text-reads-gold text-3xl">{(wallet?.balance ?? 0).toLocaleString()}</p>
        <p className="text-reads-muted-light text-sm">$READS</p>
      </div>
      <div className="reads-card px-4">
        <p className="font-bold text-reads-navy text-sm py-3 border-b border-gray-50">Recent Transactions</p>
        {txs.length === 0 ? (
          <p className="text-reads-muted text-sm py-4 text-center">No transactions yet.</p>
        ) : (
          txs.slice(0, 10).map((tx) => (
            <div key={tx.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
              <div>
                <p className="text-reads-navy font-semibold text-sm">{tx.description}</p>
                <p className="text-reads-muted text-xs">{new Date(tx.created_at).toLocaleDateString()}</p>
              </div>
              <span className={`font-black text-sm ${tx.amount > 0 ? 'text-reads-green' : 'text-reads-red'}`}>
                {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}


// ── Classes Section ───────────────────────────────────────────────────────────
function ClassesSection() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const loadClasses = () => {
    api.partner.getClasses()
      .then((d) => setClasses(d?.classes || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => { loadClasses(); }, []);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await api.partner.createClass({ name: newName.trim() });
      showToast(`Class '${newName}' created`);
      setNewName('');
      loadClasses();
    } catch (e) { showToast(e.message || 'Failed', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (classId, name) => {
    if (!confirm(`Delete class '${name}'?`)) return;
    try { await api.partner.deleteClass(classId); showToast('Deleted'); loadClasses(); }
    catch (e) { showToast(e.message || 'Failed', 'error'); }
  };

  if (loading) return <LoadingOverlay />;

  return (
    <div className="px-4 pt-2 pb-4 animate-fade-in">
      <SectionHeader title="Classes" subtitle={`${classes.length} class${classes.length !== 1 ? 'es' : ''}`} />
      <div className="flex gap-2 mb-4">
        <input className="reads-input flex-1" placeholder="e.g. JSS 1, SS2, Year 3"
          value={newName} onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()} />
        <button onClick={handleAdd} disabled={saving || !newName.trim()}
          className="reads-btn-primary px-4 flex items-center gap-1.5">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Add
        </button>
      </div>
      {classes.length === 0 ? (
        <EmptyState icon={GraduationCap} title="No classes yet"
          description="Add classes so students can select their class when joining your school." />
      ) : (
        <div className="space-y-2">
          {classes.map((cls) => (
            <div key={cls.id} className="flex items-center gap-3 reads-card px-4 py-3">
              <div className="w-10 h-10 bg-reads-green-bg rounded-xl flex items-center justify-center flex-shrink-0">
                <GraduationCap size={18} className="text-reads-green" />
              </div>
              <p className="flex-1 font-bold text-reads-navy text-sm">{cls.name}</p>
              <button onClick={() => handleDelete(cls.id, cls.name)}
                className="text-reads-muted hover:text-reads-red transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}


// ── Lesson Edit Requests (Partner) ───────────────────────────────────────────
function EditRequestsSection() {
  const [lessons, setLessons] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [form, setForm] = useState({ reason: '', suggested_changes: '' });
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState('requests'); // 'requests' | 'new'
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const load = () => {
    Promise.all([
      api.partner.getLessons(),
      api.partner.getEditRequests(),
    ]).then(([ld, rd]) => {
      setLessons(ld?.lessons || []);
      setRequests(rd?.requests || []);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async () => {
    if (!selectedLesson || !form.reason || !form.suggested_changes) return showToast('Fill all fields', 'error');
    setSaving(true);
    try {
      await api.partner.submitEditRequest(selectedLesson.id, form);
      showToast('Edit request submitted!');
      setView('requests');
      setForm({ reason: '', suggested_changes: '' });
      setSelectedLesson(null);
      load();
    } catch (e) { showToast(e.message || 'Failed', 'error'); }
    finally { setSaving(false); }
  };

  const statusColor = (s) => s === 'approved' ? 'text-reads-green' : s === 'rejected' ? 'text-red-500' : 'text-amber-600';

  if (loading) return <LoadingOverlay />;

  return (
    <div className="px-4 pt-2 pb-4 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-black text-reads-navy text-lg">Lesson Edits</h2>
          <p className="text-reads-muted text-xs">Request corrections to lesson content</p>
        </div>
        <button onClick={() => setView(view === 'new' ? 'requests' : 'new')}
          className="flex items-center gap-1.5 bg-reads-green text-white text-xs font-bold px-3 py-2 rounded-xl">
          {view === 'new' ? 'View Requests' : <><Plus size={14} /> New Request</>}
        </button>
      </div>

      {view === 'new' ? (
        <div className="space-y-4">
          <div>
            <label className="reads-label">Select Lesson</label>
            <select className="reads-input" value={selectedLesson?.id || ''}
              onChange={e => setSelectedLesson(lessons.find(l => l.id === e.target.value) || null)}>
              <option value="">— Choose a lesson —</option>
              {lessons.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
            </select>
          </div>
          <div>
            <label className="reads-label">Reason for correction</label>
            <textarea className="reads-input" rows={3} placeholder="What is wrong with this lesson?"
              value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} />
          </div>
          <div>
            <label className="reads-label">Suggested correction</label>
            <textarea className="reads-input" rows={6} placeholder="Provide the corrected content..."
              value={form.suggested_changes} onChange={e => setForm(f => ({ ...f, suggested_changes: e.target.value }))} />
          </div>
          <button onClick={handleSubmit} disabled={saving}
            className="reads-btn-primary w-full flex items-center justify-center gap-2">
            {saving && <Loader2 size={16} className="animate-spin" />} Submit Request
          </button>
        </div>
      ) : requests.length === 0 ? (
        <EmptyState icon={FileText} title="No edit requests yet"
          description="Spot an error in a lesson? Request a correction and admin will review it." />
      ) : (
        <div className="space-y-3">
          {requests.map(r => (
            <div key={r.id} className="reads-card px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="font-bold text-reads-navy text-sm">{r.lesson_title}</p>
                  <p className="text-reads-muted text-xs mt-0.5 line-clamp-2">{r.reason}</p>
                </div>
                <span className={`text-xs font-bold capitalize flex-shrink-0 ${statusColor(r.status)}`}>{r.status}</span>
              </div>
              <p className="text-reads-muted text-[10px] mt-1">{new Date(r.created_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}


// ── Sessions & Promotions Section ────────────────────────────────────────────
function SessionsSection({ classes }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('sessions'); // sessions | promote | bulk
  const [form, setForm] = useState({ name: '', start_date: '', end_date: '', is_current: false });
  const [promoteForm, setPromoteForm] = useState({ student_id: '', to_class_id: '', type: 'promoted' });
  const [bulkForm, setBulkForm] = useState({ from_class_id: '', to_class_id: '', type: 'promoted' });
  const [students, setStudents] = useState([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const loadSessions = () => {
    api.partner.getSessions()
      .then(d => setSessions(d?.sessions || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const loadStudents = () => {
    api.partner.getStudents()
      .then(d => setStudents(d?.students || []))
      .catch(() => {});
  };

  useEffect(() => { loadSessions(); loadStudents(); }, []);

  const handleCreateSession = async () => {
    if (!form.name.trim()) return showToast('Enter a session name', 'error');
    setSaving(true);
    try {
      await api.partner.createSession(form);
      showToast(`Session '${form.name}' created`);
      setForm({ name: '', start_date: '', end_date: '', is_current: false });
      loadSessions();
    } catch (e) { showToast(e.message || 'Failed', 'error'); }
    finally { setSaving(false); }
  };

  const handleSetCurrent = async (id, name) => {
    try {
      await api.partner.setCurrentSession(id);
      showToast(`'${name}' is now current session`);
      loadSessions();
    } catch (e) { showToast(e.message || 'Failed', 'error'); }
  };

  const handlePromote = async () => {
    if (!promoteForm.student_id || !promoteForm.to_class_id) return showToast('Fill all fields', 'error');
    setSaving(true);
    try {
      const res = await api.partner.promoteStudent(promoteForm);
      showToast(res.message || 'Student promoted');
      setPromoteForm({ student_id: '', to_class_id: '', type: 'promoted' });
      loadStudents();
    } catch (e) { showToast(e.message || 'Failed', 'error'); }
    finally { setSaving(false); }
  };

  const handleBulkPromote = async () => {
    if (!bulkForm.from_class_id || !bulkForm.to_class_id) return showToast('Select both classes', 'error');
    if (!confirm(`Promote ALL students from the selected class? This cannot be undone.`)) return;
    setSaving(true);
    try {
      const res = await api.partner.bulkPromote(bulkForm);
      showToast(res.message || 'Bulk promotion done');
    } catch (e) { showToast(e.message || 'Failed', 'error'); }
    finally { setSaving(false); }
  };

  if (loading) return <LoadingOverlay />;

  return (
    <div className="px-4 pt-2 pb-4 animate-fade-in">
      {/* Tab switcher */}
      <div className="flex gap-2 mb-4">
        {[['sessions', 'Sessions'], ['promote', 'Promote Student'], ['bulk', 'Bulk Promote']].map(([k, l]) => (
          <button key={k} onClick={() => setView(k)}
            className={`text-xs font-bold px-3 py-2 rounded-xl transition-colors
              ${view === k ? 'bg-reads-navy text-white' : 'bg-gray-100 text-reads-muted'}`}>
            {l}
          </button>
        ))}
      </div>

      {view === 'sessions' && (
        <div className="space-y-4">
          <SectionHeader title="Academic Sessions" subtitle={`${sessions.length} sessions`} />
          <div className="reads-card px-4 py-4 space-y-3 border-2 border-reads-green">
            <p className="font-bold text-reads-navy text-sm">New Session</p>
            <input className="reads-input" placeholder="e.g. 2024/2025"
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="reads-label">Start Date</label>
                <input className="reads-input" type="date" value={form.start_date}
                  onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
              </div>
              <div>
                <label className="reads-label">End Date</label>
                <input className="reads-input" type="date" value={form.end_date}
                  onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="is_current" checked={form.is_current}
                onChange={e => setForm(f => ({ ...f, is_current: e.target.checked }))} />
              <label htmlFor="is_current" className="reads-label mb-0 text-xs">Set as current session</label>
            </div>
            <button onClick={handleCreateSession} disabled={saving}
              className="reads-btn-primary w-full flex items-center justify-center gap-2">
              {saving && <Loader2 size={16} className="animate-spin" />} Create Session
            </button>
          </div>
          <div className="space-y-2">
            {sessions.map(s => (
              <div key={s.id} className="reads-card px-4 py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-reads-navy text-sm">{s.name}</p>
                    {s.is_current && <span className="text-[10px] bg-reads-green-bg text-reads-green font-bold px-2 py-0.5 rounded-full">Current</span>}
                  </div>
                  {s.start_date && <p className="text-reads-muted text-xs">{new Date(s.start_date).toLocaleDateString()} — {s.end_date ? new Date(s.end_date).toLocaleDateString() : 'ongoing'}</p>}
                </div>
                {!s.is_current && (
                  <button onClick={() => handleSetCurrent(s.id, s.name)}
                    className="text-xs font-bold text-reads-green px-3 py-1.5 bg-reads-green-bg rounded-xl">
                    Set Current
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'promote' && (
        <div className="space-y-4">
          <SectionHeader title="Promote Student" subtitle="Move a single student to another class" />
          <div className="reads-card px-4 py-4 space-y-3">
            <div>
              <label className="reads-label">Student</label>
              <select className="reads-input" value={promoteForm.student_id}
                onChange={e => setPromoteForm(f => ({ ...f, student_id: e.target.value }))}>
                <option value="">— Select student —</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.full_name} {s.class_name ? `(${s.class_name})` : ''}</option>)}
              </select>
            </div>
            <div>
              <label className="reads-label">Move to Class</label>
              <select className="reads-input" value={promoteForm.to_class_id}
                onChange={e => setPromoteForm(f => ({ ...f, to_class_id: e.target.value }))}>
                <option value="">— Select class —</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="reads-label">Type</label>
              <select className="reads-input" value={promoteForm.type}
                onChange={e => setPromoteForm(f => ({ ...f, type: e.target.value }))}>
                <option value="promoted">Promoted</option>
                <option value="repeated">Repeated</option>
                <option value="graduated">Graduated</option>
              </select>
            </div>
            <button onClick={handlePromote} disabled={saving}
              className="reads-btn-primary w-full flex items-center justify-center gap-2">
              {saving && <Loader2 size={16} className="animate-spin" />} Promote Student
            </button>
          </div>
        </div>
      )}

      {view === 'bulk' && (
        <div className="space-y-4">
          <SectionHeader title="Bulk Promotion" subtitle="Move all students from one class to another" />
          <div className="reads-card px-4 py-4 space-y-3 border-2 border-amber-400">
            <div className="bg-amber-50 px-3 py-2 rounded-xl">
              <p className="text-amber-700 text-xs font-semibold">⚠ This will move ALL students in the selected class.</p>
            </div>
            <div>
              <label className="reads-label">From Class</label>
              <select className="reads-input" value={bulkForm.from_class_id}
                onChange={e => setBulkForm(f => ({ ...f, from_class_id: e.target.value }))}>
                <option value="">— Select class —</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="reads-label">To Class</label>
              <select className="reads-input" value={bulkForm.to_class_id}
                onChange={e => setBulkForm(f => ({ ...f, to_class_id: e.target.value }))}>
                <option value="">— Select class —</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="reads-label">Type</label>
              <select className="reads-input" value={bulkForm.type}
                onChange={e => setBulkForm(f => ({ ...f, type: e.target.value }))}>
                <option value="promoted">Promoted</option>
                <option value="repeated">Repeated</option>
                <option value="graduated">Graduated</option>
              </select>
            </div>
            <button onClick={handleBulkPromote} disabled={saving}
              className="w-full bg-amber-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
              {saving && <Loader2 size={16} className="animate-spin" />} Bulk Promote
            </button>
          </div>
        </div>
      )}
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// ── School Profile Section ────────────────────────────────────────────────────
function SchoolProfileSection() {
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    api.partner.getSchoolProfile()
      .then(d => setProfile(d || {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.partner.updateSchoolProfile({ name: profile.name, address: profile.address, phone: profile.phone, email: profile.email });
      showToast('Profile updated');
    } catch (e) { showToast(e.message || 'Failed', 'error'); }
    finally { setSaving(false); }
  };

  if (loading) return <LoadingOverlay />;

  return (
    <div className="px-4 pt-2 pb-4 animate-fade-in space-y-4">
      <SectionHeader title="School Profile" subtitle={profile.school_code} />
      <div className="reads-card px-4 py-4 space-y-3">
        {[
          { label: 'School Name', key: 'name', placeholder: 'School name' },
          { label: 'Address', key: 'address', placeholder: 'School address' },
          { label: 'Phone', key: 'phone', placeholder: 'Contact number' },
          { label: 'Email', key: 'email', placeholder: 'Contact email', type: 'email' },
        ].map(({ label, key, placeholder, type }) => (
          <div key={key}>
            <label className="reads-label">{label}</label>
            <input className="reads-input" type={type || 'text'} placeholder={placeholder}
              value={profile[key] || ''}
              onChange={e => setProfile(p => ({ ...p, [key]: e.target.value }))} />
          </div>
        ))}
        <div className="reads-card px-4 py-2 bg-gray-50">
          <p className="text-reads-muted text-xs">School Code (read-only)</p>
          <p className="font-black text-reads-navy text-sm tracking-widest">{profile.school_code}</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="reads-btn-primary w-full flex items-center justify-center gap-2">
          {saving && <Loader2 size={16} className="animate-spin" />} Save Changes
        </button>
      </div>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// ── Nav items ─────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { key: 'overview',       label: 'Overview',  icon: LayoutDashboard },
  { key: 'students',       label: 'Students',  icon: Users },
  { key: 'staff',          label: 'Staff',     icon: UserPlus },
  { key: 'classes',        label: 'Classes',   icon: GraduationCap },
  { key: 'portal',         label: 'Portal',    icon: BookOpen },
  { key: 'requests',       label: 'Requests',  icon: UserCheck },
  { key: 'course-review',  label: 'Courses',   icon: BookOpen },
  { key: 'edits',          label: 'Edits',     icon: FileText },
  { key: 'sessions',       label: 'Sessions',  icon: Calendar },
  { key: 'school-profile', label: 'Profile',   icon: User },
  { key: 'wallet',         label: 'Wallet',    icon: Wallet },
];


// ── Course Review Section (School Partner) ────────────────────────────────────
function CourseReviewSection() {
  const [courses, setCourses]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [acting, setActing]     = useState(null);
  const [toast, setToast]       = useState(null);
  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const API_URL = (import.meta.env.VITE_API_URL || '') + '/api';
  const token   = () => localStorage.getItem('access_token');

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/courses?scope=school`, {
        headers: { Authorization: `Bearer ${token()}` }
      });
      const data = await res.json();
      // Filter courses in cooldown/pending review
      const pending = (data.courses || []).filter(c =>
        c.status === 'cooldown' || c.status === 'approved_pending_release'
      );
      setCourses(pending);
    } catch (e) {
      showToast('Failed to load courses', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const approve = async (courseId) => {
    setActing(courseId);
    try {
      const res = await fetch(`${API_URL}/courses/${courseId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' }
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Failed');
      showToast('Course approved — will go live when cooldown ends.');
      load();
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setActing(null);
    }
  };

  if (loading) return <LoadingOverlay />;

  return (
    <div className="px-4 pt-2 pb-4 space-y-4 animate-fade-in">
      <div>
        <p className="font-black text-reads-navy text-lg">Course Reviews</p>
        <p className="text-reads-muted text-xs">Courses pending your review before going live</p>
      </div>

      {courses.length === 0 ? (
        <div className="reads-card p-6 text-center">
          <CheckCircle size={32} className="text-reads-green mx-auto mb-2" />
          <p className="font-bold text-reads-navy text-sm">All clear!</p>
          <p className="text-reads-muted text-xs mt-1">No courses pending review right now.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {courses.map(c => (
            <div key={c.id} className="reads-card p-4 space-y-3">
              <div>
                <p className="font-black text-reads-navy text-sm">{c.title}</p>
                <p className="text-reads-muted text-xs">{c.subject}</p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                ⏳ This course will auto-publish when the 3-hour review window ends.
                Approve it now or stay quiet — it will go live either way.
                If you need changes, contact the admin.
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => approve(c.id)}
                  disabled={acting === c.id || c.status === 'approved_pending_release'}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all
                    ${c.status === 'approved_pending_release'
                      ? 'bg-green-100 text-reads-green cursor-default'
                      : 'bg-reads-navy text-white'}`}
                >
                  {acting === c.id ? <Loader2 size={14} className="animate-spin mx-auto" /> :
                   c.status === 'approved_pending_release' ? '✓ Approved' : 'Approve'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// ── Affiliation Requests Section ──────────────────────────────────────────────
function AffiliationRequestsSection() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const load = () => {
    api.partner.getAffiliationRequests()
      .then(d => setRequests(d?.requests || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const decide = async (student_id, action, class_id) => {
    setActing(student_id);
    try {
      if (action === 'approve') {
        await api.partner.approveAffiliation(student_id, class_id || null);
        showToast('Student approved and enrolled!');
      } else {
        await api.partner.rejectAffiliation(student_id);
        showToast('Request rejected.');
      }
      load();
    } catch (e) {
      showToast(e.message || 'Failed', 'error');
    } finally { setActing(null); }
  };

  if (loading) return <LoadingOverlay />;

  return (
    <div className="px-4 pt-2 pb-4 animate-fade-in">
      <SectionHeader title="Affiliation Requests"
        subtitle={requests.length === 0 ? 'No pending requests' : `${requests.length} pending`} />
      {requests.length === 0 ? (
        <EmptyState icon={UserCheck} title="No pending requests"
          description="Students who use your school code to join will appear here for approval." />
      ) : (
        <div className="space-y-3">
          {requests.map(r => (
            <div key={r.id} className="reads-card px-4 py-3 space-y-3">
              <div className="flex items-center gap-3">
                <img src={`https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(r.full_name)}&backgroundColor=16a34a&fontColor=ffffff`}
                  alt={r.full_name} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-reads-navy text-sm truncate">{r.full_name}</p>
                  <p className="text-reads-muted text-xs">{r.email}</p>
                  {r.requested_class && (
                    <p className="text-reads-muted text-xs">Requested class: <span className="font-semibold text-reads-navy">{r.requested_class}</span></p>
                  )}
                </div>
                <Badge label={r.type === 'recovery' ? 'Recovery' : 'New'} variant={r.type === 'recovery' ? 'gold' : 'green'} />
              </div>
              <div className="flex gap-2">
                <button onClick={() => decide(r.id, 'approve', r.requested_class_id)}
                  disabled={acting === r.id}
                  className="flex-1 bg-reads-green text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-1.5">
                  {acting === r.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                  Approve
                </button>
                <button onClick={() => decide(r.id, 'reject')}
                  disabled={acting === r.id}
                  className="flex-1 border border-red-300 text-red-500 font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-1.5">
                  <XCircle size={14} /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {toast && <Toast {...toast} />}
    </div>
  );
}

// ── Main Partner Module ───────────────────────────────────────────────────────
export default function PartnerModule({ user, onLogout }) {
  const [section, setSection] = useState('overview');
  const [stats, setStats] = useState({});
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    Promise.allSettled([
      api.partner.getDashboardStats(),
      api.partner.getProfile(),
    ]).then(([s, p]) => {
      if (s.status === 'fulfilled') setStats(s.value || {});
      if (p.status === 'fulfilled') setProfile(p.value);
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Portal renders full-screen, replacing header/nav */}
      {section === 'portal' ? (
        <SchoolPortalModule onBack={() => setSection('overview')} />
      ) : (
        <>
          {/* Top bar */}
          <div className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 shadow-sm">
            <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-reads-navy rounded-lg flex items-center justify-center">
                  <School size={16} className="text-reads-gold" />
                </div>
                <div>
                  <p className="font-bold text-reads-navy text-sm">{profile?.name || 'Partner Portal'}</p>
                  <p className="text-reads-muted text-xs">{profile?.school_code || ''}</p>
                </div>
              </div>
              <button onClick={onLogout} className="text-reads-muted text-xs font-semibold">Log out</button>
            </div>
          </div>

          {/* Content */}
          <main className="max-w-lg mx-auto pt-14 pb-24 min-h-screen">
            {section === 'overview' && <Overview stats={stats} onNavigate={setSection} />}
            {section === 'students' && <StudentsSection />}
            {section === 'staff' && <StaffSection />}
            {section === 'classes' && <ClassesSection />}
          {section === 'requests'      && <AffiliationRequestsSection />}
          {section === 'edits'         && <EditRequestsSection />}
          {section === 'course-review' && <CourseReviewSection />}
          {section === 'sessions'      && <SessionsSection classes={classes} />}
          {section === 'school-profile' && <SchoolProfileSection />}
            {section === 'wallet' && <PartnerWalletSection />}
          </main>

          {/* Bottom nav */}
          <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
            <div className="max-w-lg mx-auto overflow-x-auto scrollbar-hide">
              <div className="flex items-center px-2 min-w-max">
                {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
                  const active = section === key;
                  return (
                    <button key={key} onClick={() => setSection(key)}
                      className="flex flex-col items-center gap-1 py-3 px-3 min-w-[64px]">
                      <Icon size={22} className={active ? 'text-reads-green' : 'text-reads-muted'} strokeWidth={active ? 2.5 : 1.8} />
                      <span className={`text-[10px] font-semibold whitespace-nowrap ${active ? 'text-reads-green' : 'text-reads-muted'}`}>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </nav>
        </>
      )}
    </div>
  );
}
