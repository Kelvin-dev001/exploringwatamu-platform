'use strict';

const config = require('../config/env');
const whatsapp = require('./whatsapp');
const i18n = require('../i18n');

// PDFs are in the traveller's language (booking.locale / request.locale,
// English when missing). Prices and amounts are exactly the stored values —
// only how they are written changes ("KES 12,000" / "12.000 KES").

// Renders a quotation or receipt as a PDF Buffer.
function renderDoc({ kind, booking, trip }) {
  return new Promise((resolve, reject) => {
    try {
      // Required lazily so the app boots even if pdfkit isn't installed yet.
      const PDFDocument = require('pdfkit');
      const L = i18n.forLocale(booking.locale);
      const currency = L.money;
      const fmtDate = (d) => L.date(d, L.t('tba'));
      const title = (L.locale === 'it' && trip.titleIt?.trim()) || trip.title;
      const doc = new PDFDocument({ size: 'A4', margin: 50, lang: L.locale === 'it' ? 'it-IT' : 'en-GB' });
      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const isReceipt = kind === 'receipt';

      doc.fontSize(20).fillColor('#0b7285').text(config.brand.name);
      doc.moveDown(0.2);
      doc.fontSize(14).fillColor('#333').text(L.t(isReceipt ? 'pdfReceipt' : 'pdfQuotation'));
      doc.moveDown(0.5);
      doc.fontSize(9).fillColor('#888')
        .text(L.t('pdfReference', { reference: booking._id }))
        .text(L.t('pdfDate', { date: new Date().toLocaleString(L.locale === 'it' ? 'it-IT' : 'en-KE') }));
      doc.moveDown();

      doc.fontSize(11).fillColor('#000').text(L.t('pdfTraveller'), { underline: true });
      doc.fontSize(10).fillColor('#333')
        .text(L.t('pdfName', { value: booking.fullName }))
        .text(L.t('pdfEmail', { value: booking.email }))
        .text(L.t('pdfPhone', { value: booking.phone }));
      doc.moveDown();

      doc.fontSize(11).fillColor('#000').text(L.t('pdfTrip'), { underline: true });
      doc.fontSize(10).fillColor('#333')
        .text(`${title}`)
        .text(L.t('pdfDates', { from: fmtDate(trip.startDate), to: fmtDate(trip.endDate) }))
        .text(L.t('pdfMeeting', { value: trip.meetingPoint || L.t('tba') }));
      doc.moveDown();

      doc.fontSize(11).fillColor('#000').text(L.t('pdfSummary'), { underline: true });
      doc.fontSize(10).fillColor('#333')
        .text(L.t('pdfFullPrice', { amount: currency(trip.fullPrice) }))
        .text(L.t('pdfPaymentType', { value: L.t(`payment.${booking.paymentType}`) === `payment.${booking.paymentType}` ? booking.paymentType : L.t(`payment.${booking.paymentType}`) }))
        .text(L.t(isReceipt ? 'pdfPaid' : 'pdfDueNow', { amount: currency(booking.amountPaid) }))
        .text(L.t('pdfBalance', { amount: currency(booking.amountDue) }) + (trip.balanceDueDate ? L.t('pdfDueBy', { date: fmtDate(trip.balanceDueDate) }) : ''));
      doc.moveDown(1.5);

      doc.fontSize(9).fillColor('#888').text(L.t(isReceipt ? 'pdfReceiptNote' : 'pdfQuotationNote'));
      doc.moveDown(0.5);
      doc.fontSize(9).fillColor('#888').text(L.t('questionsShort', { email: config.brand.supportEmail }));
      whatsapp.pdfLine(doc, whatsapp.text.groupBooking(booking, { title }, L.locale));

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
      const L = i18n.forLocale(request.locale);
      const currency = L.money;
      const fmtDate = (d) => L.date(d, L.t('tba'));
      const doc = new PDFDocument({ size: 'A4', margin: 50, lang: L.locale === 'it' ? 'it-IT' : 'en-GB' });
      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const q = request.quote || {};
      doc.fontSize(20).fillColor('#0b2642').text(config.brand.name);
      doc.moveDown(0.2);
      doc.fontSize(14).fillColor('#333').text(L.t('qpdfTitle'));
      doc.moveDown(0.5);
      doc.fontSize(9).fillColor('#888')
        .text(L.t('pdfReference', { reference: request.reference }))
        .text(L.t('qpdfIssued', { date: new Date().toLocaleDateString(L.locale === 'it' ? 'it-IT' : 'en-KE') }))
        .text(q.validUntil ? L.t('qpdfValid', { date: fmtDate(q.validUntil) }) : '');
      doc.moveDown();

      doc.fontSize(11).fillColor('#000').text(L.t('qpdfFor'), { underline: true });
      doc.fontSize(10).fillColor('#333')
        .text(request.contact.name)
        .text(request.contact.email)
        .text(`${L.t('qpdfAdults', { count: request.adults })}${request.children ? L.t('qpdfChildren', { count: request.children }) : ''}`)
        .text(request.arrival ? L.t('qpdfDates', { from: fmtDate(request.arrival), to: fmtDate(request.departure) }) : L.t('qpdfFlexible'));
      doc.moveDown();

      doc.fontSize(11).fillColor('#000').text(L.t('qpdfItinerary'), { underline: true });
      (request.days || []).forEach((d, i) => {
        const heading = L.locale === 'en' ? d.label || L.t('dayN', { n: i + 1 }) : dayHeadingIt(d, i, L);
        doc.fontSize(10).fillColor('#0b2642').text(heading);
        if (!d.items.length) doc.fontSize(9).fillColor('#888').text(L.t('qpdfFreeDay'));
        d.items.forEach((it) => doc.fontSize(9).fillColor('#333').text(`   • ${L.item(it.title)}`));
      });
      if ((request.ideas || []).length) {
        doc.fontSize(10).fillColor('#0b2642').text(L.t('ideas'));
        request.ideas.forEach((it) => doc.fontSize(9).fillColor('#333').text(`   • ${L.item(it.title)}`));
      }
      doc.moveDown();

      doc.fontSize(11).fillColor('#000').text(L.t('qpdfPrice'), { underline: true });
      (q.lines || []).forEach((l) => {
        const y = doc.y;
        doc.fontSize(10).fillColor('#333').text(l.label, 50, y, { width: 360 });
        doc.text(currency(l.amount), 420, y, { width: 125, align: 'right' });
      });
      doc.moveDown(0.5);
      doc.fontSize(12).fillColor('#000').text(L.t('qpdfTotal', { amount: currency(q.total) }), { align: 'right' });
      doc.moveDown(1.5);

      if (q.message) {
        doc.fontSize(10).fillColor('#333').text(q.message);
        doc.moveDown();
      }
      doc.fontSize(9).fillColor('#888').text(L.t('qpdfNote'));
      doc.moveDown(0.5);
      doc.fontSize(9).fillColor('#888').text(L.t('questionsShort', { email: config.brand.supportEmail }));
      whatsapp.pdfLine(doc, whatsapp.text.tripQuote(request.reference, L.locale));
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// "Giorno 2 · lun 11 gen" from the day's date (the website's own label is English).
function dayHeadingIt(d, i, L) {
  const base = L.t('dayN', { n: i + 1 });
  const when = d.date ? new Date(d.date) : null;
  return when && !Number.isNaN(when.getTime()) ? `${base} · ${when.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })}` : base;
}

const buildQuotationPdf = (booking, trip) => renderDoc({ kind: 'quotation', booking, trip });
const buildReceiptPdf = (booking, trip) => renderDoc({ kind: 'receipt', booking, trip });

module.exports = { buildQuotationPdf, buildReceiptPdf, buildTripQuotePdf };
