import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { App } from 'antd';
import { useListPatients } from '../../api/generated/patients/patients';
import type { Patient } from '../../api/generated/model';
import { tokenStorage } from '../../api/token-storage';
import {
  IconHeart, IconSearch, IconExpand, IconMail, IconBell, IconHome,
  IconPlus, IconDownload, IconRefresh, IconPhone, IconCalendar, IconPin,
  IconEdit, IconTrash, IconGear, IconCaretUp, IconCaretDown,
  IconChevronLeft, IconChevronRight, IconFirst, IconLast, IconMale, IconFemale,
  IconMonitor, IconActivity, IconSmile, IconUsers, IconDollar, IconBox,
  IconVideo, IconBadge, IconChart, IconCalendarNav, IconAnchor, IconChevrons,
} from './icons';
import './patients.css';

const PER_PAGE = 20;

/* ---- Deterministic mock values for fields the API does not expose yet ---- */
const TREATMENTS = ['Malaria', 'Dengue', 'Flu', 'Appendicitis', 'Pneumonia', 'Chronic Cough', 'Fracture', 'Cholesterol', 'Headache', 'Anemia'];
const BLOOD_GROUPS = ['B+', 'O+', 'A+', 'B-', 'AB+', 'O-', 'A-'];
const DOCTORS = ['Dr. John Doe', 'Dr. Sarah Smith', 'Dr. Rajesh', 'Dr. Jay Soni', 'Dr. Emma Watson', 'Dr. James Moore'];
const STATUSES = [
  { label: 'Recovered', cls: 'status--recovered' },
  { label: 'Under Treatment', cls: 'status--treatment' },
  { label: 'Under Observation', cls: 'status--observation' },
] as const;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const pick = <T,>(arr: readonly T[], id: number) => arr[id % arr.length];

function admissionDate(p: Patient): string {
  const src = p.created_at ?? p.date_of_birth;
  if (src) {
    const d = new Date(src);
    if (!Number.isNaN(d.getTime())) return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }
  const d = new Date(2024, p.id % 12, ((p.id * 5) % 27) + 1);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

type SortKey = 'name' | 'treatment' | 'gender' | 'phone' | 'admission' | 'doctor' | 'address' | 'status';

export function PatientsListPage() {
  const navigate = useNavigate();
  const { modal, message } = App.useApp();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'name', dir: 'asc' });

  const { data, isFetching, refetch } = useListPatients({
    search: search || undefined,
    page,
    per_page: PER_PAGE,
    sort: 'last_name',
  });

  const rows = useMemo(() => data?.data ?? [], [data]);
  const total = data?.meta.total ?? 0;
  const lastPage = data?.meta.last_page ?? 1;
  const allChecked = rows.length > 0 && rows.every((r) => selected.has(r.id));

  const toggleAll = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allChecked) rows.forEach((r) => next.delete(r.id));
      else rows.forEach((r) => next.add(r.id));
      return next;
    });

  const toggleOne = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const onSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));

  const onDelete = (p: Patient) =>
    modal.confirm({
      title: `Delete ${p.full_name}?`,
      content: 'This patient record will be removed.',
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: () => message.success(`Deleted ${p.full_name}`),
    });

  const signOut = () => {
    tokenStorage.clear();
    navigate('/login', { replace: true });
  };

  const navItems = [IconMonitor, IconActivity, IconSmile, IconUsers, IconDollar, IconBox, IconHome, IconVideo, IconBadge, IconChart, IconGear, IconCalendarNav, IconBox, IconAnchor, IconChevrons];
  const activeNav = 2; // smiley = patients

  return (
    <div className="app-shell">
      {/* ----------------------------- Sidebar ----------------------------- */}
      <aside className="sidebar">
        <div className="sidebar__logo"><IconHeart /></div>
        {navItems.map((Icon, i) => (
          <div key={i} className={`sidebar__item${i === activeNav ? ' sidebar__item--active' : ''}`}>
            <Icon />
          </div>
        ))}
      </aside>

      <div className="app-main">
        {/* ----------------------------- Topbar ----------------------------- */}
        <header className="topbar">
          <div className="topbar__search">
            <IconSearch />
            <input placeholder="Search.." />
          </div>
          <div className="topbar__actions">
            <div className="topbar__icon"><IconExpand /></div>
            <div className="topbar__icon"><span className="topbar__flag">🇺🇸</span></div>
            <div className="topbar__icon"><IconMail /><span className="dot" /></div>
            <div className="topbar__icon"><IconBell /><span className="dot" /></div>
            <img
              className="topbar__avatar"
              src="https://i.pravatar.cc/80?img=47"
              alt="me"
              onClick={signOut}
              title="Sign out"
            />
          </div>
        </header>

        {/* --------------------------- Page heading --------------------------- */}
        <div className="page-head">
          <div className="page-head__title">All Patients</div>
          <nav className="breadcrumb">
            <IconHome />
            <span className="sep">/</span>
            <span>Patients</span>
            <span className="sep">/</span>
            <span className="current">All Patients</span>
          </nav>
        </div>

        {/* ------------------------------- Card ------------------------------- */}
        <section className="patients-card">
          <div className="card-head">
            <div className="card-head__title">All Patients</div>
            <div className="card-head__tools">
              <div className="card-search">
                <IconSearch />
                <input
                  placeholder="Search records…"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
              </div>
              <button className="icon-btn icon-btn--add" title="Add patient" onClick={() => navigate('/patients/new')}>
                <IconPlus />
              </button>
              <button className="icon-btn icon-btn--export" title="Export">
                <IconDownload />
              </button>
              <button
                className={`icon-btn icon-btn--refresh${isFetching ? ' spinning' : ''}`}
                title="Refresh"
                onClick={() => refetch()}
              >
                <IconRefresh />
              </button>
            </div>
          </div>

          <div className="table-wrap">
            <table className="ptable">
              <thead>
                <tr>
                  <th style={{ width: 48 }}>
                    <input className="pcheck" type="checkbox" checked={allChecked} onChange={toggleAll} />
                  </th>
                  <Th label="Name" k="name" sort={sort} onSort={onSort} />
                  <Th label="Treatment" k="treatment" sort={sort} onSort={onSort} />
                  <Th label="Gender" k="gender" sort={sort} onSort={onSort} />
                  <Th label="Phone" k="phone" sort={sort} onSort={onSort} />
                  <Th label="Admission Date" k="admission" sort={sort} onSort={onSort} />
                  <th>Blood Group</th>
                  <Th label="Doctor" k="doctor" sort={sort} onSort={onSort} />
                  <Th label="Address" k="address" sort={sort} onSort={onSort} />
                  <Th label="Status" k="status" sort={sort} onSort={onSort} />
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && !isFetching && (
                  <tr><td colSpan={11}><div className="table-empty">No patients found.</div></td></tr>
                )}
                {rows.map((p) => {
                  const status = pick(STATUSES, p.id);
                  const isFemale = p.gender === 'Female';
                  return (
                    <tr key={p.id} onClick={() => navigate(`/patients/${p.id}`)}>
                      <td onClick={(e) => e.stopPropagation()}>
                        <input
                          className="pcheck"
                          type="checkbox"
                          checked={selected.has(p.id)}
                          onChange={() => toggleOne(p.id)}
                        />
                      </td>
                      <td>
                        <div className="name-cell">
                          <img className="name-cell__avatar" src={`https://i.pravatar.cc/72?img=${(p.id % 70) + 1}`} alt="" />
                          <span className="name-cell__name">{p.full_name}</span>
                        </div>
                      </td>
                      <td>{pick(TREATMENTS, p.id)}</td>
                      <td>
                        <span className={`gender gender--${isFemale ? 'female' : 'male'}`}>
                          {isFemale ? <IconFemale /> : <IconMale />}
                          {p.gender ? p.gender.toLowerCase() : '—'}
                        </span>
                      </td>
                      <td><IconPhone className="cell-icon" />{p.phone ?? '—'}</td>
                      <td><IconCalendar className="cell-icon" />{admissionDate(p)}</td>
                      <td>{pick(BLOOD_GROUPS, p.id)}</td>
                      <td>{pick(DOCTORS, p.id)}</td>
                      <td>
                        <IconPin className="cell-icon" />
                        <span className="addr" title={p.address ?? ''}>{p.address ?? '—'}</span>
                      </td>
                      <td><span className={`status ${status.cls}`}>{status.label}</span></td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="row-actions">
                          <button className="row-action row-action--edit" title="Edit" onClick={() => navigate(`/patients/${p.id}`)}>
                            <IconEdit />
                          </button>
                          <button className="row-action row-action--delete" title="Delete" onClick={() => onDelete(p)}>
                            <IconTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ----------------------------- Footer ----------------------------- */}
          <div className="card-foot">
            <div className="card-foot__count">
              {selected.size} selected / <b>{total}</b> total
            </div>
            <div className="pager">
              <button disabled={page <= 1} onClick={() => setPage(1)} title="First"><IconFirst /></button>
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} title="Previous"><IconChevronLeft /></button>
              {Array.from({ length: lastPage }, (_, i) => i + 1).map((n) => (
                <button key={n} className={n === page ? 'is-active' : ''} onClick={() => setPage(n)}>{n}</button>
              ))}
              <button disabled={page >= lastPage} onClick={() => setPage((p) => p + 1)} title="Next"><IconChevronRight /></button>
              <button disabled={page >= lastPage} onClick={() => setPage(lastPage)} title="Last"><IconLast /></button>
            </div>
          </div>
        </section>
      </div>

      <button className="settings-fab" title="Settings"><IconGear /></button>
    </div>
  );
}

/* Sortable header cell */
function Th({ label, k, sort, onSort }: {
  label: string;
  k: SortKey;
  sort: { key: SortKey; dir: 'asc' | 'desc' };
  onSort: (k: SortKey) => void;
}) {
  const active = sort.key === k;
  return (
    <th className="th-sortable" onClick={() => onSort(k)}>
      <span className="th-inner">
        {label}
        <span className="th-caret">
          <IconCaretUp style={{ opacity: active && sort.dir === 'asc' ? 1 : 0.4 }} />
          <IconCaretDown style={{ opacity: active && sort.dir === 'desc' ? 1 : 0.4 }} />
        </span>
      </span>
    </th>
  );
}
