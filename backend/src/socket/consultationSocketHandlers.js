/**
 * Consultation-related Socket.IO handlers (WebRTC signaling).
 * Keeps signaling logic separate from application bootstrapping.
 *
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 */
import mongoose from 'mongoose';
import Appointment from '../features/appointments/models/appointmentModel.js';
import { NotificationService } from '../features/notifications/services/notificationService.js';
import User from '../features/users/models/userModel.js';

const notificationService = new NotificationService();

const getConsultationRoomName = (appointmentId) => `consultation:appointment:${appointmentId}`;

export const registerConsultationHandlers = (io, socket) => {
  /**
   * Join a consultation room scoped by appointmentId.
   * Authorization: only appointment doctor/patient may join.
   */
  socket.on('consultation:join', async ({ appointmentId }) => {
    try {
      const userId = socket.data?.userId;
      if (!userId) {
        return socket.emit('consultation:error', {
          appointmentId,
          message: 'User not authenticated in socket context',
        });
      }

      if (!appointmentId || !mongoose.Types.ObjectId.isValid(appointmentId)) {
        return socket.emit('consultation:error', {
          appointmentId,
          message: 'Invalid appointmentId',
        });
      }

      const appointment = await Appointment.findById(appointmentId).select('doctorId patientId status');
      if (!appointment) {
        return socket.emit('consultation:error', {
          appointmentId,
          message: 'Appointment not found',
        });
      }

      const isMember =
        appointment.doctorId?.toString?.() === userId.toString() ||
        appointment.patientId?.toString?.() === userId.toString();

      if (!isMember) {
        return socket.emit('consultation:error', {
          appointmentId,
          message: 'User is not authorized to join this consultation',
        });
      }

      const roomName = getConsultationRoomName(appointmentId);
      socket.join(roomName);

      const roomSockets = await io.in(roomName).fetchSockets()
      socket.emit('consultation:joined', { appointmentId, roomName, participantCount: roomSockets.length });

      // Notify other participants in the room that someone joined
      socket.to(roomName).emit('consultation:participant_joined', {
        appointmentId,
        userId,
        socketId: socket.id,
      });
    } catch (error) {
      console.error('Error in consultation:join:', error);
      socket.emit('consultation:error', {
        appointmentId,
        message: error.message || 'Failed to join consultation room',
      });
    }
  });

  socket.on('consultation:leave', ({ appointmentId }) => {
    if (!appointmentId) return;
    const roomName = getConsultationRoomName(appointmentId);
    socket.leave(roomName);
    socket.emit('consultation:left', { appointmentId, roomName });
  });

  socket.on('consultation:ringing', ({ appointmentId, isRinging }) => {
    if (!appointmentId) return;
    const roomName = getConsultationRoomName(appointmentId);
    const userId = socket.data?.userId;
    socket.to(roomName).emit('consultation:ringing', { appointmentId, isRinging, fromUserId: userId });
  });

  socket.on('consultation:missed_call', async ({ appointmentId, receiverId }) => {
    if (!appointmentId || !receiverId) return;
    const roomName = getConsultationRoomName(appointmentId);
    const userId = socket.data?.userId;
    socket.to(roomName).emit('consultation:missed_call', { appointmentId, fromUserId: userId });
  });

  socket.on('consultation:end', async ({ appointmentId }) => {
    try {
      const userId = socket.data?.userId;
      if (!userId) return;

      if (!appointmentId || !mongoose.Types.ObjectId.isValid(appointmentId)) return;

      const roomName = getConsultationRoomName(appointmentId);
      socket.to(roomName).emit('consultation:end', { appointmentId, fromUserId: userId });
    } catch (error) {
      console.error('Error in consultation:end:', error);
    }
  });

  /**
   * WebRTC signaling (room-based).
   * Payloads are forwarded to the other participant(s) in the appointment room.
   */
  socket.on('consultation:offer', ({ appointmentId, offer }) => {
    if (!appointmentId || !offer) return;
    const userId = socket.data?.userId;
    const roomName = getConsultationRoomName(appointmentId);
    socket.to(roomName).emit('consultation:offer', { appointmentId, offer, fromUserId: userId });
  });

  socket.on('consultation:missed_call', async ({ appointmentId, receiverId }) => {
    if (!appointmentId || !receiverId) return;

    const roomName = getConsultationRoomName(appointmentId);
    const userId = socket.data?.userId;

    try {
      // Create persistent notification
      const sender = await User.findById(userId).select('name');
      await notificationService.createNotification({
        userId: receiverId,
        type: 'missed_call',
        title: 'Missed Call',
        message: `You have a missed consultation call from ${sender?.name || 'User'}.`,
        link: `/consultation/${appointmentId}`,
        metadata: { appointmentId }
      });
    } catch (error) {
      console.error('Failed to create missed call notification:', error);
    }

    socket.to(roomName).emit('consultation:missed_call', { appointmentId, fromUserId: userId });
  });

  socket.on('consultation:answer', ({ appointmentId, answer }) => {
    if (!appointmentId || !answer) return;
    const userId = socket.data?.userId;
    const roomName = getConsultationRoomName(appointmentId);
    socket.to(roomName).emit('consultation:answer', { appointmentId, answer, fromUserId: userId });
  });

  socket.on('consultation:iceCandidate', ({ appointmentId, candidate }) => {
    if (!appointmentId || !candidate) return;
    const userId = socket.data?.userId;
    const roomName = getConsultationRoomName(appointmentId);
    socket.to(roomName).emit('consultation:iceCandidate', { appointmentId, candidate, fromUserId: userId });
  });

  socket.on('consultation:screenShareStarted', ({ appointmentId }) => {
    if (!appointmentId) return;
    const userId = socket.data?.userId;
    const roomName = getConsultationRoomName(appointmentId);
    socket.to(roomName).emit('consultation:screenShareStarted', { appointmentId, fromUserId: userId });
  });

  socket.on('consultation:screenShareStopped', ({ appointmentId }) => {
    if (!appointmentId) return;
    const userId = socket.data?.userId;
    const roomName = getConsultationRoomName(appointmentId);
    socket.to(roomName).emit('consultation:screenShareStopped', { appointmentId, fromUserId: userId });
  });

  /**
   * Backward-compatible legacy event names (optional).
   * These map the old target-based events to the new appointment room flow.
   * Forward to the room (not back to self) so the other participant receives them.
   */
  socket.on('videoOffer', (data) => {
    if (!data || !data.appointmentId || !data.offer) return;
    const roomName = getConsultationRoomName(data.appointmentId);
    const userId = socket.data?.userId;
    socket.to(roomName).emit('consultation:offer', { appointmentId: data.appointmentId, offer: data.offer, fromUserId: userId });
  });

  socket.on('videoAnswer', (data) => {
    if (!data || !data.appointmentId || !data.answer) return;
    const roomName = getConsultationRoomName(data.appointmentId);
    const userId = socket.data?.userId;
    socket.to(roomName).emit('consultation:answer', { appointmentId: data.appointmentId, answer: data.answer, fromUserId: userId });
  });

  socket.on('iceCandidate', (data) => {
    if (!data || !data.appointmentId || !data.candidate) return;
    const roomName = getConsultationRoomName(data.appointmentId);
    const userId = socket.data?.userId;
    socket.to(roomName).emit('consultation:iceCandidate', { appointmentId: data.appointmentId, candidate: data.candidate, fromUserId: userId });
  });
};

