import type { AuthContext } from "@/types/auth";
import type { CourseOfferingRow, CourseRow, EnrollmentRow, ProfileRow, StudentRow } from "@/types/database";

export type RegistrationReviewView = {
  enrollmentId: string;
  registrationNumber: string;
  studentName: string;
  courseCode: string;
  courseTitle: string;
  submittedAt: string;
};

export async function getRegistrationReviews(context: AuthContext): Promise<RegistrationReviewView[]> {
  const { data: enrollmentData } = await context.supabase.from("enrollments").select("*").eq("enrollment_status", "submitted").order("enrolled_at");
  const enrollments = (enrollmentData ?? []) as EnrollmentRow[];
  const studentIds = [...new Set(enrollments.map((item) => item.student_id))];
  const offeringIds = [...new Set(enrollments.map((item) => item.course_offering_id))];
  const [{ data: studentData }, { data: offeringData }] = await Promise.all([
    studentIds.length ? context.supabase.from("students").select("*").in("id", studentIds) : Promise.resolve({ data: [] }),
    offeringIds.length ? context.supabase.from("course_offerings").select("*").in("id", offeringIds) : Promise.resolve({ data: [] }),
  ]);
  const students = (studentData ?? []) as StudentRow[]; const offerings = (offeringData ?? []) as CourseOfferingRow[];
  const profileIds = students.map((item) => item.profile_id); const courseIds = offerings.map((item) => item.course_id);
  const [{ data: profileData }, { data: courseData }] = await Promise.all([
    profileIds.length ? context.supabase.from("profiles").select("*").in("id", profileIds) : Promise.resolve({ data: [] }),
    courseIds.length ? context.supabase.from("courses").select("*").in("id", courseIds) : Promise.resolve({ data: [] }),
  ]);
  const byId = <T extends { id: string }>(rows: T[]) => new Map(rows.map((row) => [row.id, row]));
  const studentsById = byId(students); const offeringsById = byId(offerings); const profilesById = byId((profileData ?? []) as ProfileRow[]); const coursesById = byId((courseData ?? []) as CourseRow[]);
  return enrollments.map((enrollment) => { const student = studentsById.get(enrollment.student_id); const profile = student ? profilesById.get(student.profile_id) : null; const offering = offeringsById.get(enrollment.course_offering_id); const course = offering ? coursesById.get(offering.course_id) : null; return { enrollmentId: enrollment.id, registrationNumber: student?.registration_number ?? "Unknown", studentName: profile ? `${profile.first_name} ${profile.last_name}` : "Unknown student", courseCode: course?.code ?? "Unknown", courseTitle: course?.title ?? "Unknown course", submittedAt: enrollment.enrolled_at }; });
}
