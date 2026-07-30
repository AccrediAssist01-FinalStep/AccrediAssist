import { GenerationReportType } from '../config/report-types.config';
import { BaseReportGenerator } from './base-report.generator';
import {
  AiIndustrialVisitReportGenerator,
  AiWorkshopReportGenerator,
  AicteReportGenerator,
  DepartmentActivitiesReportGenerator,
  FacultyActivitiesReportGenerator,
  NaacReportGenerator,
  NbaReportGenerator,
  StudentActivitiesReportGenerator,
} from './report-generators';
import { parseGenerationReportType } from '../utils/report-type.util';
import { NotFoundError } from '../../utils/errors';

const generatorInstances: BaseReportGenerator[] = [
  new StudentActivitiesReportGenerator(),
  new FacultyActivitiesReportGenerator(),
  new DepartmentActivitiesReportGenerator(),
  new NbaReportGenerator(),
  new NaacReportGenerator(),
  new AicteReportGenerator(),
  new AiWorkshopReportGenerator(),
  new AiIndustrialVisitReportGenerator(),
];

const generatorMap = new Map<GenerationReportType, BaseReportGenerator>(
  generatorInstances.map((generator) => [generator.reportType, generator]),
);

export const getReportGenerator = (reportType: GenerationReportType): BaseReportGenerator => {
  const generator = generatorMap.get(reportType);
  if (!generator) {
    throw new NotFoundError(`No generator registered for report type: ${reportType}`);
  }
  return generator;
};

export const getReportGeneratorById = (typeId: string): BaseReportGenerator =>
  getReportGenerator(parseGenerationReportType(typeId));

export const listReportGenerators = (): BaseReportGenerator[] => [...generatorInstances];
