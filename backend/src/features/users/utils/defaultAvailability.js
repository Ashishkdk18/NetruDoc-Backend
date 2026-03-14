// Default weekly availability for doctors
// Sunday–Friday: 09:00–17:00, Saturday: unavailable

export const defaultAvailability = {
  sunday:    { start: '09:00', end: '17:00', available: true },
  monday:    { start: '09:00', end: '17:00', available: true },
  tuesday:   { start: '09:00', end: '17:00', available: true },
  wednesday: { start: '09:00', end: '17:00', available: true },
  thursday:  { start: '09:00', end: '17:00', available: true },
  friday:    { start: '09:00', end: '17:00', available: true },
  saturday:  { start: '',      end: '',      available: false }
};

