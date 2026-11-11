'use strict';

const config = require('../config/env');
const whatsapp = require('./whatsapp');

function currency(n) {
  return 'KES ' + Number(n || 0).toLocaleString('en-KE');
}

function fmtDate(d) {
  if (!d) return 'TBA';
  const date = new Date(d);
  return Number.isNaN(date.getTime()) ? 'TBA' : date.toDateString();
}

// Renders a quotation or receipt as a PDF Buffer.
function renderDoc({ kind, booking, trip }) {
  return new Promise((resolve, reject) => {
    try {
      // Required lazily so the app boots even if pdfkit isn't installed yet.
      const PDFDocument = require('pdfkit');
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const isReceipt = kind === 'receipt';
      const title = isReceipt ? 'Payment Receipt' : 'Booking Quotation';

      doc.fontSize(20).fillColor('#0b7285').text(config.brand.name);
      doc.moveDown(0.2);
      doc.fontSize(14).fillColor('#333').text(title);
      doc.moveDown(0.5);
      doc.fontSize(9).fillColor('#888')
        .text(`Reference: ${booking._id}`)
        .text(`Date: ${new Date().toLocaleString('en-KE')}`);
      doc.moveDown();

      doc.fontSize(11).fillColor('#000').text('Traveller', { underline: true });
      doc.fontSize(10).fillColor('#333')
        .text(`Name: ${booking.fullName}`)
        .text(`Email: ${booking.email}`)
        .text(`Phone: ${booking.phone}`);
      doc.moveDown();

      doc.fontSize(11).fillColor('#000').text('Trip', { underline: true });
      doc.fontSize(10).fillColor('#333')
        .text(`${trip.title}`)
        .text(`Dates: ${fmtDate(trip.startDate)} - ${fmtDate(trip.endDate)}`)
        .text(`Meeting point: ${trip.meetingPoint || 'TBA'}`);
      doc.moveDown();

      doc.fontSize(11).fillColor('#000').text('Summary', { underline: true });
      doc.fontSize(10).fillColor('#333')
        .text(`Full price: ${currency(trip.fullPrice)}`)
        .text(`Payment type: ${booking.paymentType}`)
        .text(`${isReceipt ? 'Amount paid' : 'Amount due now'}: ${currency(booking.amountPaid)}`)
        .text(`Balance: ${currency(booking.amountDue)}${trip.balanceDueDate ? ' (due by ' + fmtDate(trip.balanceDueDate) + ')' : ''}`);
      doc.moveDown(1.5);

      doc.fontSize(9).fillColor('#888').text(
        isReceipt
          ? 'Thank you. This confirms your booking. Any balance is due before departure.'
          : 'This is a quotation, not a payment confirmation. Our team will contact you to finalise your booking.'
      );
      doc.moveDown(0.5);
      doc.fontSize(9).fillColor('#888').text(`Questions? ${config.brand.supportEmail}`);
      whatsapp.pdfLine(doc, whatsapp.text.groupBooking(booking, trip));

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// Custom-itinerary quote (trip planner requests).
function buildTripQuotePdf(request) {
  return new Promise((resolve, reject) => {
    try {
      const PDFDocument = require('pdfkit');
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const q = request.quote || {};
      doc.fontSize(20).fillColor('#0b2642').text(config.brand.name);
      doc.moveDown(0.2);
      doc.fontSize(14).fillColor('#333').text('Your Watamu trip — quotation');
      doc.moveDown(0.5);
      doc.fontSize(9).fillColor('#888')
        .text(`Reference: ${request.reference}`)
        .text(`Issued: ${new Date().toLocaleDateString('en-KE')}`)
        .text(q.validUntil ? `Valid until: ${fmtDate(q.validUntil)}` : '');
      doc.moveDown();

      doc.fontSize(11).fillColor('#000').text('For', { underline: true });
      doc.fontSize(10).fillColor('#333')
        .text(request.contact.name)
        .text(request.contact.email)
        .text(`${request.adults} adult(s)${request.children ? `, ${request.children} child(ren)` : ''}`)
        .text(request.arrival ? `Dates: ${fmtDate(request.arrival)} - ${fmtDate(request.departure)}` : 'Dates: flexible');
      doc.moveDown();

      doc.fontSize(11).fillColor('#000').text('Itinerary', { underline: true });
      (request.days || []).forEach((d, i) => {
        doc.fontSize(10).fillColor('#0b2642').text(d.label || `Day ${i + 1}`);
        if (!d.items.length) doc.fontSize(9).fillColor('#888').text('   Free day');
        d.items.forEach((it) => doc.fontSize(9).fillColor('#333').text(`   • ${it.title}`));
      });
      if ((request.ideas || []).length) {
        doc.fontSize(10).fillColor('#0b2642').text('Stays, extras & unscheduled');
        request.ideas.forEach((it) => doc.fontSize(9).fillColor('#333').text(`   • ${it.title}`));
      }
      doc.moveDown();

      doc.fontSize(11).fillColor('#000').text('Price', { underline: true });
      (q.lines || []).forEach((l) => {
        const y = doc.y;
        doc.fontSize(10).fillColor('#333').text(l.label, 50, y, { width: 360 });
        doc.text(currency(l.amount), 420, y, { width: 125, align: 'right' });
      });
      doc.moveDown(0.5);
      doc.fontSize(12).fillColor('#000').text(`Total: ${currency(q.total)}`, { align: 'right' });
      doc.moveDown(1.5);

      if (q.message) {
        doc.fontSize(10).fillColor('#333').text(q.message);
        doc.moveDown();
      }
      doc.fontSize(9).fillColor('#888').text(
        'This is a quotation, not an invoice. Reply to accept and our team will confirm your bookings and how to pay.'
      );
      doc.moveDown(0.5);
      doc.fontSize(9).fillColor('#888').text(`Questions? ${config.brand.supportEmail}`);
      whatsapp.pdfLine(doc, whatsapp.text.tripQuote(request.reference));
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

const buildQuotationPdf = (booking, trip) => renderDoc({ kind: 'quotation', booking, trip });
const buildReceiptPdf = (booking, trip) => renderDoc({ kind: 'receipt', booking, trip });

module.exports = { buildQuotationPdf, buildReceiptPdf, buildTripQuotePdf };
