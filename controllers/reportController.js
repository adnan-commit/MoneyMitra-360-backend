import PDFDocument from "pdfkit";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import FinancialAnalysis from "../models/FinancialAnalysis.js";
import Statement from "../models/Statements.js";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";

// Chart Configuration
const width = 800;
const height = 400;
const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour: 'white' });

export const downloadReport = async (req, res) => {
  try {
    const { statementId } = req.params;
    const userId = req.userId;

    // 1. Fetch Data
    const user = await User.findById(userId);
    const statement = await Statement.findOne({ _id: statementId, user: userId });
    const analysis = await FinancialAnalysis.findOne({ statement: statementId, user: userId });
    
    // Fetch ALL transactions for the table (not just top 20) to make the report useful
    const transactions = await Transaction.find({ statement: statementId, user: userId }).sort({ date: -1 });

    if (!statement || !analysis) {
      return res.status(404).json({ message: "Report data not found" });
    }

    // 2. Setup PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=MoneyMitra_Report_${statement.fileName}.pdf`);

    doc.pipe(res);

    // --- Design Constants ---
    const colors = {
      primary: "#1e3a8a",   // Dark Blue
      secondary: "#64748b", // Slate Gray
      accent: "#10b981",    // Emerald Green
      danger: "#ef4444",    // Red
      lightBg: "#f1f5f9",   // Light Gray for boxes
      white: "#ffffff"
    };

    // --- HELPER: Draw Header ---
    const drawHeader = (title) => {
        doc.rect(0, 0, 600, 50).fill(colors.primary);
        doc.fontSize(16).fillColor(colors.white).text(title, 50, 18);
        doc.fontSize(10).fillColor(colors.white).text("MoneyMitra 360", 450, 22, { align: "right" });
        doc.moveDown(4);
    };

    /* ================= PAGE 1: COVER PAGE ================= */
    
    // Background Strip
    doc.rect(0, 0, 600, 842).fill(colors.white);
    
    // Logo / Brand Area
    doc.rect(0, 0, 600, 250).fill(colors.primary);
    doc.fontSize(40).fillColor(colors.white).text("MoneyMitra 360", 0, 100, { align: "center" });
    doc.fontSize(14).fillColor("#93c5fd").text("Financial Intelligence Report", 0, 150, { align: "center" });

    // Report Title
    doc.moveDown(12);
    doc.fillColor("black").fontSize(26).font("Helvetica-Bold").text("Statement Analysis", { align: "center" });
    doc.fontSize(12).font("Helvetica").fillColor("gray").text(`Generated on: ${new Date().toLocaleDateString()}`, { align: "center" });

    // Client Info Box
    doc.moveDown(3);
    const boxX = 150;
    doc.rect(boxX, 480, 300, 120).fill(colors.lightBg);
    doc.strokeColor(colors.secondary).lineWidth(1).rect(boxX, 480, 300, 120).stroke();

    doc.fillColor(colors.primary).fontSize(12).font("Helvetica-Bold").text("PREPARED FOR", boxX, 500, { align: "center", width: 300 });
    doc.fillColor("black").fontSize(16).text(user.name, boxX, 525, { align: "center", width: 300 });
    doc.fillColor("gray").fontSize(10).font("Helvetica").text(user.email, boxX, 545, { align: "center", width: 300 });
    
    doc.fillColor("black").fontSize(10).text(`File: ${statement.fileName}`, boxX, 570, { align: "center", width: 300 });

    doc.addPage();

    /* ================= PAGE 2: EXECUTIVE DASHBOARD ================= */
    
    drawHeader("Executive Dashboard");

    // 1. Financial Score Section
    doc.font("Helvetica-Bold").fontSize(14).fillColor(colors.primary).text("Financial Health Score");
    doc.moveDown(0.5);

    // Score Circle
    const scoreColor = analysis.financialScore >= 75 ? colors.accent : analysis.financialScore >= 50 ? "#f59e0b" : colors.danger;
    
    doc.circle(100, 150, 40).lineWidth(5).strokeColor(scoreColor).stroke();
    doc.fontSize(24).fillColor(scoreColor).text(analysis.financialScore, 75, 138, { align: "center", width: 50 });
    doc.fontSize(10).fillColor(colors.secondary).text(" / 100", 75, 165, { align: "center", width: 50 });

    // Score Text Context
    doc.fontSize(12).fillColor("black").text(`Status: ${analysis.financialStatus}`, 170, 130);
    doc.fontSize(10).fillColor("gray").text("Based on your savings, spending patterns, and recurring expenses.", 170, 150, { width: 300 });

    // 2. Key Metrics Grid
    const startY = 220;
    const cardWidth = 150;
    const cardHeight = 70;
    const gap = 30;

    // Helper to draw metric card
    const drawMetricCard = (x, title, value, color) => {
        doc.rect(x, startY, cardWidth, cardHeight).fill(colors.lightBg);
        doc.rect(x, startY, 5, cardHeight).fill(color); // Colored strip
        doc.fontSize(10).fillColor(colors.secondary).text(title, x + 15, startY + 15);
        doc.fontSize(18).fillColor("black").font("Helvetica-Bold").text(value, x + 15, startY + 35);
    };

    drawMetricCard(50, "Savings Rate", `${analysis.savingsRate}%`, colors.accent);
    drawMetricCard(50 + cardWidth + gap, "Recurring Bills", `${analysis.recurringRatio}%`, "#f59e0b");
    drawMetricCard(50 + (cardWidth + gap) * 2, "Risk Level", analysis.riskLevel, analysis.riskLevel === "Low" ? colors.accent : colors.danger);

    // 3. AI Insights
    doc.moveDown(8);
    doc.font("Helvetica-Bold").fontSize(14).fillColor(colors.primary).text("AI-Powered Insights");
    doc.moveDown(0.5);
    
    // AI Box
    doc.rect(50, 340, 500, 150).fill("#fff7ed"); // Light Orange bg for insights
    doc.rect(50, 340, 500, 150).strokeColor("#fdba74").stroke();
    
    const aiText = analysis.aiSummary.replace(/###/g, "").replace(/\*\*/g, "").replace(/\-/g, "•"); 
    
    doc.fontSize(10).font("Helvetica").fillColor("#431407").text(aiText, 60, 350, { 
        width: 480, 
        align: 'justify',
        lineGap: 5
    });

    doc.addPage();

    /* ================= PAGE 3: VISUAL ANALYSIS ================= */
    
    drawHeader("Visual Analysis");

    // Chart 1: Income vs Expense
    const monthly = analysis.monthlyAnalytics || [];
    const months = monthly.map(m => m.month);
    
    const chartConfig1 = {
      type: "bar",
      data: {
        labels: months,
        datasets: [
          { label: "Income", data: monthly.map(m => m.income), backgroundColor: "#10b981" },
          { label: "Expense", data: monthly.map(m => m.expense), backgroundColor: "#ef4444" },
        ],
      },
      options: { plugins: { legend: { labels: { font: { size: 14 } } } } }
    };
    const chart1 = await chartJSNodeCanvas.renderToBuffer(chartConfig1);
    
    doc.image(chart1, 50, 100, { fit: [500, 220], align: "center" });
    doc.fontSize(10).fillColor("gray").text("Monthly Cashflow Trend", 250, 330);

    // Chart 2: Category Pie
    const categoryMap = {};
    transactions.filter(t => t.type === "DEBIT").forEach(t => {
        categoryMap[t.category] = (categoryMap[t.category] || 0) + Math.abs(t.amount);
    });
    
    const chartConfig2 = {
        type: "doughnut",
        data: {
            labels: Object.keys(categoryMap),
            datasets: [{
                data: Object.values(categoryMap),
                backgroundColor: ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"]
            }]
        }
    };
    const chart2 = await chartJSNodeCanvas.renderToBuffer(chartConfig2);
    
    doc.image(chart2, 150, 400, { fit: [300, 300], align: "center" }); // Centered Pie
    doc.fontSize(10).fillColor("gray").text("Expense Distribution by Category", 240, 700);

    doc.addPage();

    /* ================= PAGE 4+: TRANSACTION LEDGER (Smart Table) ================= */

    drawHeader("Detailed Transaction Ledger");

    const tableTop = 100;
    const colX = { date: 50, desc: 130, cat: 350, amt: 480 };
    const rowHeight = 25;
    let y = tableTop;

    // Helper: Draw Table Header
    const drawTableHeader = (posY) => {
        doc.rect(50, posY, 500, 20).fill(colors.lightBg);
        doc.fillColor("black").font("Helvetica-Bold").fontSize(9);
        doc.text("DATE", colX.date, posY + 6);
        doc.text("DESCRIPTION", colX.desc, posY + 6);
        doc.text("CATEGORY", colX.cat, posY + 6);
        doc.text("AMOUNT", colX.amt, posY + 6);
        doc.font("Helvetica"); // Reset font
        return posY + 25;
    };

    y = drawTableHeader(y);

    // Loop Transactions
    transactions.forEach((txn, i) => {
        // Check for Page Break
        if (y + rowHeight > doc.page.height - 50) {
            doc.addPage();
            drawHeader("Detailed Transaction Ledger (Contd.)");
            y = 100;
            y = drawTableHeader(y);
        }

        // Zebra Striping (Gray background for even rows)
        if (i % 2 === 0) {
            doc.rect(50, y - 5, 500, rowHeight).fill("#f9fafb"); 
        }

        const dateStr = new Date(txn.date).toLocaleDateString();
        const descStr = txn.description.length > 45 ? txn.description.substring(0, 42) + "..." : txn.description;
        const amountStr = `Rs. ${Math.abs(txn.amount).toLocaleString('en-IN')}`;
        const isDebit = txn.type === "DEBIT";

        doc.fillColor("black").fontSize(9);
        doc.text(dateStr, colX.date, y);
        doc.text(descStr, colX.desc, y);
        
        // Category Badge-like text
        doc.fillColor(colors.secondary).text(txn.category, colX.cat, y);

        // Amount Color
        doc.font("Helvetica-Bold").fillColor(isDebit ? colors.danger : colors.accent);
        doc.text(isDebit ? `-${amountStr}` : `+${amountStr}`, colX.amt, y);

        // Reset Font & Move Down
        doc.font("Helvetica"); 
        y += rowHeight;
    });

    /* ================= FOOTER (Global) ================= */
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        
        // Footer Line
        doc.moveTo(50, doc.page.height - 40).lineTo(550, doc.page.height - 40).strokeColor(colors.lightBg).stroke();
        
        doc.fontSize(8).fillColor("gray").text(
            `Confidential Report | Generated by MoneyMitra 360`,
            50,
            doc.page.height - 30,
            { align: "left" }
        );

        doc.text(
            `Page ${i + 1} of ${range.count}`,
            500,
            doc.page.height - 30,
            { align: "right" }
        );
    }

    doc.end();

  } catch (error) {
    console.error("PDF Error:", error);
    if (!res.headersSent) res.status(500).json({ message: "PDF Generation Failed" });
  }
};