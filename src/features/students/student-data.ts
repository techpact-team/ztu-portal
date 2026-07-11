import type { AuthContext } from "@/types/auth";
import type {
  AcademicPeriodRow,
  AnnouncementRow,
  AssessmentRow,
  CourseOfferingRow,
  CourseResultRow,
  CourseRow,
  EnrollmentRow,
  GradeEntryRow,
  ProgrammeRow,
  StudentRow,
} from "@/types/database";

export type StudentCourseView = {
  enrollmentId: string;
  courseCode: string;
  courseTitle: string;
  creditHours: number;
  academicYear: string;
  semester: number;
  status: string;
};

export type StudentAssessmentView = {
  assessmentName: string;
  assessmentType: string;
  courseCode: string;
  rawScore: number | null;
  maximumScore: number;
  weightPercentage: number;
  status: string;
};

export type StudentResultView = {
  courseCode: string;
  courseTitle: string;
  finalScore: number | null;
  letterGrade: string | null;
  gradePoint: number | null;
  academicYear: string;
  semester: number;
  status: string;
};

export type AvailableCourseView = {
  offeringId: string;
  courseCode: string;
  courseTitle: string;
  creditHours: number;
  academicYear: string;
  semester: number;
  registrationType: "compulsory" | "elective";
  alreadyRegistered: boolean;
  registrationStatus: string | null;
};

export type StudentPortalData = {
  student: StudentRow | null;
  programme: ProgrammeRow | null;
  courses: StudentCourseView[];
  assessments: StudentAssessmentView[];
  results: StudentResultView[];
  availableCourses: AvailableCourseView[];
  activePeriod: AcademicPeriodRow | null;
  notices: AnnouncementRow[];
  gpa: number | null;
};

function byId<T extends { id: string }>(items: T[]) {
  return new Map(items.map((item) => [item.id, item]));
}

function average(values: number[]) {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}

export async function getStudentPortalData(
  context: AuthContext,
): Promise<StudentPortalData> {
  const { supabase } = context;
  const { data: studentData } = await supabase
    .from("students")
    .select("*")
    .eq("profile_id", context.profile.id)
    .maybeSingle();

  const student = studentData as StudentRow | null;

  if (!student) {
    return {
      student: null,
      programme: null,
      courses: [],
      assessments: [],
      results: [],
      availableCourses: [],
      activePeriod: null,
      notices: [],
      gpa: null,
    };
  }

  const [{ data: programmeData }, { data: enrollmentData }, { data: noticesData }, { data: activePeriodData }] =
    await Promise.all([
      supabase
        .from("programmes")
        .select("*")
        .eq("id", student.programme_id)
        .maybeSingle(),
      supabase
        .from("enrollments")
        .select("*")
        .eq("student_id", student.id),
      supabase
        .from("announcements")
        .select("*")
        .eq("published", true)
        .in("audience", ["student", "all"])
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("academic_periods")
        .select("*")
        .eq("status", "active")
        .order("start_date", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  const activePeriod = activePeriodData as AcademicPeriodRow | null;
  const { data: availableOfferingsData } = activePeriod
    ? await supabase
        .from("course_offerings")
        .select("*")
        .eq("academic_period_id", activePeriod.id)
        .eq("programme_id", student.programme_id)
        .eq("year_of_study", student.year_of_study)
        .eq("status", "active")
    : { data: [] };
  const availableOfferings = (availableOfferingsData ?? []) as CourseOfferingRow[];

  const allEnrollments = (enrollmentData ?? []) as EnrollmentRow[];
  const enrollments = allEnrollments.filter((enrollment) => ["active", "completed"].includes(enrollment.enrollment_status));
  const offeringIds = enrollments.map((enrollment) => enrollment.course_offering_id);

  const { data: offeringsData } =
    offeringIds.length > 0
      ? await supabase.from("course_offerings").select("*").in("id", offeringIds)
      : { data: [] };

  const offerings = (offeringsData ?? []) as CourseOfferingRow[];
  const courseIds = Array.from(new Set([...offerings, ...availableOfferings].map((offering) => offering.course_id)));
  const periodIds = Array.from(
    new Set(offerings.map((offering) => offering.academic_period_id)),
  );

  const [{ data: coursesData }, { data: periodsData }, { data: assessmentsData }] =
    await Promise.all([
      courseIds.length > 0
        ? supabase.from("courses").select("*").in("id", courseIds)
        : Promise.resolve({ data: [] }),
      periodIds.length > 0
        ? supabase.from("academic_periods").select("*").in("id", periodIds)
        : Promise.resolve({ data: [] }),
      offeringIds.length > 0
        ? supabase
            .from("assessments")
            .select("*")
            .in("course_offering_id", offeringIds)
        : Promise.resolve({ data: [] }),
    ]);

  const coursesById = byId((coursesData ?? []) as CourseRow[]);
  const periodsById = byId((periodsData ?? []) as AcademicPeriodRow[]);
  const offeringsById = byId(offerings);
  const enrollmentsById = byId(enrollments);
  const assessments = (assessmentsData ?? []) as AssessmentRow[];
  const assessmentIds = assessments.map((assessment) => assessment.id);
  const enrollmentIds = enrollments.map((enrollment) => enrollment.id);

  const [{ data: gradeData }, { data: resultData }] = await Promise.all([
    assessmentIds.length > 0 && enrollmentIds.length > 0
      ? supabase
          .from("grade_entries")
          .select("*")
          .in("assessment_id", assessmentIds)
          .in("enrollment_id", enrollmentIds)
          .in("status", ["submitted", "approved", "published", "corrected"])
      : Promise.resolve({ data: [] }),
    enrollmentIds.length > 0
      ? supabase
          .from("course_results")
          .select("*")
          .in("result_status", ["approved", "published"])
          .in("enrollment_id", enrollmentIds)
      : Promise.resolve({ data: [] }),
  ]);

  const grades = (gradeData ?? []) as GradeEntryRow[];
  const gradeByAssessmentEnrollment = new Map(
    grades.map((grade) => [`${grade.assessment_id}:${grade.enrollment_id}`, grade]),
  );
  const results = (resultData ?? []) as CourseResultRow[];

  const courseViews = enrollments.map((enrollment) => {
    const offering = offeringsById.get(enrollment.course_offering_id);
    const course = offering ? coursesById.get(offering.course_id) : null;
    const period = offering ? periodsById.get(offering.academic_period_id) : null;

    return {
      enrollmentId: enrollment.id,
      courseCode: course?.code ?? "Unknown",
      courseTitle: course?.title ?? "Course unavailable",
      creditHours: Number(course?.credit_hours ?? 0),
      academicYear: period?.academic_year ?? "N/A",
      semester: period?.semester ?? 0,
      status: enrollment.enrollment_status,
    };
  });

  const assessmentViews = assessments.flatMap((assessment) =>
    enrollments
      .filter((enrollment) => {
        const offering = offeringsById.get(enrollment.course_offering_id);
        return offering?.id === assessment.course_offering_id;
      })
      .map((enrollment) => {
        const offering = offeringsById.get(assessment.course_offering_id);
        const course = offering ? coursesById.get(offering.course_id) : null;
        const grade = gradeByAssessmentEnrollment.get(
          `${assessment.id}:${enrollment.id}`,
        );

        if (!grade) return [];

        return [{
          assessmentName: assessment.name,
          assessmentType: assessment.assessment_type,
          courseCode: course?.code ?? "Unknown",
          rawScore: grade?.raw_score ?? null,
          maximumScore: assessment.maximum_score,
          weightPercentage: assessment.weight_percentage,
          status: grade.status,
        }];
      }),
  ).flat();

  const resultViews = results.map((result) => {
    const enrollment = enrollmentsById.get(result.enrollment_id);
    const offering = enrollment
      ? offeringsById.get(enrollment.course_offering_id)
      : null;
    const course = offering ? coursesById.get(offering.course_id) : null;
    const period = offering ? periodsById.get(offering.academic_period_id) : null;

    return {
      courseCode: course?.code ?? "Unknown",
      courseTitle: course?.title ?? "Course unavailable",
      finalScore: result.final_score,
      letterGrade: result.letter_grade,
      gradePoint: result.grade_point,
      academicYear: period?.academic_year ?? "N/A",
      semester: period?.semester ?? 0,
      status: result.result_status,
    };
  });

  const enrollmentByOffering = new Map(allEnrollments.map((item) => [item.course_offering_id, item]));
  const availableCourses = availableOfferings.map((offering) => {
    const course = coursesById.get(offering.course_id);
    return {
      offeringId: offering.id,
      courseCode: course?.code ?? "Unknown",
      courseTitle: course?.title ?? "Course unavailable",
      creditHours: Number(course?.credit_hours ?? 0),
      academicYear: activePeriod?.academic_year ?? "N/A",
      semester: activePeriod?.semester ?? 0,
      registrationType: offering.registration_type === "elective" ? "elective" as const : "compulsory" as const,
      alreadyRegistered: Boolean(enrollmentByOffering.get(offering.id)) && enrollmentByOffering.get(offering.id)?.enrollment_status !== "rejected",
      registrationStatus: enrollmentByOffering.get(offering.id)?.enrollment_status ?? null,
    };
  });

  return {
    student,
    programme: programmeData as ProgrammeRow | null,
    courses: courseViews,
    assessments: assessmentViews,
    results: resultViews,
    availableCourses,
    activePeriod,
    notices: (noticesData ?? []) as AnnouncementRow[],
    gpa: average(resultViews.flatMap((result) => result.gradePoint ?? [])),
  };
}
