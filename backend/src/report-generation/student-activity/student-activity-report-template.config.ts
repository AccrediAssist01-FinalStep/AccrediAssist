/** Matches STUDENT ACHIEVEMENT REPORT.docx module order and headings */
export const STUDENT_ACTIVITY_REPORT_TITLE = 'STUDENT ACHIEVEMENT REPORT';

export const STUDENT_ACTIVITY_MODULE_TABLE_HEADERS = [
  'Student Name',
  'Type',
  'Title',
  'Organization',
  'Date',
] as const;

export const STUDENT_ACTIVITY_REPORT_SECTION_ORDER = [
  'cover',
  'introduction',
  'modules',
  'conclusion',
] as const;

export const STUDENT_ACTIVITY_REPORT_HEADINGS = {
  introduction: 'Introduction',
  conclusion: 'Conclusion',
} as const;

/** Fallback introduction paragraphs from the provided template (~171 words) */
export const TEMPLATE_FALLBACK_INTRODUCTION = [
  'Student achievements are an important reflection of the overall development, talent, dedication, and professional readiness of learners. The achievements recorded across various modules demonstrate the active participation of students in academic, technical, professional, cultural, sports, research, and social-development activities. Such accomplishments provide students with opportunities to strengthen their knowledge, develop practical skills, improve confidence, and gain valuable exposure beyond the classroom.',
  'The achievements include certifications from reputed organizations, prizes secured in competitions, winning positions in various events, participation in workshops and seminars, internships, placement-related accomplishments, research activities, industrial visits, startup and innovation initiatives, and involvement in sports, cultural activities, HSS, and NCC. These experiences contribute significantly to the holistic development of students and help them prepare for higher education and future employment opportunities.',
  'The following report presents student achievements across all identified modules. Each module table includes the type of achievement, title, organization, and date. The report follows the institutional format for documenting and presenting student accomplishments.',
];

/** Fallback conclusion paragraphs from the provided template (~182 words) */
export const TEMPLATE_FALLBACK_CONCLUSION = [
  'The student achievement report highlights the diverse talents, accomplishments, and active participation of students across various academic, professional, extracurricular, and developmental areas. The achievements in sports, cultural activities, technical events, research, internships, placements, certifications, workshops, seminars, industrial visits, startup and innovation activities, and HSS/NCC demonstrate the holistic growth of students beyond regular classroom learning.',
  'Participation and success in these activities provide students with valuable opportunities to develop technical knowledge, leadership abilities, teamwork, communication skills, creativity, problem-solving capabilities, and professional confidence. Certifications and internships strengthen employability, while research, innovation, and technical activities encourage students to apply theoretical knowledge to practical situations. Similarly, sports, cultural programs, and HSS/NCC activities contribute to discipline, teamwork, social responsibility, and overall personality development.',
  'Overall, the achievements reflect the institution\'s efforts to encourage students to explore their potential and actively participate in diverse learning experiences. Maintaining systematic records of such accomplishments also helps the institution assess student development and showcase their achievements effectively. Continued encouragement, mentoring, industry interaction, skill development programs, and opportunities for participation will further support students in achieving greater success in their academic and professional careers.',
];

export const STUDENT_ACTIVITY_REPORT_TYPOGRAPHY = {
  fontFamily: 'Times New Roman',
  titleSize: 28,
  sectionHeadingSize: 24,
  moduleHeadingSize: 22,
  bodySize: 22,
  tableHeaderSize: 20,
  tableBodySize: 20,
  lineSpacing: 276,
} as const;
