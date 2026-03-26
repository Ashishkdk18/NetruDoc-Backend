import { PrescriptionService } from '../services/prescriptionService.js';
import { PDFService } from '../services/pdfService.js';
import { AuditService } from '../../audit/services/auditService.js';
import { successResponse, errorResponse, paginatedSuccessResponse, RESPONSE_MESSAGES } from '../../../utils/response.js';

const prescriptionService = new PrescriptionService();
const pdfService = new PDFService();
const auditService = new AuditService();

// @desc    Get prescriptions
// @route   GET /api/prescriptions
// @access  Private
export const getPrescriptions = async (req, res) => {
  try {
    const filters = {
      userId: req.user._id,
      role: req.user.role,
      patientId: req.query.patientId,
      doctorId: req.query.doctorId,
      appointmentId: req.query.appointmentId
    };

    const pagination = {
      page: req.query.page || 1,
      limit: req.query.limit || 10,
      sort: req.query.sort || '-createdAt'
    };

    const result = await prescriptionService.getPrescriptions(filters, pagination);

    // Transform result.data to items format for consistency with frontend
    res.status(200).json(
      paginatedSuccessResponse(
        RESPONSE_MESSAGES.PRESCRIPTIONS_FETCHED,
        result.data || [],
        result.pagination || {}
      )
    );
  } catch (error) {
    console.error(error);
    res.status(500).json(errorResponse('Failed to fetch prescriptions'));
  }
};

// @desc    Get prescription by ID
// @route   GET /api/prescriptions/:id
// @access  Private
export const getPrescription = async (req, res) => {
  try {
    const prescription = await prescriptionService.getPrescriptionById(req.params.id);

    // Log view action
    await auditService.logAction(
      'prescription',
      prescription._id || prescription.id,
      'view',
      req.user._id.toString(),
      req.user.role,
      req
    );

    res.status(200).json(successResponse(RESPONSE_MESSAGES.PRESCRIPTION_FETCHED, { prescription }));
  } catch (error) {
    console.error(error);
    if (error.message === 'Resource not found') {
      return res.status(404).json(errorResponse('Prescription not found'));
    }
    res.status(500).json(errorResponse('Failed to fetch prescription'));
  }
};

// @desc    Create prescription
// @route   POST /api/prescriptions
// @access  Private (Doctor only)
export const createPrescription = async (req, res) => {
  try {
    const prescriptionData = {
      ...req.body,
      doctorId: req.user._id
    };

    const prescription = await prescriptionService.createPrescription(prescriptionData);

    // Log create action
    await auditService.logAction(
      'prescription',
      prescription._id || prescription.id,
      'create',
      req.user._id.toString(),
      req.user.role,
      req,
      { patientId: prescription.patientId?.toString?.() || prescription.patientId }
    );

    res.status(201).json(successResponse(RESPONSE_MESSAGES.PRESCRIPTION_CREATED, { prescription }));
  } catch (error) {
    console.error(error);
    if (error.message.includes('required')) {
      return res.status(400).json(errorResponse(error.message));
    }
    res.status(500).json(errorResponse('Failed to create prescription'));
  }
};

// @desc    Update prescription
// @route   PUT /api/prescriptions/:id
// @access  Private (Doctor only)
export const updatePrescription = async (req, res) => {
  try {
    const prescription = await prescriptionService.updatePrescription(req.params.id, req.body);

    // Log update action
    await auditService.logAction(
      'prescription',
      prescription._id || prescription.id,
      'update',
      req.user._id.toString(),
      req.user.role,
      req,
      { changes: Object.keys(req.body) }
    );

    res.status(200).json(successResponse(RESPONSE_MESSAGES.PRESCRIPTION_UPDATED, { prescription }));
  } catch (error) {
    console.error(error);
    if (error.message === 'Resource not found') {
      return res.status(404).json(errorResponse('Prescription not found'));
    }
    res.status(500).json(errorResponse('Failed to update prescription'));
  }
};

// @desc    Delete prescription
// @route   DELETE /api/prescriptions/:id
// @access  Private (Admin only)
export const deletePrescription = async (req, res) => {
  try {
    await prescriptionService.deletePrescription(req.params.id);

    res.status(200).json(successResponse('Prescription deleted successfully'));
  } catch (error) {
    console.error(error);
    if (error.message === 'Resource not found') {
      return res.status(404).json(errorResponse('Prescription not found'));
    }
    res.status(500).json(errorResponse('Failed to delete prescription'));
  }
};

// @desc    Download prescription
// @route   GET /api/prescriptions/:id/download
// @access  Private
export const downloadPrescription = async (req, res) => {
  try {
    const prescription = await prescriptionService.getPrescriptionById(req.params.id);

    // Generate PDF
    const pdfBuffer = await pdfService.generatePrescriptionPDF(prescription);

    // Log download action
    await auditService.logAction(
      'prescription',
      prescription._id || prescription.id,
      'download',
      req.user._id.toString(),
      req.user.role,
      req
    );

    // Set response headers
    const filename = `prescription-${prescription._id || prescription.id}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF buffer
    res.send(pdfBuffer);
  } catch (error) {
    console.error(error);
    if (error.message === 'Resource not found') {
      return res.status(404).json(errorResponse('Prescription not found'));
    }
    res.status(500).json(errorResponse('Failed to download prescription'));
  }
};