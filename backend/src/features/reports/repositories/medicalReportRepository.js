import { BaseRepository } from '../../../repositories/baseRepository.js';
import MedicalReport from '../models/medicalReportModel.js';

export class MedicalReportRepository extends BaseRepository {
  constructor() {
    super(MedicalReport);
  }
}

export default MedicalReportRepository;

