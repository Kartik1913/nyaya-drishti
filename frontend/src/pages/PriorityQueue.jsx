import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPriorityQueueApi } from '../api/endpoints';
import ScoreBadge from '../components/ScoreBadge';
import BottleneckTag from '../components/BottleneckTag';
import ConfidenceBadge from '../components/ConfidenceBadge';
import DataLabelBadge from '../components/DataLabelBadge';
import { 
  ListOrdered, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  ArrowUpRight, 
  AlertCircle, 
  Star,
  RefreshCw
} from 'lucide-react';

const PriorityQueue = () => {
  const [cases, setCases] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [bottleneckFilter, setBottleneckFilter] = useState('');
  const [confidenceFilter, setConfidenceFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      setError(null);
      const filters = {};
      if (bottleneckFilter) filters.bottleneck_filter = bottleneckFilter;
      if (confidenceFilter) filters.confidence_filter = confidenceFilter;

      const data = await getPriorityQueueApi(page, limit, filters);
      setCases(data.cases || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to fetch priority queue:', err);
      setError('Unable to load priority queue. Please check connection to the backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [page, limit, bottleneckFilter, confidenceFilter]);

  const totalPages = Math.ceil(total / limit) || 1;

  const filteredCases = cases.filter((c) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      c.synthetic_cnr?.toLowerCase().includes(query) ||
      c.current_stage?.toLowerCase().includes(query) ||
      c.case_type?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ListOrdered className="w-6 h-6 text-indigo-400" />
            <h1 className="text-2xl font-black tracking-tight text-slate-100">
              Administrative Priority Queue
            </h1>
            <DataLabelBadge type="SYNTHETIC" />
          </div>
          <p className="text-xs text-slate-400">
            Cases ranked strictly by 6-layer administrative stall score (0–100). Higher scores indicate urgent registry follow-up.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          <span>Total Triaged Cases:</span>
          <span className="font-bold text-slate-200">{total}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by CNR or stage..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Bottleneck:</span>
          </div>
          <select
            value={bottleneckFilter}
            onChange={(e) => {
              setBottleneckFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Bottlenecks</option>
            <option value="SUMMONS_DELAY">Summons Delay</option>
            <option value="JUDGE_CHANGE">Bench Change</option>
            <option value="WITNESS_DELAY">Witness Delay</option>
            <option value="REPEATED_ADJOURNMENT">Repeated Adjournment</option>
            <option value="PROCEDURAL_INACTIVITY">Procedural Inactivity</option>
            <option value="UNKNOWN">Normal Progression</option>
          </select>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 ml-2">
            <span>Confidence:</span>
          </div>
          <select
            value={confidenceFilter}
            onChange={(e) => {
              setConfidenceFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Confidence</option>
            <option value="HIGH">High Confidence</option>
            <option value="LOW">Low Confidence</option>
          </select>

          <button
            onClick={fetchQueue}
            title="Refresh Queue"
            className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-950/80 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-12 text-center">Rank</th>
                <th className="py-3.5 px-4">Case CNR & Type</th>
                <th className="py-3.5 px-4">Current Stage</th>
                <th className="py-3.5 px-4 text-center">Days in Stage</th>
                <th className="py-3.5 px-4 text-center">Inactivity</th>
                <th className="py-3.5 px-4 text-center">Adjournments</th>
                <th className="py-3.5 px-4">Bottleneck</th>
                <th className="py-3.5 px-4">Confidence</th>
                <th className="py-3.5 px-4 text-center">Score</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading priority queue rows...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No cases match the current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredCases.map((c, idx) => {
                  const rank = (page - 1) * limit + idx + 1;
                  const isAlpha = c.is_demo_stalled;
                  const isBeta = c.is_demo_progressing;

                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isAlpha ? 'bg-rose-950/20 border-l-4 border-rose-500' : ''
                      } ${isBeta ? 'bg-emerald-950/10 border-l-4 border-emerald-500' : ''}`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-center text-slate-400">
                        {isAlpha ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                            1
                          </span>
                        ) : (
                          `#${rank}`
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/cases/${c.id}`}
                            className="font-mono font-bold text-indigo-300 hover:text-indigo-200 transition flex items-center gap-1"
                          >
                            {c.synthetic_cnr}
                          </Link>
                          {isAlpha && (
                            <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold tracking-wide">
                              ALPHA (DEMO)
                            </span>
                          )}
                          {isBeta && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold tracking-wide">
                              BETA (DEMO)
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {c.case_type} &bull; {c.court_establishment}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-200 font-medium">
                        {c.current_stage}
                      </td>

                      <td className="py-3 px-4 text-center font-mono">
                        <div className="text-slate-200 font-semibold">{c.days_in_current_stage ?? '-'}d</div>
                        {c.stage_deviation_ratio && (
                          <div className="text-[10px] text-slate-400">
                            {c.stage_deviation_ratio.toFixed(1)}x cohort
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center font-mono">
                        <span className={c.days_since_substantive_event > 180 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                          {c.days_since_substantive_event ?? '-'}d
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center font-mono">
                        <span className={c.adjournment_streak >= 4 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                          {c.adjournment_streak ?? 0} streak
                        </span>
                        <div className="text-[10px] text-slate-400">
                          {c.adjournment_count ?? 0} total
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <BottleneckTag type={c.bottleneck_type} />
                      </td>

                      <td className="py-3 px-4">
                        <ConfidenceBadge confidence={c.triage_confidence} />
                      </td>

                      <td className="py-3 px-4 text-center">
                        <ScoreBadge score={c.triage_score} />
                      </td>

                      <td className="py-3 px-4 text-center">
                        <Link
                          to={`/cases/${c.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-indigo-600/80 text-slate-300 hover:text-white border border-slate-700 hover:border-indigo-500 text-xs font-medium transition cursor-pointer"
                        >
                          <span>Review</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="bg-slate-950/60 border-t border-slate-800 px-6 py-3.5 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing <span className="font-semibold text-slate-200">{(page - 1) * limit + 1}</span> to{' '}
            <span className="font-semibold text-slate-200">{Math.min(page * limit, total)}</span> of{' '}
            <span className="font-semibold text-slate-200">{total}</span> cases
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span>Per page:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 font-mono text-slate-200">
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriorityQueue;
