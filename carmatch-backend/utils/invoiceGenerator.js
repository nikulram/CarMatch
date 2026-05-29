const PDFDocument = require("pdfkit");
const stream = require("stream");
const { promisify } = require("util");
const finished = promisify(stream.finished);

const LATE_FEE_PER_HOUR = 10; // $10/hour late

const generateInvoicePDF = async (user, cars, total, receiptId, date) => {
  const doc = new PDFDocument();
  const buffers = [];

  doc.on("data", (chunk) => buffers.push(chunk));

  // Header
  doc.fontSize(20).text("Vahana - Invoice", { align: "center" });
  doc.moveDown();
  doc.fontSize(12).text(`Receipt ID: ${receiptId}`);
  doc.text(`Date Issued: ${new Date(date).toLocaleString()}`);
  doc.text(`Customer: ${user.firstName} ${user.lastName}`);
  doc.text(`Email: ${user.email}`);
  doc.moveDown();

  let lateFeeTotal = 0;

  // Car Details
  cars.forEach((car, i) => {
    const isRental = !!car.rentalStart && !!car.rentalEnd;
    doc.fontSize(12).fillColor("black");

    doc.text(`${i + 1}. ${car.year} ${car.make} ${car.model}`);
    doc.text(`   Mode: ${car.rentalModeEnabled ? "RENT" : "BUY"}`);
    doc.text(`   Price ${car.rentalModeEnabled ? "Per Day" : "Total"}: $${car.price.toLocaleString()}`);

    if (isRental) {
      const start = new Date(car.rentalStart);
      const end = new Date(car.rentalEnd);
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      doc.text(`   Rental Period: ${start.toLocaleDateString()} → ${end.toLocaleDateString()} (${days} day${days > 1 ? "s" : ""})`);

      // Late Fee Check
      const now = new Date();
      if (now > end) {
        const hoursLate = Math.ceil((now - end) / (1000 * 60 * 60));
        const fee = hoursLate * LATE_FEE_PER_HOUR;
        doc.fillColor("red").text(`   LATE RETURN: ${hoursLate} hour(s) late - Fee: $${fee.toLocaleString()}`);
        doc.fillColor("black");
        lateFeeTotal += fee;
      }
    }

    doc.moveDown();
  });

  // Summary
  doc.moveDown();
  doc.fontSize(12).fillColor("black");
  doc.text(`Base Total (with 5% Vahana Fee): $${total.toLocaleString()}`, { align: "right" });

  if (lateFeeTotal > 0) {
    doc.fillColor("red").text(`Late Fees: $${lateFeeTotal.toLocaleString()}`, { align: "right" });
    doc.fillColor("black");
  }

  doc.fontSize(14).text(`Final Total: $${(total + lateFeeTotal).toLocaleString()}`, { align: "right" });

  doc.end();
  await finished(doc);
  return Buffer.concat(buffers);
};

module.exports = generateInvoicePDF;
