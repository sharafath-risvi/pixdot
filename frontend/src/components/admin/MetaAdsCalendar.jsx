import { useEffect, useState } from "react";
import CalendarMonthNav from "./CalendarMonthNav.jsx";
import styles from "./Admin.module.css";
import { formatMonthLabel, getDateKey, getMonthDays } from "../../lib/calendar.js";

const adTypeOptions = [
  "Awareness Campaign",
  "Traffic Campaign",
  "Engagement Campaign",
  "Leads Campaign",
  "Sales/Conversion Campaign",
  "Retargeting Campaign",
];

/** Content format for meta ads (admin, staff, client share this component). */
export const metaFormatOptions = ["Poster", "Reels", "Both"];

const legacyFormatMap = {
  Facebook: "Poster",
  Instagram: "Reels",
};

function normalizeFormat(value) {
  if (!value) return value;
  return legacyFormatMap[value] || value;
}

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "paused", label: "Paused" },
];

function statusToClass(status) {
  if (status === "active") return styles.metaStatusActive;
  if (status === "paused") return styles.metaStatusPaused;
  return styles.metaStatusCompleted;
}

function MetaAdsFormModal({ open, onClose, onSubmit, initialValue, dayLabel, initialAdType }) {
  const [adType, setAdType] = useState(initialValue?.adType || initialAdType || adTypeOptions[0]);
  const [campaignName, setCampaignName] = useState(initialValue?.campaignName || "");
  const [platform, setPlatform] = useState(
    normalizeFormat(initialValue?.platform) || metaFormatOptions[0],
  );
  const [budgetType, setBudgetType] = useState(initialValue?.budgetType || "Daily");
  const [budgetAmount, setBudgetAmount] = useState(initialValue?.budgetAmount || "");
  const [startDate, setStartDate] = useState(initialValue?.startDate || "");
  const [endDate, setEndDate] = useState(initialValue?.endDate || "");
  const [targetAudience, setTargetAudience] = useState(initialValue?.targetAudience || "");
  const [objective, setObjective] = useState(initialValue?.objective || "");
  const [status, setStatus] = useState(initialValue?.metaStatus || "active");
  const [contentPlan, setContentPlan] = useState(initialValue?.contentPlan || "");

  // Reset the form whenever the modal opens for a different campaign or day.
  useEffect(() => {
    if (!open) return;
    setAdType(initialValue?.adType || initialAdType || adTypeOptions[0]);
    setCampaignName(initialValue?.campaignName || "");
    setPlatform(normalizeFormat(initialValue?.platform) || metaFormatOptions[0]);
    setBudgetType(initialValue?.budgetType || "Daily");
    setBudgetAmount(initialValue?.budgetAmount || "");
    setStartDate(initialValue?.startDate || "");
    setEndDate(initialValue?.endDate || "");
    setTargetAudience(initialValue?.targetAudience || "");
    setObjective(initialValue?.objective || "");
    setStatus(initialValue?.metaStatus || "active");
    setContentPlan(initialValue?.contentPlan || "");
  }, [open, initialValue, initialAdType]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      adType,
      campaignName,
      platform: normalizeFormat(platform),
      budgetType,
      budgetAmount,
      startDate,
      endDate,
      targetAudience,
      objective,
      metaStatus: status,
      contentPlan: contentPlan.trim(),
    });
    onClose();
  };

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.cardTitle}>Meta Ads Campaign - {dayLabel}</h3>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            <input
              className={styles.input}
              placeholder="Campaign Name"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              required
            />
            <select className={styles.select} value={adType} onChange={(e) => setAdType(e.target.value)} required>
              {adTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <select className={styles.select} value={platform} onChange={(e) => setPlatform(e.target.value)} required>
              {metaFormatOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <div className={styles.inlineField}>
              <select
                className={styles.select}
                value={budgetType}
                onChange={(e) => setBudgetType(e.target.value)}
                required
              >
                <option value="Daily">Daily</option>
                <option value="Total">Total</option>
              </select>
              <input
                className={styles.input}
                placeholder="Budget Amount"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                required
              />
            </div>
            <input
              type="date"
              className={styles.input}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
            <input
              type="date"
              className={styles.input}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
            <input
              className={styles.input}
              placeholder="Target Audience"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              required
            />
            <input
              className={styles.input}
              placeholder="Objective"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              required
            />
            <select className={styles.select} value={status} onChange={(e) => setStatus(e.target.value)} required>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className={styles.noteGroup} style={{ marginTop: 16 }}>
            <label className={styles.cardSub} htmlFor="meta-content-plan">
              Post / Video / Content Plan
            </label>
            <textarea
              id="meta-content-plan"
              className={styles.textarea}
              value={contentPlan}
              onChange={(e) => setContentPlan(e.target.value)}
              placeholder="Instagram Post, YouTube Video, Product Photography, etc..."
              rows={4}
            />
          </div>

          <div className={styles.modalActions}>
            <button type="button" className={styles.buttonGhost} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.buttonPrimary}>
              {initialValue ? "Save changes" : "Add campaign"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MetaCampaignDetailsModal({ open, onClose, campaigns, onEdit, onDelete, readOnly = false }) {
  if (!open) return null;
  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.cardTitle}>Campaign Details</h3>
        {campaigns.length === 0 ? (
          <p className={styles.cardSub}>No campaigns for this day.</p>
        ) : (
          <div className={styles.metaDetailsList}>
            {campaigns.map((campaign) => (
              <article key={campaign.id} className={styles.metaDetailsCard}>
                <div className={styles.row}>
                  <span className={`${styles.metaPill} ${statusToClass(campaign.metaStatus)}`}>{campaign.adType}</span>
                  <span className={styles.metaMuted}>{normalizeFormat(campaign.platform)}</span>
                </div>
                <h4 className={styles.metaTitle}>{campaign.campaignName}</h4>
                <p className={styles.metaInfo}>
                  Budget: {campaign.budgetType} - {campaign.budgetAmount}
                </p>
                <p className={styles.metaInfo}>
                  Dates: {campaign.startDate} to {campaign.endDate}
                </p>
                <p className={styles.metaInfo}>Audience: {campaign.targetAudience}</p>
                <p className={styles.metaInfo}>Objective: {campaign.objective}</p>
                <p className={styles.metaInfo}>Status: {campaign.metaStatus}</p>
                {campaign.contentPlan && (
                  <p className={styles.metaInfo}>
                    <strong>Content Plan:</strong><br />
                    <span style={{ whiteSpace: "pre-wrap" }}>{campaign.contentPlan}</span>
                  </p>
                )}
                {!readOnly ? (
                  <div className={styles.modalActions}>
                    <button type="button" className={styles.buttonGhost} onClick={() => onEdit(campaign)}>
                      Edit
                    </button>
                    <button type="button" className={styles.buttonDanger} onClick={() => onDelete(campaign)}>
                      Delete
                    </button>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
        <div className={styles.modalActions}>
          <button type="button" className={styles.buttonPrimary} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MetaAdsCalendar({ store, onAdd, onUpdate, onDelete, title, readOnly = false }) {
  const [monthDate, setMonthDate] = useState(new Date());
  const [activeDay, setActiveDay] = useState(null);
  const [showAdTypePicker, setShowAdTypePicker] = useState(false);
  const [selectedAdType, setSelectedAdType] = useState(adTypeOptions[0]);
  const [formOpen, setFormOpen] = useState(false);
  const [editCampaign, setEditCampaign] = useState(null);
  const [detailsDay, setDetailsDay] = useState(null);
  const [filters, setFilters] = useState({ adType: "all", platform: "all", status: "all" });

  const days = getMonthDays(monthDate);
  const monthLabel = formatMonthLabel(monthDate);

  const withDayItems = (day) => {
    const items = store[getDateKey(monthDate, day)] || [];
    return items.filter((item) => {
      if (filters.adType !== "all" && item.adType !== filters.adType) return false;
      if (filters.platform !== "all" && normalizeFormat(item.platform) !== filters.platform) return false;
      if (filters.status !== "all" && item.metaStatus !== filters.status) return false;
      return true;
    });
  };

  const openAddFlow = (day) => {
    setActiveDay(day);
    setEditCampaign(null);
    setSelectedAdType(adTypeOptions[0]);
    setShowAdTypePicker(true);
  };

  const openEditFlow = (campaign) => {
    setEditCampaign(campaign);
    setSelectedAdType(campaign.adType);
    setFormOpen(true);
  };

  const handleSubmit = (payload) => {
    if (readOnly) return;
    if (!activeDay) return;
    const key = getDateKey(monthDate, activeDay);
    if (editCampaign) {
      if (onUpdate) onUpdate(editCampaign.id, { ...payload, dateKey: key });
      return;
    }
    if (onAdd) onAdd({ ...payload, dateKey: key });
  };

  const handleDelete = (campaign) => {
    if (readOnly) return;
    if (!activeDay) return;
    if (onDelete) onDelete(campaign.id);
  };

  return (
    <section className={styles.card}>
      <div className={styles.calendarHeader}>
        <div>
          <h2 className={styles.cardTitle}>{title ?? "Meta Ads Calendar"}</h2>
          <p className={styles.cardSub}>
            {readOnly ? "View only — campaign updates from your agency." : "Campaign planner for Meta Ads only"}
          </p>
        </div>
        <CalendarMonthNav monthDate={monthDate} onMonthDateChange={setMonthDate} />
      </div>

      <div className={styles.metaFilters}>
        <select
          className={styles.select}
          value={filters.adType}
          onChange={(e) => setFilters((prev) => ({ ...prev, adType: e.target.value }))}
        >
          <option value="all">All Ad Types</option>
          {adTypeOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <select
          className={styles.select}
          value={filters.platform}
          onChange={(e) => setFilters((prev) => ({ ...prev, platform: e.target.value }))}
        >
          <option value="all">All formats</option>
          {metaFormatOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <select
          className={styles.select}
          value={filters.status}
          onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
        >
          <option value="all">All Status</option>
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.calendarGrid}>
        {Array.from({ length: days }, (_, i) => i + 1).map((day) => {
          const dayItems = withDayItems(day);
          return (
            <div
              key={day}
              className={`${styles.calendarDay} ${styles.metaDay}`}
              onClick={() => {
                setActiveDay(day);
                setDetailsDay(day);
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  setActiveDay(day);
                  setDetailsDay(day);
                }
              }}
            >
              <div className={styles.calendarDayTop}>
                <span className={styles.dayNumber}>{day}</span>
                {readOnly ? null : (
                  <button
                    type="button"
                    className={styles.miniBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      openAddFlow(day);
                    }}
                  >
                    +
                  </button>
                )}
              </div>
              <div className={styles.metaDayStack}>
                {dayItems.map((item) => (
                  <div key={item.id} className={`${styles.metaChip} ${statusToClass(item.metaStatus)}`}>
                    <span className={styles.metaChipType}>{item.adType}</span>
                    <span className={styles.metaChipName}>{item.campaignName}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {showAdTypePicker && !readOnly && (
        <div className={styles.modalBackdrop} onClick={() => setShowAdTypePicker(false)}>
          <div className={styles.modalSmall} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.cardTitle}>Choose Ad Type</h3>
            <p className={styles.cardSub}>Selected day: {activeDay} {monthLabel}</p>
            <select
              className={styles.select}
              value={selectedAdType}
              onChange={(e) => setSelectedAdType(e.target.value)}
            >
              {adTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <div className={styles.modalActions}>
              <button type="button" className={styles.buttonGhost} onClick={() => setShowAdTypePicker(false)}>
                Cancel
              </button>
              <button
                type="button"
                className={styles.buttonPrimary}
                onClick={() => {
                  setShowAdTypePicker(false);
                  setFormOpen(true);
                }}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      <MetaAdsFormModal
        open={formOpen && !readOnly}
        onClose={() => {
          setFormOpen(false);
          setEditCampaign(null);
        }}
        onSubmit={handleSubmit}
        initialValue={editCampaign}
        initialAdType={selectedAdType}
        dayLabel={activeDay ? `${activeDay} ${monthLabel}` : monthLabel}
      />

      <MetaCampaignDetailsModal
        open={detailsDay !== null}
        readOnly={readOnly}
        onClose={() => setDetailsDay(null)}
        campaigns={detailsDay ? withDayItems(detailsDay) : []}
        onEdit={(campaign) => {
          setDetailsDay(null);
          openEditFlow(campaign);
        }}
        onDelete={(campaign) => {
          handleDelete(campaign);
        }}
      />
    </section>
  );
}
