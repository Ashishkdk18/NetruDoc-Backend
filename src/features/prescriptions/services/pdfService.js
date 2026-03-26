import PDFDocument from 'pdfkit';

/**
 * PDF Service for Prescription Generation
 */
export class PDFService {
  /**
   * Generate prescription PDF
   * @param {Object} prescription - Prescription object with populated patientId and doctorId
   * @returns {Promise<Buffer>}
   */
  async generatePrescriptionPDF(prescription) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const buffers = [];
        
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });
        doc.on('error', reject);

        // Header
        doc.fontSize(20).text('PRESCRIPTION', { align: 'center' });
        doc.moveDown();
        doc.fontSize(10).text('NetruDoc - Digital Healthcare Platform', { align: 'center' });
        doc.moveDown(2);

        // Patient Information
        const patient = prescription.patientId;
        doc.fontSize(14).text('Patient Information', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(11);
        doc.text(`Name: ${patient?.name || 'N/A'}`);
        if (patient?.dateOfBirth) {
          const dob = new Date(patient.dateOfBirth);
          doc.text(`Date of Birth: ${dob.toLocaleDateString()}`);
        }
        if (patient?.phone) {
          doc.text(`Phone: ${patient.phone}`);
        }
        if (patient?.email) {
          doc.text(`Email: ${patient.email}`);
        }
        if (patient?.address) {
          const address = typeof patient.address === 'object'
            ? Object.values(patient.address).filter(Boolean).join(', ')
            : patient.address;
          if (address) {
            doc.text(`Address: ${address}`);
          }
        }
        doc.moveDown();

        // Doctor Information
        const doctor = prescription.doctorId;
        doc.fontSize(14).text('Prescribing Doctor', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(11);
        doc.text(`Name: Dr. ${doctor?.name || 'N/A'}`);
        if (doctor?.specialization) {
          doc.text(`Specialization: ${doctor.specialization.replace('-', ' ').toUpperCase()}`);
        }
        if (doctor?.licenseNumber) {
          doc.text(`License Number: ${doctor.licenseNumber}`);
        }
        doc.moveDown();

        // Prescription Date
        const prescriptionDate = new Date(prescription.createdAt);
        doc.fontSize(11).text(`Prescription Date: ${prescriptionDate.toLocaleDateString()}`, { align: 'right' });
        doc.moveDown(2);

        // Medications
        doc.fontSize(14).text('Medications', { underline: true });
        doc.moveDown(0.5);
        
        if (prescription.medications && prescription.medications.length > 0) {
          prescription.medications.forEach((med, index) => {
            doc.fontSize(11);
            doc.text(`${index + 1}. ${med.name}`, { continued: false });
            doc.fontSize(10);
            doc.text(`   Dosage: ${med.dosage}`, { indent: 20 });
            doc.text(`   Frequency: ${med.frequency}`, { indent: 20 });
            doc.text(`   Duration: ${med.duration}`, { indent: 20 });
            if (med.instructions) {
              doc.text(`   Instructions: ${med.instructions}`, { indent: 20 });
            }
            doc.moveDown(0.5);
          });
        } else {
          doc.fontSize(10).text('No medications prescribed', { indent: 20 });
        }
        doc.moveDown();

        // Diagnoses
        doc.fontSize(14).text('Diagnoses', { underline: true });
        doc.moveDown(0.5);
        
        if (prescription.diagnoses && prescription.diagnoses.length > 0) {
          prescription.diagnoses.forEach((diag, index) => {
            doc.fontSize(11);
            if (typeof diag === 'object') {
              doc.text(`${index + 1}. ${diag.condition}`, { indent: 20 });
              if (diag.icdCode) {
                doc.fontSize(10).text(`   ICD Code: ${diag.icdCode}`, { indent: 30 });
              }
              if (diag.notes) {
                doc.text(`   Notes: ${diag.notes}`, { indent: 30 });
              }
            } else {
              doc.text(`${index + 1}. ${diag}`, { indent: 20 });
            }
            doc.moveDown(0.5);
          });
        } else {
          doc.fontSize(10).text('No diagnoses recorded', { indent: 20 });
        }
        doc.moveDown();

        // Notes
        if (prescription.notes) {
          doc.fontSize(14).text('Additional Notes', { underline: true });
          doc.moveDown(0.5);
          doc.fontSize(11).text(prescription.notes, { indent: 20 });
          doc.moveDown();
        }

        // Follow-up Date
        if (prescription.followUpDate) {
          const followUpDate = new Date(prescription.followUpDate);
          doc.fontSize(11).text(`Follow-up Date: ${followUpDate.toLocaleDateString()}`);
          doc.moveDown();
        }

        // Footer
        doc.moveDown(2);
        doc.fontSize(8).text(`Prescription ID: ${prescription._id || prescription.id}`, { align: 'center' });
        doc.text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}
