import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';

/* ──── Shared Theme Tokens ──── */
const T = {
  primary: '#003fb1',
  primaryBg: '#eff3ff',
  primaryLight: '#dbe1ff',
  surface: '#ffffff',
  stripe: '#f9fafb',
  hover: '#eef2ff',
  borderLight: '#e5e7eb',
  borderMed: '#d1d5db',
  text: '#111827',
  textDim: '#6b7280',
  redBg: '#fee2e2',
  red: '#dc2626',
  greenBg: '#d1fae5',
  green: '#065f46',
  amberBg: '#fef3c7',
  amber: '#92400e',
};

/* ──── Helpers ──── */
const fmtINR = (n) => typeof n === 'number' ? n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-';

const getGroupValue = (item, colKey) => {
  const val = item[colKey];
  if (val === null || val === undefined || val === '') return '(empty)';
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  return String(val);
};

const buildGroupTree = (items, columns, groupKeys, sumKeys = [], depth = 0, parentPath = '') => {
  if (depth >= groupKeys.length || groupKeys.length === 0) return null;
  const colKey = groupKeys[depth];
  const col = columns.find(c => c.key === colKey);
  const map = {};
  items.forEach(v => {
    const val = getGroupValue(v, colKey);
    if (!map[val]) map[val] = [];
    map[val].push(v);
  });

  return Object.entries(map).map(([val, groupItems]) => {
    const path = parentPath ? `${parentPath}|${colKey}:${val}` : `${colKey}:${val}`;
    const isLast = depth === groupKeys.length - 1;

    // Compute sub-totals for configured sum keys
    const totals = {};
    sumKeys.forEach(k => {
      totals[k] = groupItems.reduce((sum, item) => sum + (parseFloat(item[k]) || 0), 0);
    });

    return {
      key: val,
      colKey,
      colLabel: col?.label || colKey,
      path,
      depth,
      count: groupItems.length,
      totals,
      children: isLast ? null : buildGroupTree(groupItems, columns, groupKeys, sumKeys, depth + 1, path),
      items: isLast ? groupItems : null,
    };
  });
};

/**
 * EnterpriseDataGrid — Reusable Kendo / DevExtreme style custom data grid.
 *
 * Props:
 *  - title: Page / Grid title
 *  - columns: Array of { key, label, align, sortable, filterable, filterType, width, isSum }
 *  - data: Array of objects
 *  - loading: boolean
 *  - icon: FontAwesome icon class name (e.g. 'fa-book')
 *  - createLink: string route path (e.g. '/group/create')
 *  - createLabel: string (e.g. 'Add Group')
 *  - editLinkPrefix: function or string template (e.g. id => `/group/edit/${id}`)
 *  - onDelete: function(id)
 *  - idKey: string property name for unique item ID (e.g. 'groupId')
 *  - customRenderers: object mapping colKey -> custom render function (v, row) => ReactNode
 *  - onRefresh: function to call when refresh button clicked
 */
const EnterpriseDataGrid = ({
  title,
  columns,
  data = [],
  loading = false,
  icon = 'fa-table-list',
  createLink,
  createLabel = 'Add New',
  editLinkPrefix,
  onDelete,
  idKey = 'id',
  customRenderers = {},
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [colFilters, setColFilters] = useState({});
  const [openMenu, setOpenMenu] = useState(null);
  const [openSubMenu, setOpenSubMenu] = useState(null);
  const [groupByList, setGroupByList] = useState([]);
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [colVisibility, setColVisibility] = useState(() => {
    const v = {};
    columns.forEach(c => v[c.key] = true);
    return v;
  });
  const [draggingCol, setDraggingCol] = useState(null);
  const [dropHover, setDropHover] = useState(false);
  const [dragOverPillIdx, setDragOverPillIdx] = useState(null);
  const menuRef = useRef(null);

  // Close menus on click outside
  useEffect(() => {
    const h = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenu(null);
        setOpenSubMenu(null);
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Identify columns configured for sums
  const sumKeys = useMemo(() => columns.filter(c => c.isSum).map(c => c.key), [columns]);

  /* ── Drag & Drop for Grouping ── */
  const handleDragStart = (e, colKey) => {
    if (colKey === 'action') { e.preventDefault(); return; }
    setDraggingCol(colKey);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', colKey);
    const col = columns.find(c => c.key === colKey);
    const ghost = document.createElement('div');
    ghost.textContent = col?.label || colKey;
    ghost.style.cssText = `padding:6px 14px;background:${T.primary};color:#fff;border-radius:6px;font-size:12px;font-weight:700;position:absolute;top:-1000px;`;
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 40, 16);
    setTimeout(() => document.body.removeChild(ghost), 0);
  };
  const handleDragEnd = () => { setDraggingCol(null); setDropHover(false); setDragOverPillIdx(null); };
  const handleDropZoneDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDropHover(true); };
  const handleDropZoneDragLeave = () => { setDropHover(false); };
  const handleDrop = (e) => {
    e.preventDefault(); setDropHover(false);
    const colKey = e.dataTransfer.getData('text/plain');
    if (colKey && colKey !== 'action' && !groupByList.includes(colKey)) {
      setGroupByList(prev => [...prev, colKey]);
      setCollapsedGroups({});
    }
    setDraggingCol(null);
  };
  const handlePillDragStart = (e, idx) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/pill-idx', String(idx));
  };
  const handlePillDragOver = (e, idx) => { e.preventDefault(); setDragOverPillIdx(idx); };
  const handlePillDrop = (e, targetIdx) => {
    e.preventDefault(); e.stopPropagation();
    const srcIdx = parseInt(e.dataTransfer.getData('application/pill-idx'));
    if (!isNaN(srcIdx) && srcIdx !== targetIdx) {
      setGroupByList(prev => { const n = [...prev]; const [item] = n.splice(srcIdx, 1); n.splice(targetIdx, 0, item); return n; });
      setCollapsedGroups({});
    }
    setDragOverPillIdx(null);
  };
  const removeGroup = (colKey) => { setGroupByList(prev => prev.filter(k => k !== colKey)); setCollapsedGroups({}); };

  /* ── Filter ── */
  const filtered = useMemo(() => {
    let d = data;
    Object.entries(colFilters).forEach(([k, val]) => {
      if (!val || val === 'All') return;
      d = d.filter(item => {
        const itemVal = item[k];
        if (itemVal === null || itemVal === undefined) return false;
        return String(itemVal).toLowerCase().includes(val.toLowerCase());
      });
    });
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      d = d.filter(item => columns.some(c => {
        const val = item[c.key];
        return val !== null && val !== undefined && String(val).toLowerCase().includes(t);
      }));
    }
    return d;
  }, [data, colFilters, searchTerm, columns]);

  /* ── Sort ── */
  const sorted = useMemo(() => {
    if (!sortCol) return filtered;
    const arr = [...filtered], dir = sortDir === 'asc' ? 1 : -1;
    arr.sort((a, b) => {
      const valA = a[sortCol], valB = b[sortCol];
      if (typeof valA === 'number' && typeof valB === 'number') return dir * (valA - valB);
      return dir * String(valA || '').localeCompare(String(valB || ''), undefined, { numeric: true });
    });
    return arr;
  }, [filtered, sortCol, sortDir]);

  /* ── Group Tree ── */
  const groupTree = useMemo(() => groupByList.length === 0 ? null : buildGroupTree(sorted, columns, groupByList, sumKeys), [sorted, columns, groupByList, sumKeys]);
  const toggleGroup = (path) => setCollapsedGroups(p => ({ ...p, [path]: !p[path] }));

  /* ── Pagination ── */
  useEffect(() => { setCurrentPage(1); }, [colFilters, searchTerm, entriesPerPage, groupByList, sortCol, sortDir]);
  const isGrouped = groupByList.length > 0;
  const totalPages = !isGrouped ? Math.max(1, Math.ceil(sorted.length / entriesPerPage)) : 1;
  const paged = !isGrouped ? sorted.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage) : [];

  const handleSort = (key, dir) => { setSortCol(key); setSortDir(dir); setOpenMenu(null); setOpenSubMenu(null); };
  const setColFilter = (key, val) => setColFilters(p => { const n = { ...p }; if (!val || val === 'All') delete n[key]; else n[key] = val; return n; });
  const visibleCols = columns.filter(c => colVisibility[c.key]);
  const colCount = visibleCols.length;
  const activeFilterCount = Object.keys(colFilters).length;

  // Grand Totals calculation
  const grandTotals = useMemo(() => {
    const res = {};
    sumKeys.forEach(k => {
      res[k] = sorted.reduce((s, item) => s + (parseFloat(item[k]) || 0), 0);
    });
    return res;
  }, [sorted, sumKeys]);

  /* ── Export to Excel (CSV) ── */
  const handleExportExcel = () => {
    if (!sorted || sorted.length === 0) return;
    const exportCols = visibleCols.filter(c => c.key !== 'action');
    const headerRow = exportCols.map(c => `"${c.label.replace(/"/g, '""')}"`).join(',');
    const bodyRows = sorted.map(row => {
      return exportCols.map(c => {
        let val = row[c.key];
        if (val === null || val === undefined) val = '';
        if (c.isSum && typeof val === 'number') val = fmtINR(val);
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(',');
    });
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headerRow, ...bodyRows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${title.replace(/\s+/g, '_')}_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /* ── Print Grid ── */
  const handlePrint = () => {
    if (!sorted || sorted.length === 0) return;
    const exportCols = visibleCols.filter(c => c.key !== 'action');
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return;

    const tableHeaders = exportCols.map(c => `<th style="border:1px solid #ddd;padding:8px;background:#f0f4ff;font-size:11px;text-align:${c.align || 'left'}">${c.label}</th>`).join('');
    const tableRows = sorted.map((row, idx) => {
      const cells = exportCols.map(c => {
        let val = row[c.key];
        if (val === null || val === undefined) val = '-';
        if (c.isSum && typeof val === 'number') val = `₹ ${fmtINR(val)}`;
        return `<td style="border:1px solid #eee;padding:8px;font-size:12px;text-align:${c.align || 'left'}">${val}</td>`;
      }).join('');
      return `<tr style="background-color:${idx % 2 === 0 ? '#fff' : '#f9fafb'}">${cells}</tr>`;
    }).join('');

    win.document.write(`
      <html>
        <head>
          <title>${title} - Print View</title>
          <style>
            body { font-family: Inter, Arial, sans-serif; margin: 20px; color: #111827; }
            h2 { font-size: 18px; margin-bottom: 4px; color: #003fb1; }
            .meta { font-size: 11px; color: #6b7280; margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          </style>
        </head>
        <body>
          <h2>${title}</h2>
          <div class="meta">Generated on ${new Date().toLocaleString()} | Total Records: ${sorted.length}</div>
          <table>
            <thead><tr>${tableHeaders}</tr></thead>
            <tbody>${tableRows}</tbody>
          </table>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 300);
  };

  /* ── 3-Dot Column Menu ── */
  const ColumnMenu = ({ col }) => {
    const filterVal = colFilters[col.key] || '';
    const isInGroup = groupByList.includes(col.key);
    const colIdx = visibleCols.findIndex(c => c.key === col.key);
    const openFromLeft = colIdx < 2;
    return (
      <div ref={menuRef} style={{
        position: 'absolute', top: '100%', ...(openFromLeft ? { left: 0 } : { right: 0 }), marginTop: '2px', zIndex: 200,
        backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.12)', minWidth: '200px',
        fontFamily: 'Inter,system-ui,sans-serif', animation: 'kdMenuIn 0.15s ease'
      }}>
        {col.sortable !== false && <>
          <MenuItem active={sortCol === col.key && sortDir === 'asc'} icon="fa-arrow-up-short-wide" label="Sort Ascending" onClick={() => handleSort(col.key, 'asc')} />
          <MenuItem active={sortCol === col.key && sortDir === 'desc'} icon="fa-arrow-down-wide-short" label="Sort Descending" onClick={() => handleSort(col.key, 'desc')} />
        </>}
        {col.key !== 'action' && (
          <MenuItem active={isInGroup} icon="fa-layer-group"
            label={isInGroup ? 'Remove Grouping' : 'Group by this Column'}
            onClick={() => { if (isInGroup) removeGroup(col.key); else { setGroupByList(p => [...p, col.key]); setCollapsedGroups({}); } setOpenMenu(null); setOpenSubMenu(null); }} />
        )}
        {/* Columns Submenu */}
        <div style={{ ...menuItemBase(false), position: 'relative' }}
          onClick={() => setOpenSubMenu(openSubMenu === 'columns' ? null : 'columns')}
          onMouseEnter={() => setOpenSubMenu('columns')}>
          <i className="fa-solid fa-table-columns" style={{ fontSize: '12px', color: '#6b7280', width: '18px' }}></i>
          <span style={{ flex: 1 }}>Columns</span>
          <i className="fa-solid fa-chevron-right" style={{ fontSize: '9px', color: '#9ca3af' }}></i>
          {openSubMenu === 'columns' && (
            <div style={{ position: 'absolute', ...(openFromLeft ? { left: '100%', top: '-1px', marginLeft: '2px' } : { right: '100%', top: '-1px', marginRight: '2px' }), backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', boxShadow: '0 8px 30px rgba(0,0,0,0.15)', minWidth: '165px', maxHeight: '200px', overflowY: 'auto', padding: '6px 0', zIndex: 210 }}
              onClick={e => e.stopPropagation()}>
              {columns.filter(c => c.key !== 'action').map(c => (
                <label key={c.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 14px', fontSize: '12px', color: '#374151', cursor: 'pointer', userSelect: 'none', transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <input type="checkbox" checked={colVisibility[c.key]} onChange={() => setColVisibility(p => ({ ...p, [c.key]: !p[c.key] }))} style={{ accentColor: T.primary, width: '14px', height: '14px' }} />{c.label}
                </label>
              ))}
            </div>
          )}
        </div>
        {/* Filter Submenu */}
        {col.filterable !== false && (
          <div style={{ ...menuItemBase(false), position: 'relative', borderBottom: 'none' }}
            onClick={() => setOpenSubMenu(openSubMenu === 'filter' ? null : 'filter')}
            onMouseEnter={() => setOpenSubMenu('filter')}>
            <i className="fa-solid fa-filter" style={{ fontSize: '12px', color: T.primary, width: '18px' }}></i>
            <span style={{ flex: 1 }}>Filter</span>
            {colFilters[col.key] && <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: T.primary, display: 'inline-block' }}></span>}
            <i className="fa-solid fa-chevron-right" style={{ fontSize: '9px', color: '#9ca3af' }}></i>
            {openSubMenu === 'filter' && (
              <div style={{ position: 'absolute', ...(openFromLeft ? { left: '100%', top: '-1px', marginLeft: '2px' } : { right: '100%', top: '-1px', marginRight: '2px' }), backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', boxShadow: '0 8px 30px rgba(0,0,0,0.15)', minWidth: '210px', padding: '12px', zIndex: 210 }}
                onClick={e => e.stopPropagation()}>
                <div style={{ fontSize: '10px', fontWeight: '700', color: '#9ca3af', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Filter by {col.label}</div>
                {col.filterType === 'select' ? (
                  (col.options || ['All']).map(opt => (
                    <div key={opt} onClick={() => { setColFilter(col.key, opt); setOpenMenu(null); setOpenSubMenu(null); }}
                      style={{
                        padding: '7px 10px', fontSize: '12px', cursor: 'pointer', borderRadius: '6px', marginBottom: '2px',
                        fontWeight: (filterVal === opt || (!filterVal && opt === 'All')) ? '600' : '400',
                        color: (filterVal === opt || (!filterVal && opt === 'All')) ? T.primary : '#374151',
                        backgroundColor: (filterVal === opt || (!filterVal && opt === 'All')) ? T.primaryBg : 'transparent',
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                      onMouseLeave={e => { if (!(filterVal === opt || (!filterVal && opt === 'All'))) e.currentTarget.style.backgroundColor = 'transparent'; }}>
                      {(filterVal === opt || (!filterVal && opt === 'All')) && <i className="fa-solid fa-check" style={{ fontSize: '10px', marginRight: '6px', color: T.primary }}></i>}
                      {opt}
                    </div>
                  ))
                ) : (
                  <>
                    <input autoFocus type="text" value={filterVal} onChange={e => setColFilter(col.key, e.target.value)}
                      placeholder="Type to filter..."
                      style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #d1d5db', borderRadius: '6px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                      onKeyDown={e => { if (e.key === 'Enter') { setOpenMenu(null); setOpenSubMenu(null); } }} />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '10px' }}>
                      <button onClick={() => { setColFilter(col.key, ''); setOpenMenu(null); setOpenSubMenu(null); }}
                        style={{ padding: '6px 14px', fontSize: '11px', border: '1px solid #e5e7eb', borderRadius: '6px', backgroundColor: '#fff', cursor: 'pointer', fontWeight: '600', color: '#6b7280' }}>Clear</button>
                      <button onClick={() => { setOpenMenu(null); setOpenSubMenu(null); }}
                        style={{ padding: '6px 14px', fontSize: '11px', border: 'none', borderRadius: '6px', backgroundColor: T.primary, color: '#fff', cursor: 'pointer', fontWeight: '600' }}>Apply</button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  /* ── Render single row ── */
  const renderRow = useCallback((v, idx, depth = 0) => (
    <tr key={v[idKey] || idx}
      style={{ backgroundColor: idx % 2 === 0 ? T.surface : T.stripe, borderBottom: `1px solid ${T.borderLight}`, transition: 'background 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = T.hover}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? T.surface : T.stripe}>
      {visibleCols.map((col, cIdx) => {
        const val = v[col.key];
        const isFirst = cIdx === 0;
        const cellPaddingLeft = isFirst ? `${12 + depth * 22}px` : '12px';

        if (customRenderers[col.key]) {
          return (
            <td key={col.key} style={{ ...tdBase(col.align), paddingLeft: cellPaddingLeft }}>
              {customRenderers[col.key](val, v)}
            </td>
          );
        }

        if (col.key === 'action') {
          const editUrl = typeof editLinkPrefix === 'function' ? editLinkPrefix(v[idKey]) : `${editLinkPrefix}/${v[idKey]}`;
          return (
            <td key={col.key} style={tdBase('center')}>
              <div style={{ display: 'inline-flex', gap: '4px' }}>
                {editLinkPrefix && (
                  <Link to={editUrl}
                    style={{ width: '28px', height: '28px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: T.primaryBg, color: T.primary, border: `1px solid ${T.primaryLight}`, textDecoration: 'none', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = T.primary; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = T.primaryBg; e.currentTarget.style.color = T.primary; }}>
                    <i className="fa-solid fa-pencil" style={{ fontSize: '10px' }}></i>
                  </Link>
                )}
                {onDelete && (
                  <button onClick={() => onDelete(v[idKey])}
                    style={{ width: '28px', height: '28px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: T.redBg, color: '#dc2626', border: '1px solid #fecaca', cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#dc2626'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = T.redBg; e.currentTarget.style.color = '#dc2626'; }}>
                    <i className="fa-solid fa-trash-can" style={{ fontSize: '10px' }}></i>
                  </button>
                )}
              </div>
            </td>
          );
        }

        return (
          <td key={col.key} style={{
            ...tdBase(col.align),
            paddingLeft: cellPaddingLeft,
            fontWeight: isFirst ? '600' : '400',
            color: isFirst ? T.primary : '#374151',
          }}>
            {col.isSum && typeof val === 'number' ? fmtINR(val) : (val !== null && val !== undefined ? String(val) : '-')}
          </td>
        );
      })}
    </tr>
  ), [visibleCols, customRenderers, editLinkPrefix, onDelete, idKey]);

  /* ── Recursive Group Renderer ── */
  const renderGroupNodes = (nodes) => {
    if (!nodes) return null;
    return nodes.map(node => {
      const collapsed = collapsedGroups[node.path];
      const indentPx = 12 + node.depth * 22;
      return (
        <React.Fragment key={node.path}>
          <tr onClick={() => toggleGroup(node.path)}
            style={{ backgroundColor: '#eff3ff', borderBottom: `1px solid ${T.borderLight}`, cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.filter = 'brightness(0.97)'}
            onMouseLeave={e => e.currentTarget.style.filter = 'none'}>
            <td colSpan={colCount} style={{ padding: `8px 14px 8px ${indentPx}px` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className={`fa-solid ${collapsed ? 'fa-caret-right' : 'fa-caret-down'}`} style={{ fontSize: '12px', color: T.primary, width: '12px' }}></i>
                  <span style={{ fontWeight: '600', fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{node.colLabel}:</span>
                  <span style={{ fontWeight: '700', fontSize: '13px', color: T.primary }}>{node.key}</span>
                  <span style={{ backgroundColor: T.primary, color: '#fff', fontSize: '10px', fontWeight: '700', padding: '1px 8px', borderRadius: '10px' }}>{node.count}</span>
                </div>
              </div>
            </td>
          </tr>
          {!collapsed && (node.children ? renderGroupNodes(node.children) : node.items?.map((v, i) => renderRow(v, i, node.depth + 1)))}
          {/* Sub total row if there are sum columns */}
          {!collapsed && sumKeys.length > 0 && (
            <tr style={{ backgroundColor: '#f1f5f9', borderBottom: `1px solid ${T.borderLight}`, borderTop: `1px solid ${T.borderMed}` }}>
              {visibleCols.map((col, cIdx) => {
                if (cIdx === 0) return <td key={col.key} style={{ ...tdBase('right'), paddingLeft: `${indentPx}px`, fontWeight: '700', color: T.primary, fontSize: '12px' }}>Sub Total :</td>;
                if (col.isSum) return <td key={col.key} style={{ ...tdBase('right'), fontWeight: '700', color: T.text, fontSize: '13px' }}>{fmtINR(node.totals[col.key] || 0)}</td>;
                return <td key={col.key} style={tdBase(col.align)}></td>;
              })}
            </tr>
          )}
        </React.Fragment>
      );
    });
  };

  return (
    <>
      <style>{`
        @keyframes kdMenuIn { from { opacity:0; transform:translateY(-4px) scale(0.98); } to { opacity:1; transform:translateY(0) scale(1); } }
        .jv-grid-header-cell:hover { background-color: #e8edff !important; }
        .jv-grid-header-cell .jv-grip { opacity: 0.3; }
        .jv-grid-header-cell:hover .jv-grip { opacity: 0.7; }
        .jv-grid-header-cell .jv-menu-btn { opacity: 0; }
        .jv-grid-header-cell:hover .jv-menu-btn { opacity: 1; }
      `}</style>

      {/* ── Page Header ── */}
      <div className="dashboard-header-row" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `linear-gradient(135deg, ${T.primary}, #1a56db)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,63,177,0.3)' }}>
            <i className={`fa-solid ${icon}`} style={{ color: '#fff', fontSize: '16px' }}></i>
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#111827', letterSpacing: '-0.3px' }}>{title}</div>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>{sorted.length} of {data.length} entries</div>
          </div>
        </div>
        {createLink && (
          <Link to={createLink}
            style={{ background: `linear-gradient(135deg, ${T.primary}, #1a56db)`, color: '#fff', padding: '10px 24px', borderRadius: '10px', textDecoration: 'none', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0,63,177,0.3)', transition: 'all 0.2s' }}>
            <i className="fa-solid fa-plus"></i> {createLabel}
          </Link>
        )}
      </div>

      {/* ── Grid Box ── */}
      <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', backgroundColor: '#fff', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>

        {/* ── Toolbar ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f8fafc', flexShrink: 0 }}>
          <ToolBtn icon="fa-file-excel" iconColor="#065f46" label="Export to Excel" onClick={handleExportExcel} />
          <ToolBtn icon="fa-print" iconColor="#6b7280" label="Print" onClick={handlePrint} />
          <div style={{ flex: 1 }}></div>
          {activeFilterCount > 0 && (
            <button onClick={() => { setColFilters({}); setSearchTerm(''); }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 14px', border: '1px solid #fecaca', borderRadius: '8px', backgroundColor: '#fef2f2', color: '#dc2626', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
              <i className="fa-solid fa-filter-circle-xmark" style={{ fontSize: '11px' }}></i>Clear {activeFilterCount} Filter{activeFilterCount > 1 ? 's' : ''}
            </button>
          )}
          <div style={{ position: 'relative', marginLeft: '4px' }}>
            <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', color: '#9ca3af', pointerEvents: 'none' }}></i>
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search..."
              style={{ padding: '7px 12px 7px 30px', border: '1.5px solid #d1d5db', borderRadius: '8px', fontSize: '12px', width: '190px', outline: 'none', color: '#111827', backgroundColor: '#fff' }} />
          </div>
        </div>

        {/* ── Drag & Drop Group Zone ── */}
        <div onDragOver={handleDropZoneDragOver} onDragLeave={handleDropZoneDragLeave} onDrop={handleDrop}
          style={{
            padding: '8px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0,
            transition: 'all 0.2s ease', minHeight: '38px', flexWrap: 'wrap',
            backgroundColor: dropHover ? '#eef2ff' : '#fff',
            borderBottom: `1px solid ${dropHover ? T.primary : '#e5e7eb'}`
          }}>
          <i className="fa-solid fa-grip-vertical" style={{ fontSize: '12px', color: '#d1d5db' }}></i>
          {groupByList.length === 0 ? (
            <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>
              {draggingCol
                ? <span style={{ color: T.primary, fontWeight: '600', fontStyle: 'normal' }}><i className="fa-solid fa-arrow-down" style={{ fontSize: '10px', marginRight: '4px' }}></i>Drop here to group</span>
                : <>Drag a column header and <span style={{ color: T.primary, fontWeight: '600' }}>drop it here</span> to group</>
              }
            </span>
          ) : (
            groupByList.map((colKey, idx) => {
              const col = columns.find(c => c.key === colKey);
              return (
                <React.Fragment key={colKey}>
                  {idx > 0 && <i className="fa-solid fa-chevron-right" style={{ fontSize: '8px', color: '#d1d5db' }}></i>}
                  <span draggable onDragStart={e => handlePillDragStart(e, idx)} onDragOver={e => handlePillDragOver(e, idx)} onDrop={e => handlePillDrop(e, idx)} onDragLeave={() => setDragOverPillIdx(null)}
                    style={{
                      background: dragOverPillIdx === idx ? `linear-gradient(135deg, ${T.primary}, #1a56db)` : `linear-gradient(135deg, ${T.primaryBg}, ${T.primaryLight})`,
                      color: dragOverPillIdx === idx ? '#fff' : T.primary,
                      padding: '4px 12px', borderRadius: '20px', fontWeight: '700', fontSize: '11px',
                      border: `1px solid ${T.primaryLight}`, display: 'inline-flex', alignItems: 'center', gap: '5px',
                      cursor: 'grab', userSelect: 'none', textTransform: 'uppercase'
                    }}>
                    <i className="fa-solid fa-arrow-up" style={{ fontSize: '9px', opacity: 0.7 }}></i>
                    {col?.label || colKey}
                    <i className="fa-solid fa-xmark" style={{ fontSize: '9px', cursor: 'pointer', opacity: 0.5, marginLeft: '2px' }}
                      onClick={e => { e.stopPropagation(); removeGroup(colKey); }}></i>
                  </span>
                </React.Fragment>
              );
            })
          )}
          {groupByList.length > 0 && (
            <>
              <div style={{ flex: 1 }}></div>
              <button onClick={() => { setGroupByList([]); setCollapsedGroups({}); }}
                style={{ border: 'none', background: 'none', fontSize: '11px', color: '#dc2626', cursor: 'pointer', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <i className="fa-solid fa-xmark" style={{ fontSize: '10px' }}></i>Clear All
              </button>
            </>
          )}
        </div>

        {/* ── Table Scroll Container ── */}
        <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', tableLayout: 'fixed' }}>
            <colgroup>
              {visibleCols.map(c => <col key={c.key} style={{ width: c.width || undefined }} />)}
            </colgroup>
            <thead>
              <tr>
                {visibleCols.map(col => {
                  const isSorted = sortCol === col.key;
                  const hasFilter = !!colFilters[col.key];
                  const canDrag = col.key !== 'action';
                  const isInGroup = groupByList.includes(col.key);
                  return (
                    <th key={col.key} className="jv-grid-header-cell"
                      draggable={canDrag}
                      onDragStart={e => handleDragStart(e, col.key)}
                      onDragEnd={handleDragEnd}
                      style={{
                        padding: 0, textAlign: col.align || 'left', fontWeight: '700', fontSize: '11px',
                        color: '#475569', letterSpacing: '0.5px', textTransform: 'uppercase',
                        backgroundColor: '#f0f4ff',
                        borderBottom: '2px solid #c7d2fe',
                        borderRight: '1px solid #e2e8f0',
                        position: 'sticky', top: 0, zIndex: 10, userSelect: 'none',
                        cursor: canDrag ? 'grab' : 'default',
                        opacity: draggingCol === col.key ? 0.4 : 1,
                      }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', padding: '12px 10px',
                        justifyContent: col.align === 'right' ? 'flex-end' : col.align === 'center' ? 'center' : 'flex-start',
                        gap: '4px'
                      }}>
                        {canDrag && <i className="fa-solid fa-grip-vertical jv-grip" style={{ fontSize: '8px', color: '#94a3b8', marginRight: '2px', flexShrink: 0 }}></i>}
                        <span style={{ flex: col.align === 'left' ? 1 : undefined, cursor: col.sortable !== false ? 'pointer' : 'default', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                          onClick={() => col.sortable !== false && handleSort(col.key, sortCol === col.key && sortDir === 'asc' ? 'desc' : 'asc')}>
                          {col.label}
                          {isSorted && <i className={`fa-solid ${sortDir === 'asc' ? 'fa-caret-up' : 'fa-caret-down'}`} style={{ fontSize: '11px', color: T.primary }}></i>}
                          {hasFilter && <i className="fa-solid fa-filter" style={{ fontSize: '8px', color: T.primary }}></i>}
                          {isInGroup && <i className="fa-solid fa-layer-group" style={{ fontSize: '8px', color: T.primary }}></i>}
                        </span>
                        {(col.sortable !== false || col.filterable !== false) && (
                          <button className="jv-menu-btn" onClick={e => { e.stopPropagation(); setOpenMenu(openMenu === col.key ? null : col.key); setOpenSubMenu(null); }}
                            style={{
                              border: 'none', background: 'none', padding: '2px 4px', cursor: 'pointer',
                              color: openMenu === col.key ? T.primary : '#94a3b8',
                              fontSize: '14px', lineHeight: 1, borderRadius: '4px', flexShrink: 0
                            }}>
                            ⋮
                          </button>
                        )}
                      </div>
                      {openMenu === col.key && <ColumnMenu col={col} />}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={colCount} style={{ padding: '60px', textAlign: 'center', backgroundColor: '#fff' }}>
                  <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '28px', color: T.primary }}></i>
                  <div style={{ fontSize: '13px', color: '#9ca3af', marginTop: '12px', fontWeight: '500' }}>Loading data...</div>
                </td></tr>
              ) : groupTree ? (
                groupTree.length > 0 ? renderGroupNodes(groupTree) : (
                  <tr><td colSpan={colCount} style={{ padding: '60px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>No items to display</td></tr>
                )
              ) : paged.length > 0 ? paged.map((v, i) => renderRow(v, i)) : (
                <tr><td colSpan={colCount} style={{ padding: '60px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>No items to display</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ═══ GRAND TOTAL (Fixed Footer) ═══ */}
        {!loading && sorted.length > 0 && sumKeys.length > 0 && (
          <div style={{ flexShrink: 0, borderTop: '2px solid #dbe1ff', overflow: 'hidden', backgroundColor: '#f0f4ff' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', tableLayout: 'fixed' }}>
              <colgroup>
                {visibleCols.map(c => <col key={c.key} style={{ width: c.width || undefined }} />)}
              </colgroup>
              <tbody>
                <tr style={{ backgroundColor: '#f0f4ff' }}>
                  {visibleCols.map((col, cIdx) => {
                    if (cIdx === 0) {
                      return <td key={col.key} style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '800', color: '#003fb1', fontSize: '13px', letterSpacing: '0.3px', borderRight: '1px solid #e5e7eb' }}>Grand Total :</td>;
                    }
                    if (col.isSum) {
                      return <td key={col.key} style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '800', color: '#003fb1', fontSize: '13px', fontVariantNumeric: 'tabular-nums', borderRight: '1px solid #e5e7eb' }}>{fmtINR(grandTotals[col.key] || 0)}</td>;
                    }
                    return <td key={col.key} style={{ padding: '8px 12px', borderRight: '1px solid #e5e7eb' }}></td>;
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination Footer ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px',
          borderTop: '1px solid #e5e7eb', backgroundColor: '#f8fafc',
          fontSize: '11px', color: '#64748b', flexShrink: 0
        }}>
          <PagBtn disabled={currentPage === 1} onClick={() => setCurrentPage(1)}><i className="fa-solid fa-angles-left" style={{ fontSize: '9px' }}></i></PagBtn>
          <PagBtn disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}><i className="fa-solid fa-angle-left" style={{ fontSize: '9px' }}></i></PagBtn>
          <input type="text" value={currentPage}
            onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v) && v >= 1 && v <= totalPages) setCurrentPage(v); }}
            style={{ width: '32px', textAlign: 'center', padding: '3px 2px', border: '1px solid #cbd5e1', borderRadius: '5px', fontSize: '11px', fontWeight: '700', color: T.primary, outline: 'none', backgroundColor: '#fff' }} />
          <span>of {totalPages}</span>
          <PagBtn disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}><i className="fa-solid fa-angle-right" style={{ fontSize: '9px' }}></i></PagBtn>
          <PagBtn disabled={currentPage >= totalPages} onClick={() => setCurrentPage(totalPages)}><i className="fa-solid fa-angles-right" style={{ fontSize: '9px' }}></i></PagBtn>
          <div style={{ width: '1px', height: '16px', backgroundColor: '#e2e8f0', margin: '0 6px' }}></div>
          <select value={entriesPerPage} onChange={e => { setEntriesPerPage(Number(e.target.value)); setCurrentPage(1); }}
            style={{ padding: '4px 20px 4px 8px', border: '1px solid #cbd5e1', borderRadius: '5px', fontSize: '11px', fontWeight: '600', color: '#475569', backgroundColor: '#fff', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23003fb1' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center', cursor: 'pointer' }}>
            <option value={10}>10</option><option value={25}>25</option><option value={50}>50</option><option value={100}>100</option>
          </select>
          <span>items per page</span>
          <div style={{ flex: 1 }}></div>
          <span style={{ fontWeight: '500', color: sorted.length > 0 ? '#64748b' : T.primary, fontSize: '11px' }}>
            {sorted.length > 0 ? `${(currentPage - 1) * entriesPerPage + 1} - ${Math.min(currentPage * entriesPerPage, sorted.length)} of ${sorted.length} items` : 'No items'}
          </span>
          {onRefresh && (
            <button onClick={onRefresh} title="Refresh"
              style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '3px 5px', color: '#94a3b8', fontSize: '12px', borderRadius: '4px', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.color = T.primary; e.currentTarget.style.backgroundColor = T.primaryBg; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.backgroundColor = 'transparent'; }}>
              <i className="fa-solid fa-arrows-rotate"></i>
            </button>
          )}
        </div>
      </div>
    </>
  );
};

/* Helper Sub-Components */
const tdBase = (align) => ({
  padding: '10px 12px', textAlign: align || 'left', fontSize: '13px', color: '#374151',
  borderRight: '1px solid #f3f4f6', wordBreak: 'break-word'
});

const menuItemBase = (active) => ({
  display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 14px',
  fontSize: '13px', cursor: 'pointer',
  color: active ? '#003fb1' : '#374151',
  backgroundColor: active ? '#eef2ff' : 'transparent',
  fontWeight: active ? '600' : '400', transition: 'background 0.1s',
  borderBottom: '1px solid #f3f4f6'
});

const MenuItem = ({ active, icon, label, onClick }) => (
  <div onClick={onClick} style={menuItemBase(active)}
    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f3f4f6'}
    onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = 'transparent'; }}>
    <i className={`fa-solid ${icon}`} style={{ fontSize: '12px', color: active ? '#003fb1' : '#6b7280', width: '18px' }}></i>
    <span>{label}</span>
  </div>
);

const ToolBtn = ({ icon, iconColor, label, onClick }) => (
  <button onClick={onClick} style={{
    display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px',
    border: '1px solid #e5e7eb', borderRadius: '8px',
    backgroundColor: '#fff', fontSize: '12px', color: '#475569',
    cursor: 'pointer', fontWeight: '500', transition: 'all 0.15s'
  }}
    onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = '#d1d5db'; }}
    onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.borderColor = '#e5e7eb'; }}>
    <i className={`fa-solid ${icon}`} style={{ color: iconColor, fontSize: '13px' }}></i>{label}
  </button>
);

const PagBtn = ({ disabled, onClick, children }) => (
  <button disabled={disabled} onClick={onClick}
    style={{
      width: '26px', height: '26px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      border: '1px solid #e2e8f0', borderRadius: '5px',
      backgroundColor: disabled ? '#f8fafc' : '#fff',
      color: disabled ? '#cbd5e1' : '#475569',
      cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
      fontWeight: '500'
    }}
    onMouseEnter={e => { if (!disabled) { e.currentTarget.style.backgroundColor = '#eff3ff'; e.currentTarget.style.borderColor = '#dbe1ff'; e.currentTarget.style.color = '#003fb1'; } }}
    onMouseLeave={e => { if (!disabled) { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#475569'; } }}>
    {children}
  </button>
);

export default EnterpriseDataGrid;
