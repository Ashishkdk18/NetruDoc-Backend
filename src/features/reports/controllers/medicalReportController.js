import path from 'path';
import fs from 'fs';
import MedicalReport from '../models/medicalReportModel.js';
import { MedicalReportService } from '../services/medicalReportService.js';
import { successResponse, errorResponse } from '../../../utils/response.js';

const medicalReportService = new MedicalReportService();

// @desc    Upload medical report file for an appointment
// @route   POST /api/reports/:appointmentId
// @access  Private (patient/doctor/admin with access to appointment)
export const uploadMedicalReport = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const description = req.body?.description || '';
    const report = await medicalReportService.createReportFromFile(
      appointmentId,
      req.file,
      req.user,
      description
    );

    res.status(201).json(successResponse('Medical report uploaded successfully', { report }));
  } catch (error) {
    console.error('Failed to upload medical report:', error);
    if (error.message === 'Appointment not found') {
      return res.status(404).json(errorResponse(error.message));
    }
    if (error.message.includes('Not authorized')) {
      return res.status(403).json(errorResponse(error.message));
    }
    if (error.message === 'No file uploaded') {
      return res.status(400).json(errorResponse(error.message));
    }
    if (error.message === 'Only PDF and image files are allowed') {
      return res.status(400).json(errorResponse(error.message));
    }
    res.status(500).json(errorResponse('Failed to upload medical report'));
  }
};

// @desc    Get medical reports for an appointment
// @route   GET /api/reports/:appointmentId
// @access  Private (patient/doctor/admin with access to appointment)
export const getMedicalReports = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const result = await medicalReportService.getReportsForAppointment(
      appointmentId,
      req.user
    );

    res.status(200).json(
      successResponse('Medical reports fetched successfully', {
        items: result.data || [],
        pagination: result.pagination || {}
      })
    );
  } catch (error) {
    console.error('Failed to fetch medical reports:', error);
    if (error.message === 'Appointment not found') {
      return res.status(404).json(errorResponse(error.message));
    }
    if (error.message.includes('Not authorized')) {
      return res.status(403).json(errorResponse(error.message));
    }
    res.status(500).json(errorResponse('Failed to fetch medical reports'));
  }
};

// @desc    Download a medical report file
// @route   GET /api/reports/file/:id
// @access  Private (patient/doctor/admin with access to appointment)
export const downloadMedicalReport = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await MedicalReport.findById(id)
      .populate('appointmentId', 'patientId doctorId')
      .populate('uploadedBy', 'name role')
      .lean();

    if (!report) {
      return res.status(404).json(errorResponse('Medical report not found'));
    }

    // Access control: reuse service logic
    await medicalReportService.validateAppointmentAccess(
      report.appointmentId._id || report.appointmentId,
      req.user
    );

    const uploadPath = process.env.REPORTS_UPLOAD_PATH ||
      path.join(process.cwd(), 'uploads', 'reports');
    const filePath = path.join(uploadPath, report.fileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json(errorResponse('Report file not found on server'));
    }

    res.setHeader('Content-Type', report.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${report.originalName}"`
    );

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  } catch (error) {
    console.error('Failed to download medical report:', error);
    if (error.message.includes('Not authorized')) {
      return res.status(403).json(errorResponse(error.message));
    }
    res.status(500).json(errorResponse('Failed to download medical report'));
  }
};

