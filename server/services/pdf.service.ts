import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

export interface ReceiptData {
  donorName: string;
  donorEmail: string;
  amount: number;
  transactionId: string;
  date: Date;
}

export async function generateReceiptPDF(
  data: ReceiptData
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 0 });

    const buffers: Buffer[] = [];
    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    // ===== COLORS =====
    const primary = "#F26522";
    const dark = "#2C3E50";
    const green = "#27AE60";
    const grey = "#7B8A8B";
    const lightBg = "#F4F6F7";

    // ===== HEADER =====
    doc.rect(0, 0, 612, 140).fill(primary);
    doc.rect(0, 140, 612, 4).fill(green);

    // ===== LOGO =====
    const logoPath = path.join(process.cwd(), "client/public/logo.png");

    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 40, 20, { width: 100 });
    } else {
      doc.circle(90, 70, 35).fill("#fff");
      doc.fillColor(primary).fontSize(20).text("PY", 75, 60);
    }

    // ===== ORG NAME =====
    doc.fillColor("#fff")
      .font("Helvetica-Bold")
      .fontSize(28)
      .text("Prayas Yavatmal", 160, 30);

    doc.font("Helvetica")
      .fontSize(11)
      .text("Empowering Communities | Transforming Lives", 160, 65);

    // ===== TITLE =====
    doc.fillColor(dark)
      .font("Helvetica-Bold")
      .fontSize(26)
      .text("DONATION RECEIPT", 0, 170, { align: "center" });

    doc.fillColor(grey)
      .fontSize(11)
      .text("Official Tax Receipt", 0, 200, { align: "center" });

    // ===== WATERMARK =====
    doc.save();
    doc.rotate(-45, { origin: [306, 421] });
    doc.fontSize(80)
      .fillColor("#F0F0F0")
      .opacity(0.1)
      .text("PRAYAS YAVATMAL", 150, 400);
    doc.restore();

    // ===== AMOUNT BOX =====
    const boxY = 235;

    doc.roundedRect(55, boxY, 500, 110, 8).fill(lightBg);
    doc.roundedRect(55, boxY, 500, 110, 8).lineWidth(2).stroke(primary);

    doc.fillColor(grey)
      .fontSize(11)
      .text("TOTAL DONATION AMOUNT", 0, boxY + 18, { align: "center" });

    // ✅ ===== FIXED AMOUNT RENDERING =====
    const amountNumber = data.amount.toLocaleString("en-IN");

    doc.font("Helvetica-Bold");

    const symbolSize = 32;
    const numberSize = 38;

    // Use "Rs." instead of ₹ symbol for PDF compatibility
    const symbolText = "Rs. ";
    const symbolWidth = doc.fontSize(symbolSize).widthOfString(symbolText);
    const numberWidth = doc.fontSize(numberSize).widthOfString(amountNumber);

    const totalWidth = symbolWidth + numberWidth;

    const startX = (612 - totalWidth) / 2;

    // draw Rs. symbol
    doc.fontSize(symbolSize)
      .fillColor(primary)
      .text(symbolText, startX, boxY + 42, { lineBreak: false });

    // draw number
    doc.fontSize(numberSize)
      .text(amountNumber, startX + symbolWidth, boxY + 38, {
        lineBreak: false,
      });

    doc.fillColor(green)
      .fontSize(11)
      .text("✓ PAYMENT VERIFIED", 0, boxY + 80, { align: "center" });

    // ===== DONOR DETAILS =====
    let y = 380;

    doc.fillColor(dark)
      .font("Helvetica-Bold")
      .fontSize(14)
      .text("Donor Details", 55, y);

    doc.moveTo(55, y + 18)
      .lineTo(555, y + 18)
      .lineWidth(1.5)
      .stroke(primary);

    y += 35;

    const label = (title: string, value: string) => {
      doc.font("Helvetica")
        .fontSize(11)
        .fillColor(grey)
        .text(title, 55, y);

      doc.font("Helvetica-Bold")
        .fillColor(dark)
        .text(value, 200, y);

      y += 26;
    };

    label("Full Name", data.donorName);
    label("Email Address", data.donorEmail);

    // ===== TRANSACTION DETAILS =====
    y += 20;

    doc.font("Helvetica-Bold")
      .fillColor(dark)
      .fontSize(14)
      .text("Transaction Details", 55, y);

    doc.moveTo(55, y + 18)
      .lineTo(555, y + 18)
      .lineWidth(1.5)
      .stroke(primary);

    y += 35;

    label("Transaction ID", data.transactionId);
    label(
      "Payment Date",
      data.date.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    );
    label("Payment Time", data.date.toLocaleTimeString("en-IN"));

    doc.font("Helvetica")
      .fillColor(grey)
      .text("Payment Status", 55, y);

    doc.font("Helvetica-Bold")
      .fillColor(green)
      .text("SUCCESS", 200, y);

    // ===== THANK YOU BOX =====
    y += 35;

    doc.roundedRect(55, y, 500, 65, 8).fill("#ECF9F1");

    doc.fillColor(dark)
      .font("Helvetica-Bold")
      .fontSize(12)
      .text("Thank You for Your Generosity!", 0, y + 12, {
        align: "center",
      });

    doc.font("Helvetica")
      .fontSize(9)
      .fillColor(grey)
      .text(
        "Your contribution helps support education, healthcare, and sustainable development initiatives in our community.",
        90,
        y + 30,
        { align: "center", width: 430 }
      );

    // ===== FOOTER =====
    doc.rect(0, 770, 612, 72).fill(dark);

    doc.fillColor("#fff")
      .fontSize(9)
      .text("Prayas Yavatmal", 0, 785, { align: "center" });

    doc.fillColor("#BDC3C7")
      .fontSize(8)
      .text(
        "Community Development • Social Welfare • Environmental Conservation",
        0,
        800,
        { align: "center" }
      );

    doc.text(
      "info@prayasyavatmal.org  |  www.prayasyavatmal.org",
      0,
      812,
      { align: "center" }
    );

    doc.fillColor("#95A5A6")
      .fontSize(7)
      .text(
        "This is a system generated receipt. No signature required.",
        0,
        825,
        { align: "center" }
      );

    doc.end();
  });
}
