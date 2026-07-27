import { BaseReportGenerator } from './base-report.generator';

export class NbaReportGenerator extends BaseReportGenerator {
  readonly reportType = 'NBA' as const;

  getGeneratorNotes(): string {
    return 'NBA accreditation report generator — implementation pending.';
  }
}

export class NaacReportGenerator extends BaseReportGenerator {
  readonly reportType = 'NAAC' as const;

  getGeneratorNotes(): string {
    return 'NAAC accreditation report generator — implementation pending.';
  }
}

export class AicteReportGenerator extends BaseReportGenerator {
  readonly reportType = 'AICTE' as const;

  getGeneratorNotes(): string {
    return 'AICTE compliance report generator — implementation pending.';
  }
}

export class PlacementReportGenerator extends BaseReportGenerator {
  readonly reportType = 'Placement' as const;

  getGeneratorNotes(): string {
    return 'Placement analytics report generator — implementation pending.';
  }
}

export class InternshipReportGenerator extends BaseReportGenerator {
  readonly reportType = 'Internship' as const;

  getGeneratorNotes(): string {
    return 'Internship analytics report generator — implementation pending.';
  }
}

export class StudentAchievementReportGenerator extends BaseReportGenerator {
  readonly reportType = 'Student Achievement' as const;

  getGeneratorNotes(): string {
    return 'Student achievement report generator — implementation pending.';
  }
}

export class FacultyAchievementReportGenerator extends BaseReportGenerator {
  readonly reportType = 'Faculty Achievement' as const;

  getGeneratorNotes(): string {
    return 'Faculty achievement report generator — implementation pending.';
  }
}

export class PublicationReportGenerator extends BaseReportGenerator {
  readonly reportType = 'Publication' as const;

  getGeneratorNotes(): string {
    return 'Publication index report generator — implementation pending.';
  }
}

export class PatentReportGenerator extends BaseReportGenerator {
  readonly reportType = 'Patent' as const;

  getGeneratorNotes(): string {
    return 'Patent portfolio report generator — implementation pending.';
  }
}

export class CompletedEventReportGenerator extends BaseReportGenerator {
  readonly reportType = 'Completed Event' as const;

  getGeneratorNotes(): string {
    return 'Completed event report generator — implementation pending.';
  }
}
