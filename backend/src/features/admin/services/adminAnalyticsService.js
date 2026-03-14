import Appointment from '../../appointments/models/appointmentModel.js';
import Payment from '../../payments/models/paymentModel.js';
import User from '../../users/models/userModel.js';

export class AdminAnalyticsService {
  async getSummary() {
    const [
      totalUsers,
      totalDoctors,
      totalPatients,
      totalAppointments,
      completedAppointments,
      totalRevenueNpr,
      totalRevenueUsd
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ role: 'doctor' }),
      User.countDocuments({ role: 'patient' }),
      Appointment.countDocuments({}),
      Appointment.countDocuments({ status: 'completed' }),
      Payment.aggregate([
        { $match: { status: 'completed', currency: 'NPR' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Payment.aggregate([
        { $match: { status: 'completed', currency: 'USD' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    return {
      totalUsers,
      totalDoctors,
      totalPatients,
      totalAppointments,
      completedAppointments,
      revenue: {
        NPR: totalRevenueNpr[0]?.total || 0,
        USD: totalRevenueUsd[0]?.total || 0
      }
    };
  }

  async getAppointmentsByStatus() {
    const result = await Appointment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    return result.map(item => ({
      status: item._id,
      count: item.count
    }));
  }

  async getRevenueByMonth() {
    const result = await Payment.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            currency: '$currency'
          },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    return result.map(item => ({
      year: item._id.year,
      month: item._id.month,
      currency: item._id.currency,
      total: item.total
    }));
  }

  async getAppointmentsByMonth(months = 12) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const result = await Appointment.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    return result.map(item => ({
      year: item._id.year,
      month: item._id.month,
      count: item.count
    }));
  }

  async getTopSpecialties(limit = 5) {
    const result = await Appointment.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'doctorId',
          foreignField: '_id',
          as: 'doctor'
        }
      },
      { $unwind: '$doctor' },
      {
        $group: {
          _id: '$doctor.specialization',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: limit }
    ]);

    return result.map(item => ({
      specialization: item._id,
      count: item.count
    }));
  }
}

export default AdminAnalyticsService;

