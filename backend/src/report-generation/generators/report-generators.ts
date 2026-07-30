import { BaseReportGenerator } from './base-report.generator';

export class StudentActivitiesReportGenerator extends BaseReportGenerator {
  readonly reportType = 'Student Activities' as const;
}

export class FacultyActivitiesReportGenerator extends BaseReportGenerator {
  readonly reportType = 'Faculty Activities' as const;
}

export class DepartmentActivitiesReportGenerator extends BaseReportGenerator {
  readonly reportType = 'Department Activities' as const;
}

export class NbaReportGenerator extends BaseReportGenerator {
  readonly reportType = 'NBA' as const;
}

export class NaacReportGenerator extends BaseReportGenerator {
  readonly reportType = 'NAAC' as const;
}

export class AicteReportGenerator extends BaseReportGenerator {
  readonly reportType = 'AICTE' as const;
}

export class AiWorkshopReportGenerator extends BaseReportGenerator {
  readonly reportType = 'AI Generated Workshop' as const;
}

export class AiIndustrialVisitReportGenerator extends BaseReportGenerator {
  readonly reportType = 'AI Generated Industrial Visit' as const;
}
