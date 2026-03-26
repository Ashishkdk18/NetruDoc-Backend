import { MedicalRecordsService } from '../services/medicalRecordsService.js';
import { successResponse, errorResponse } from '../../../utils/response.js';

const medicalRecordsService = new MedicalRecordsService();

// @desc    Get medical records
// @route   GET /api/medical-records/:patientId?
// @access  Private
export const getMedicalRecords = async (req, res) => {
  try {
    const requesterId = req.user._id.toString();
    const requesterRole = req.user.role;
    const targetPatientId = req.params.patientId || null;

    const records = await medicalRecordsService.getMedicalRecords(
      requesterId,
      requesterRole,
      targetPatientId
    );

    res.status(200).json(successResponse('Medical records fetched successfully', records));
  } catch (error) {
    console.error(error);
    if (error.message === 'Not authorized to view this patient\'s medical records') {
      return res.status(403).json(errorResponse(error.message));
    }
    if (error.message === 'Patient not found') {
      return res.status(404).json(errorResponse(error.message));
    }
    res.status(500).json(errorResponse('Failed to fetch medical records'));
  }
};
