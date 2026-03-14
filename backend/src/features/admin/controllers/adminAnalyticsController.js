import AdminAnalyticsService from '../services/adminAnalyticsService.js';
import { successResponse, errorResponse } from '../../../utils/response.js';

const analyticsService = new AdminAnalyticsService();

// @desc    Get admin analytics summary
// @route   GET /api/admin/analytics/summary
// @access  Private (Admin only)
export const getAnalyticsSummary = async (req, res) => {
  try {
    const data = await analyticsService.getSummary();
    res.status(200).json(successResponse('Analytics summary fetched successfully', data));
  } catch (error) {
    console.error('Failed to fetch analytics summary:', error);
    res.status(500).json(errorResponse('Failed to fetch analytics summary'));
  }
};

// @desc    Get appointments count by status
// @route   GET /api/admin/analytics/appointments-by-status
// @access  Private (Admin only)
export const getAppointmentsByStatus = async (req, res) => {
  try {
    const data = await analyticsService.getAppointmentsByStatus();
    res.status(200).json(successResponse('Appointments by status fetched successfully', { items: data }));
  } catch (error) {
    console.error('Failed to fetch appointments by status:', error);
    res.status(500).json(errorResponse('Failed to fetch appointments by status'));
  }
};

// @desc    Get revenue by month
// @route   GET /api/admin/analytics/revenue-by-month
// @access  Private (Admin only)
export const getRevenueByMonth = async (req, res) => {
  try {
    const data = await analyticsService.getRevenueByMonth();
    res.status(200).json(successResponse('Revenue by month fetched successfully', { items: data }));
  } catch (error) {
    console.error('Failed to fetch revenue by month:', error);
    res.status(500).json(errorResponse('Failed to fetch revenue by month'));
  }
};

// @desc    Get appointments count by month (last N months)
// @route   GET /api/admin/analytics/appointments-by-month
// @access  Private (Admin only)
export const getAppointmentsByMonth = async (req, res) => {
  try {
    const months = parseInt(req.query.months, 10) || 12;
    const data = await analyticsService.getAppointmentsByMonth(months);
    res.status(200).json(successResponse('Appointments by month fetched successfully', { items: data }));
  } catch (error) {
    console.error('Failed to fetch appointments by month:', error);
    res.status(500).json(errorResponse('Failed to fetch appointments by month'));
  }
};

// @desc    Get top specialties by appointment count
// @route   GET /api/admin/analytics/top-specialties
// @access  Private (Admin only)
export const getTopSpecialties = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 5;
    const data = await analyticsService.getTopSpecialties(limit);
    res.status(200).json(successResponse('Top specialties fetched successfully', { items: data }));
  } catch (error) {
    console.error('Failed to fetch top specialties:', error);
    res.status(500).json(errorResponse('Failed to fetch top specialties'));
  }
};

