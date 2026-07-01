import React, { useMemo } from "react";
import { formatInr } from "../lib/format.js";

export default function ProposalSummaryPanel({
  selectedList = [],
  selectedTotal = 0,
  removeMultiService,
  editMultiService,
  removeLineItem,
  currentSelection = null,
  onClearCurrentSelection,
}) {
  const displayList = useMemo(() => {
    const list = [...selectedList];
    if (currentSelection && currentSelection.lines && currentSelection.lines.length > 0) {
      const idx = list.findIndex((item) => item.serviceId === currentSelection.serviceId);
      if (idx !== -1) {
        list[idx] = {
          ...list[idx],
          ...currentSelection,
        };
      } else {
        list.push(currentSelection);
      }
    }
    return list;
  }, [selectedList, currentSelection]);

  const displayTotal = useMemo(() => {
    return displayList.reduce((sum, item) => sum + (item.total ?? 0), 0);
  }, [displayList]);

  return (
    <div className="rounded-3xl border border-slate-200/90 bg-gradient-to-b from-slate-50/80 to-white p-5 shadow-xl shadow-slate-200/40 sm:p-6">
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
        <div>
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-violet-600">
            Agency Quotation
          </p>
          <h2 className="mt-0.5 text-lg font-black tracking-tight text-slate-900 sm:text-xl">
            Proposal Summary
          </h2>
        </div>
        <span className="inline-flex items-center justify-center rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white shadow-sm">
          {displayList.length} {displayList.length === 1 ? "Category" : "Categories"}
        </span>
      </div>

      <div className="mt-4">
        {displayList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm font-bold text-slate-800">No services selected yet</p>
            <p className="mt-1 max-w-[220px] text-xs leading-relaxed text-slate-500">
              Select packages or bundles from any category to build your customized agency proposal.
            </p>
          </div>
        ) : (
          <div className="max-h-[42vh] space-y-4 overflow-y-auto pr-1">
            {displayList.map((item) => {
              const isCurrent = currentSelection && item.serviceId === currentSelection.serviceId;
              return (
                <div
                  key={item.serviceId}
                  className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all hover:border-slate-300 hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <span className="truncate text-sm font-bold text-slate-900">{item.serviceName}</span>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {editMultiService && !isCurrent && (
                        <button
                          type="button"
                          onClick={() => editMultiService(item.serviceId)}
                          className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                        >
                          Edit
                        </button>
                      )}
                      {(removeMultiService || (isCurrent && onClearCurrentSelection)) && (
                        <button
                          type="button"
                          onClick={() => {
                            if (isCurrent && onClearCurrentSelection) {
                              onClearCurrentSelection();
                            }
                            if (removeMultiService) {
                              removeMultiService(item.serviceId);
                            }
                          }}
                          className="rounded-lg border border-rose-200 bg-rose-50/50 px-2 py-1 text-[11px] font-semibold text-rose-600 transition hover:bg-rose-100"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>

                  {item.lines && item.lines.length > 0 && (
                    <ul className="mt-3 space-y-2.5">
                      {item.lines.map((line, idx) => (
                        <li key={idx} className="flex items-start justify-between gap-3 text-xs">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold leading-snug text-slate-800">{line.label}</p>
                            {line.sub && <p className="mt-0.5 leading-normal text-[11px] text-slate-500">{line.sub}</p>}
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <span className="font-bold text-slate-900">{formatInr(line.price)}</span>
                            {removeLineItem && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (isCurrent && onClearCurrentSelection && item.lines.length === 1) {
                                    onClearCurrentSelection();
                                  }
                                  removeLineItem(item.serviceId, idx);
                                }}
                                className="p-0.5 text-slate-400 transition hover:text-rose-600"
                                title="Remove item"
                              >
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs">
                    <span className="font-semibold text-slate-500">Category Subtotal</span>
                    <span className="font-black text-violet-700">{formatInr(item.total)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {displayList.length > 0 && (
        <div className="mt-5 rounded-2xl bg-slate-900 p-4 text-white shadow-md">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                Total Estimate
              </p>
              <p className="text-sm font-semibold text-slate-200">Grand Total</p>
            </div>
            <span className="text-xl font-black text-white sm:text-2xl">{formatInr(displayTotal)}</span>
          </div>
          <p className="mt-2 border-t border-slate-800 pt-2 text-[11px] leading-relaxed text-slate-400">
            Indicative quotation for all selected branding, design, and digital marketing services.
          </p>
        </div>
      )}
    </div>
  );
}
