import type { AuthContext } from "@/types/auth";
import type {
  AnnouncementRow,
  AssessmentRow,
  AuditLogRow,
  CourseOfferingRow,
  CourseResultRow,
  CourseRow,
  EnrollmentRow,
  LecturerAssignmentRow,
  ProfileRow,
  StaffMemberRow,
  StudentRow,
  GradeEntryRow,
} from "@/types/database";

export type StaffCourseView = {
  offeringId: string;
  courseCode: string;
  courseTitle: string;
  status: string;
  enrolledStudents: number;
  assessments: number;
};

export type StaffStudentView = {
  enrollmentId: string;
  registrationNumber: string;
  studentName: string;
  courseCode: string;
};

export type StaffResultView = CourseResultRow & {
  registrationNumber: string;
  studentName: string;
  courseCode: string;
};

export type StaffPortalData = {
  staff: StaffMemberRow | null;
  courses: StaffCourseView[];
  assessments: AssessmentRow[];
  enrollments: StaffStudentView[];
  submittedResults: StaffResultView[];
  approvedResults: StaffResultView[];
  notices: AnnouncementRow[];
  auditLogs: AuditLogRow[];
};

export type StaffCourseDetail = Omit<StaffCourseView, "assessments"> & {
  students: StaffStudentView[];
  assessments: AssessmentRow[];
};

export type GradeEntryRowView = {
  enrollmentId: string;
  registrationNumber: string;
  studentName: string;
  rawScore: number | null;
  status: string;
};

export type GradeEntryData = {
  assessment: AssessmentRow | null;
  course: CourseRow | null;
  rows: GradeEntryRowView[];
};

function byId<T extends { id: string }>(items: T[]) {
  return new Map(items.map((item) => [item.id, item]));
}

export async function getStaffPortalData(
  context: AuthContext,
): Promise<StaffPortalData> {
  const { supabase } = context;
  const { data: staffData } = await supabase
    .from("staff_members")
    .select("*")
    .eq("profile_id", context.profile.id)
    .maybeSingle();

  const staff = staffData as StaffMemberRow | null;
  const canReviewAll =
    context.permissions.includes("results.review") ||
    context.permissions.includes("results.publish") ||
    context.permissions.includes("students.manage");

  const [{ data: assignmentData }, { data: noticesData }, { data: auditData }] =
    await Promise.all([
      staff && !canReviewAll
        ? supabase
            .from("lecturer_assignments")
            .select("*")
            .eq("staff_member_id", staff.id)
        : Promise.resolve({ data: [] }),
      supabase
        .from("announcements")
        .select("*")
        .eq("published", true)
        .in("audience", ["staff", "all"])
        .order("created_at", { ascending: false })
        .limit(10),
      context.permissions.includes("audit_logs.read")
        ? supabase
            .from("audit_logs")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(25)
        : Promise.resolve({ data: [] }),
    ]);

  const assignments = (assignmentData ?? []) as LecturerAssignmentRow[];
  const assignedOfferingIds = assignments.map(
    (assignment) => assignment.course_offering_id,
  );

  const { data: offeringData } =
    canReviewAll
      ? await supabase.from("course_offerings").select("*").limit(25)
      : assignedOfferingIds.length > 0
        ? await supabase
            .from("course_offerings")
            .select("*")
            .in("id", assignedOfferingIds)
        : { data: [] };

  const offerings = (offeringData ?? []) as CourseOfferingRow[];
  const offeringIds = offerings.map((offering) => offering.id);
  const courseIds = Array.from(new Set(offerings.map((offering) => offering.course_id)));

  const [{ data: courseData }, { data: assessmentData }, { data: enrollmentData }] =
    await Promise.all([
      courseIds.length > 0
        ? supabase.from("courses").select("*").in("id", courseIds)
        : Promise.resolve({ data: [] }),
      offeringIds.length > 0
        ? supabase
            .from("assessments")
            .select("*")
            .in("course_offering_id", offeringIds)
        : Promise.resolve({ data: [] }),
      offeringIds.length > 0
        ? supabase
            .from("enrollments")
            .select("*")
            .in("course_offering_id", offeringIds)
        : Promise.resolve({ data: [] }),
    ]);

  const courses = (courseData ?? []) as CourseRow[];
  const assessments = (assessmentData ?? []) as AssessmentRow[];
  const enrollments = (enrollmentData ?? []) as EnrollmentRow[];
  const studentIds = Array.from(new Set(enrollments.map((item) => item.student_id)));
  const enrollmentIds = enrollments.map((item) => item.id);

  const [{ data: studentData }, { data: resultData }] = await Promise.all([
    studentIds.length > 0
      ? supabase.from("students").select("*").in("id", studentIds)
      : Promise.resolve({ data: [] }),
    enrollmentIds.length > 0
      ? supabase.from("course_results").select("*").in("enrollment_id", enrollmentIds)
      : Promise.resolve({ data: [] }),
  ]);

  const students = (studentData ?? []) as StudentRow[];
  const profileIds = students.map((student) => student.profile_id);
  const { data: profileData } =
    profileIds.length > 0
      ? await supabase.from("profiles").select("*").in("id", profileIds)
      : { data: [] };

  const coursesById = byId(courses);
  const offeringsById = byId(offerings);
  const studentsById = byId(students);
  const profilesById = byId((profileData ?? []) as ProfileRow[]);
  const resultRows = (resultData ?? []) as CourseResultRow[];
  const enrollmentsById = byId(enrollments);

  const courseViews = offerings.map((offering) => {
    const course = coursesById.get(offering.course_id);

    return {
      offeringId: offering.id,
      courseCode: course?.code ?? "Unknown",
      courseTitle: course?.title ?? "Course unavailable",
      status: offering.status,
      enrolledStudents: enrollments.filter(
        (enrollment) => enrollment.course_offering_id === offering.id,
      ).length,
      assessments: assessments.filter(
        (assessment) => assessment.course_offering_id === offering.id,
      ).length,
    };
  });

  const studentViews = enrollments.map((enrollment) => {
    const student = studentsById.get(enrollment.student_id);
    const profile = student ? profilesById.get(student.profile_id) : null;
    const offering = offeringsById.get(enrollment.course_offering_id);
    const course = offering ? coursesById.get(offering.course_id) : null;

    return {
      enrollmentId: enrollment.id,
      registrationNumber: student?.registration_number ?? "Unknown",
      studentName: profile
        ? `${profile.first_name} ${profile.last_name}`
        : "Student unavailable",
      courseCode: course?.code ?? "Unknown",
    };
  });

  const resultViews = resultRows.map((result) => {
    const enrollment = enrollmentsById.get(result.enrollment_id);
    const student = enrollment ? studentsById.get(enrollment.student_id) : null;
    const profile = student ? profilesById.get(student.profile_id) : null;
    const offering = enrollment ? offeringsById.get(enrollment.course_offering_id) : null;
    const course = offering ? coursesById.get(offering.course_id) : null;

    return {
      ...result,
      registrationNumber: student?.registration_number ?? "Unknown",
      studentName: profile ? `${profile.first_name} ${profile.last_name}` : "Student unavailable",
      courseCode: course?.code ?? "Unknown",
    };
  });

  return {
    staff,
    courses: courseViews,
    assessments,
    enrollments: studentViews,
    submittedResults: resultViews.filter(
      (result) => result.result_status === "submitted",
    ),
    approvedResults: resultViews.filter(
      (result) => result.result_status === "approved",
    ),
    notices: (noticesData ?? []) as AnnouncementRow[],
    auditLogs: (auditData ?? []) as AuditLogRow[],
  };
}

export async function getStaffCourseDetail(
  context: AuthContext,
  courseOfferingId: string,
): Promise<StaffCourseDetail | null> {
  const data = await getStaffPortalData(context);
  const course = data.courses.find((item) => item.offeringId === courseOfferingId);

  if (!course) {
    return null;
  }

  return {
    ...course,
    students: data.enrollments.filter(
      (item) => item.courseCode === course.courseCode,
    ),
    assessments: data.assessments.filter(
      (item) => item.course_offering_id === courseOfferingId,
    ),
  };
}

export async function getGradeEntryData(
  context: AuthContext,
  assessmentId: string,
): Promise<GradeEntryData> {
  const { supabase } = context;
  const { data: assessmentData } = await supabase
    .from("assessments")
    .select("*")
    .eq("id", assessmentId)
    .maybeSingle();

  const assessment = assessmentData as AssessmentRow | null;

  if (!assessment) {
    return { assessment: null, course: null, rows: [] };
  }

  const [{ data: offeringData }, { data: enrollmentData }, { data: gradeData }] =
    await Promise.all([
      supabase
        .from("course_offerings")
        .select("*")
        .eq("id", assessment.course_offering_id)
        .maybeSingle(),
      supabase
        .from("enrollments")
        .select("*")
        .eq("course_offering_id", assessment.course_offering_id),
      supabase
        .from("grade_entries")
        .select("*")
        .eq("assessment_id", assessment.id),
    ]);

  const offering = offeringData as CourseOfferingRow | null;
  const enrollments = (enrollmentData ?? []) as EnrollmentRow[];
  const grades = (gradeData ?? []) as GradeEntryRow[];
  const studentIds = enrollments.map((enrollment) => enrollment.student_id);

  const [{ data: courseData }, { data: studentData }] = await Promise.all([
    offering
      ? supabase.from("courses").select("*").eq("id", offering.course_id).maybeSingle()
      : Promise.resolve({ data: null }),
    studentIds.length > 0
      ? supabase.from("students").select("*").in("id", studentIds)
      : Promise.resolve({ data: [] }),
  ]);

  const students = (studentData ?? []) as StudentRow[];
  const profileIds = students.map((student) => student.profile_id);
  const { data: profileData } =
    profileIds.length > 0
      ? await supabase.from("profiles").select("*").in("id", profileIds)
      : { data: [] };

  const studentsById = byId(students);
  const profilesById = byId((profileData ?? []) as ProfileRow[]);
  const gradeByEnrollment = new Map(grades.map((grade) => [grade.enrollment_id, grade]));

  return {
    assessment,
    course: courseData as CourseRow | null,
    rows: enrollments.map((enrollment) => {
      const student = studentsById.get(enrollment.student_id);
      const profile = student ? profilesById.get(student.profile_id) : null;
      const grade = gradeByEnrollment.get(enrollment.id);

      return {
        enrollmentId: enrollment.id,
        registrationNumber: student?.registration_number ?? "Unknown",
        studentName: profile
          ? `${profile.first_name} ${profile.last_name}`
          : "Student unavailable",
        rawScore: grade?.raw_score ?? null,
        status: grade?.status ?? "draft",
      };
    }),
  };
}
