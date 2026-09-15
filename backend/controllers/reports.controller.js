const Report = require("../models/Report");
const Staff = require("../models/Staff");
const mongoose = require("mongoose");

// Helper to get today's date in YYYY-MM-DD
const toIsoDateString = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

exports.createReport = async (req, res) => {
  try {
    const { clientId, status, contentType, additionalNotes, date } = req.body;
    if (!clientId || !status || !contentType) {
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    let reportDate = date;
    if (!reportDate) {
      reportDate = toIsoDateString();
    } else {
      const regex = /^\d{4}-\d{2}-\d{2}$/;
      if (!regex.test(reportDate)) {
        return res.status(400).json({ success: false, message: "Invalid date format. Expected YYYY-MM-DD." });
      }
    }

    const report = await Report.create({
      staffId: req.user.userId,
      clientId,
      date: reportDate,
      status,
      contentType,
      additionalNotes,
    });

    res.status(201).json({ success: true, data: report });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to submit daily report." });
  }
};

exports.getReportsByDate = async (req, res) => {
  try {
    const { date } = req.params;
    
    // Find reports for this date.
    // If admin, find all reports. If staff, find only their reports.
    let filter = { date };
    if (req.user.role !== "admin") {
      filter.staffId = req.user.userId;
    }

    const rawReports = await Report.find(filter).populate("clientId", "name");
    
    // Format reports for frontend
    const reports = rawReports.map(r => ({
      _id: r._id,
      staffId: r.staffId,
      clientId: r.clientId,
      clientName: r.clientId?.name || "",
      date: r.date,
      status: r.status,
      contentType: r.contentType,
      additionalNotes: r.additionalNotes,
    }));

    let staffStatus = [];
    if (req.user.role === "admin") {
      const allStaff = await Staff.find().populate("userId");
      
      allStaff.forEach(staff => {
        const staffUserId = staff.userId?._id ? staff.userId._id.toString() : (staff.userId ? staff.userId.toString() : null);
        if (!staffUserId) return; // Skip orphaned staff

        const staffReports = reports.filter(r => r.staffId.toString() === staffUserId);
        
        if (staffReports.length === 0) {
          staffStatus.push({
            staffId: staffUserId,
            name: staff.name,
            role: staff.role,
            report: null,
          });
        } else {
          staffReports.forEach(r => {
            staffStatus.push({
              staffId: `${staffUserId}_${r._id}`, // unique key for frontend
              name: staff.name,
              role: staff.role,
              report: r,
            });
          });
        }
      });
    }

    // Calculate stats
    let stats = { totalReports: 0, submitted: 0, pending: 0, issues: 0 };
    
    if (req.user.role === "admin") {
      // Calculate stats based on unique valid staff members
      const uniqueValidStaffIds = new Set(staffStatus.map(s => s.staffId.split('_')[0]));
      const staffIdsWithReports = new Set(reports.map(r => r.staffId.toString()));
      
      stats.totalReports = uniqueValidStaffIds.size;
      stats.submitted = staffIdsWithReports.size;
      stats.pending = uniqueValidStaffIds.size - staffIdsWithReports.size;
      stats.issues = reports.filter(r => r.status === "issue" || r.status === "team_issues").length;
    } else {
      stats.totalReports = reports.length;
      stats.submitted = reports.length;
      stats.pending = 0;
      stats.issues = reports.filter(r => r.status === "issue" || r.status === "team_issues").length;
    }

    res.json({
      success: true,
      data: {
        stats,
        reports,
        staffStatus,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch reports." });
  }
};

exports.updateReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { clientId, status, contentType, additionalNotes } = req.body;

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ success: false, message: "Report not found." });
    }

    if (req.user.role !== "admin" && report.staffId.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: "Not authorized to update this report." });
    }

    if (clientId) report.clientId = clientId;
    if (status) report.status = status;
    if (contentType) report.contentType = contentType;
    if (additionalNotes !== undefined) report.additionalNotes = additionalNotes;

    await report.save();
    res.json({ success: true, data: report });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to update report." });
  }
};

exports.deleteReport = async (req, res) => {
  try {
    const { id } = req.params;
    
    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ success: false, message: "Report not found." });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized to delete this report." });
    }

    await report.deleteOne();
    res.json({ success: true, message: "Report deleted." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to delete report." });
  }
};
