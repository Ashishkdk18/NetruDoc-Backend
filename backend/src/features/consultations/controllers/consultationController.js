import { ConsultationService } from '../services/consultationService.js';
import { successResponse, errorResponse, RESPONSE_MESSAGES } from '../../../utils/response.js';
import { NotificationService } from '../../notifications/services/notificationService.js';
import Appointment from '../../appointments/models/appointmentModel.js';

const consultationService = new ConsultationService();
const notificationService = new NotificationService();

// @desc    Get consultations
// @route   GET /api/consultations
// @access  Private
export const getConsultations = async (req, res) => {
  try {
    const filters = {
      userId: req.user._id,
      role: req.user.role,
      status: req.query.status
    };

    const pagination = {
      page: req.query.page || 1,
      limit: req.query.limit || 10,
      sort: req.query.sort || '-startTime'
    };

    const result = await consultationService.getConsultations(filters, pagination);

    res.status(200).json(successResponse(RESPONSE_MESSAGES.CONSULTATIONS_FETCHED, result));
  } catch (error) {
    console.error(error);
    res.status(500).json(errorResponse('Failed to fetch consultations'));
  }
};

// @desc    Get consultation by ID
// @route   GET /api/consultations/:id
// @access  Private
export const getConsultation = async (req, res) => {
  try {
    const consultation = await consultationService.getConsultationById(req.params.id);

    // Verify requester is patient, doctor, or admin
    const requesterId = req.user?._id?.toString?.();
    const requesterRole = req.user?.role;
    
    // Helper function to extract ID from populated or non-populated field
    const extractId = (field) => {
      if (!field) return null;
      if (typeof field === 'object' && field._id) {
        return field._id.toString();
      }
      return field.toString();
    };
    
    const consultationPatientId = extractId(consultation.patientId);
    const consultationDoctorId = extractId(consultation.doctorId);

    const isAuthorized =
      requesterRole === 'admin' ||
      (consultationPatientId === requesterId) ||
      (consultationDoctorId === requesterId);

    if (!isAuthorized) {
      return res.status(403).json(errorResponse('Not authorized to view this consultation'));
    }

    res.status(200).json(successResponse(RESPONSE_MESSAGES.CONSULTATION_FETCHED, { consultation }));
  } catch (error) {
    console.error(error);
    if (error.message === 'Resource not found') {
      return res.status(404).json(errorResponse('Consultation not found'));
    }
    res.status(500).json(errorResponse('Failed to fetch consultation'));
  }
};

// @desc    Start consultation
// @route   POST /api/consultations/:appointmentId/start
// @access  Private (Doctor only)
export const startConsultation = async (req, res) => {
  try {
    const consultation = await consultationService.startConsultation(req.params.appointmentId);

    // Notify patient that consultation started (real-time via eventBus -> Socket.IO adapter).
    try {
      const appointmentId = consultation.appointmentId?.toString?.() || req.params.appointmentId;
      const patientId = consultation.patientId?.toString?.() || consultation.patientId;
      if (patientId) {
        await notificationService.createNotification({
          userId: patientId,
          type: 'consultation_started',
          title: 'Video consultation started',
          message: 'Your doctor has started the video consultation. Tap to join.',
          link: `/consultation/${appointmentId}`,
          metadata: {
            appointmentId,
            consultationId: consultation._id?.toString?.() || consultation.id,
          },
          priority: 'high',
        });
      }
    } catch (notifyError) {
      console.error('Warning: failed to create consultation_started notification:', notifyError?.message || notifyError);
    }

    res.status(200).json(successResponse(RESPONSE_MESSAGES.CONSULTATION_STARTED, { consultation }));
  } catch (error) {
    console.error(error);
    if (error.message === 'Appointment not found') {
      return res.status(404).json(errorResponse(error.message));
    }
    if (error.message.includes('must be confirmed') || error.message.includes('already active')) {
      return res.status(400).json(errorResponse(error.message));
    }
    res.status(500).json(errorResponse('Failed to start consultation'));
  }
};

// @desc    Get consultation by appointment ID (for join gating)
// @route   GET /api/consultations/appointment/:appointmentId
// @access  Private
export const getConsultationByAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    // Verify appointment exists and requester is participant
    const appointment = await Appointment.findById(appointmentId).select('doctorId patientId status');
    if (!appointment) {
      return res.status(404).json(errorResponse('Appointment not found'));
    }

    const requesterId = req.user?._id?.toString?.();
    const isMember =
      appointment.doctorId?.toString?.() === requesterId ||
      appointment.patientId?.toString?.() === requesterId;

    if (!isMember) {
      return res.status(403).json(errorResponse('Not authorized to view this consultation'));
    }

    const consultation = await consultationService.repository.findByAppointment(appointmentId, {
      populate: [
        { path: 'patientId', select: 'name email phone' },
        { path: 'doctorId', select: 'name email specialization' },
        { path: 'appointmentId' },
      ],
    });

    return res.status(200).json(
      successResponse('Consultation fetched successfully', {
        consultation: consultation || null,
        appointmentStatus: appointment.status,
      })
    );
  } catch (error) {
    console.error('Error fetching consultation by appointment:', error);
    return res.status(500).json(errorResponse('Failed to fetch consultation'));
  }
};

// @desc    Get ICE server config (STUN/TURN) for WebRTC
// @route   GET /api/consultations/ice-config
// @access  Private
export const getIceConfig = async (req, res) => {
  try {
    const iceServers = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ];

    // Optional TURN server configuration (recommended for real-world reliability)
    // Note: For best security, use time-limited TURN credentials (TURN REST API). This is a simple env-based fallback.
    const turnUrls = process.env.TURN_URLS || process.env.TURN_URL;
    const turnUsername = process.env.TURN_USERNAME;
    const turnCredential = process.env.TURN_CREDENTIAL;

    if (turnUrls && turnUsername && turnCredential) {
      iceServers.push({
        urls: turnUrls.split(',').map((u) => u.trim()).filter(Boolean),
        username: turnUsername,
        credential: turnCredential,
      });
    }

    return res.status(200).json(successResponse('ICE config fetched successfully', { iceServers }));
  } catch (error) {
    console.error('Error fetching ICE config:', error);
    return res.status(500).json(errorResponse('Failed to fetch ICE config'));
  }
};

// @desc    End consultation
// @route   PUT /api/consultations/:id/end
// @access  Private (Doctor only)
export const endConsultation = async (req, res) => {
  try {
    const consultation = await consultationService.endConsultation(req.params.id, req.body);

    res.status(200).json(successResponse(RESPONSE_MESSAGES.CONSULTATION_ENDED, { consultation }));
  } catch (error) {
    console.error(error);
    if (error.message === 'Resource not found') {
      return res.status(404).json(errorResponse('Consultation not found'));
    }
    if (error.message === 'Only active consultations can be ended') {
      return res.status(400).json(errorResponse(error.message));
    }
    res.status(500).json(errorResponse('Failed to end consultation'));
  }
};

// @desc    Update consultation notes
// @route   PUT /api/consultations/:id/notes
// @access  Private (Doctor only)
export const updateConsultationNotes = async (req, res) => {
  try {
    const consultation = await consultationService.updateNotes(req.params.id, req.body.notes);

    res.status(200).json(successResponse(RESPONSE_MESSAGES.CONSULTATION_NOTES_UPDATED, { consultation }));
  } catch (error) {
    console.error(error);
    if (error.message === 'Resource not found') {
      return res.status(404).json(errorResponse('Consultation not found'));
    }
    res.status(500).json(errorResponse('Failed to update consultation notes'));
  }
};

// @desc    Update consultation diagnosis
// @route   PUT /api/consultations/:id/diagnosis
// @access  Private (Doctor only)
export const updateConsultationDiagnosis = async (req, res) => {
  try {
    const consultation = await consultationService.updateDiagnosis(req.params.id, req.body.diagnosis);

    res.status(200).json(successResponse('Consultation diagnosis updated successfully', { consultation }));
  } catch (error) {
    console.error(error);
    if (error.message === 'Resource not found') {
      return res.status(404).json(errorResponse('Consultation not found'));
    }
    res.status(500).json(errorResponse('Failed to update consultation diagnosis'));
  }
};

// @desc    Update consultation symptoms
// @route   PUT /api/consultations/:id/symptoms
// @access  Private (Doctor only)
export const updateConsultationSymptoms = async (req, res) => {
  try {
    const consultation = await consultationService.updateSymptoms(req.params.id, req.body.symptoms);

    res.status(200).json(successResponse('Consultation symptoms updated successfully', { consultation }));
  } catch (error) {
    console.error(error);
    if (error.message === 'Resource not found') {
      return res.status(404).json(errorResponse('Consultation not found'));
    }
    res.status(500).json(errorResponse('Failed to update consultation symptoms'));
  }
};

// @desc    Upload consultation media
// @route   POST /api/consultations/:id/media
// @access  Private (Doctor only)
export const uploadConsultationMedia = async (req, res) => {
  try {
    const mediaData = {
      url: req.body.url || req.file?.path,
      type: req.body.type || 'image',
      caption: req.body.caption
    };

    const consultation = await consultationService.uploadMedia(req.params.id, mediaData);

    res.status(200).json(successResponse('Consultation media uploaded successfully', { consultation }));
  } catch (error) {
    console.error(error);
    if (error.message === 'Resource not found') {
      return res.status(404).json(errorResponse('Consultation not found'));
    }
    if (error.message === 'Cannot add media to completed consultation') {
      return res.status(400).json(errorResponse(error.message));
    }
    res.status(500).json(errorResponse('Failed to upload consultation media'));
  }
};