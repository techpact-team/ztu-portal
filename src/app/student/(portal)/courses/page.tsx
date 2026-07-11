import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { requirePortalAccess } from "@/lib/auth/guards";
import { getStudentPortalData } from "@/features/students/student-data";
import { ChevronRight } from "lucide-react";

export default async function StudentCoursesPage() {
  const access = await requirePortalAccess("student");

  if (access.status === "not_configured") {
    return null;
  }

  const data = await getStudentPortalData(access.context);

  const sem1Courses = data.courses.filter(c => c.semester === 1);
  const sem2Courses = data.courses.filter(c => c.semester === 2);

  const sem1Credits = sem1Courses.reduce((sum, c) => sum + (c.creditHours || 0), 0);
  const sem2Credits = sem2Courses.reduce((sum, c) => sum + (c.creditHours || 0), 0);
  const totalCredits = sem1Credits + sem2Credits;

  const renderTable = (coursesList: typeof data.courses, title: string) => {
    if (coursesList.length === 0) return null;

    return (
      <div className="space-y-3">
        <div className="bg-primary/10 border border-primary/20 px-4 py-2 rounded">
          <h2 className="text-sm font-bold uppercase tracking-wider text-navy">{title}</h2>
        </div>
        <div className="overflow-x-auto rounded-lg border border-border bg-white shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-[#F4F7FB] text-sm font-bold text-muted-foreground">
                <th className="px-4 py-3 w-12 text-center">#</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3 text-center">Credits</th>
                <th className="px-4 py-3 text-center">Type</th>
                <th className="px-4 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {coursesList.map((course, idx) => (
                <tr key={course.enrollmentId} className="border-b border-border last:border-b-0 hover:bg-[#F4F7FB] transition text-sm">
                  <td className="px-4 py-3.5 text-center font-medium text-muted-foreground">{idx + 1}.</td>
                  <td className="px-4 py-3.5">
                    <span className="inline-block bg-primary/10 border border-primary/20 text-primary text-xs font-bold px-2 py-1 rounded font-mono">
                      {course.courseCode}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-medium text-navy">{course.courseTitle}</td>
                  <td className="px-4 py-3.5 text-center font-mono text-muted-foreground font-semibold">{course.creditHours?.toFixed(1) ?? "3.0"}</td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="inline-block bg-primary text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                      Regular Course
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center text-muted-foreground">
                    <ChevronRight className="h-4 w-4" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Student"
        title="My Registered Courses"
        description="Only courses linked to your own enrolment are shown."
      />

      {data.courses.length === 0 ? (
        <div className="rounded-lg border border-border bg-white p-8">
          <EmptyState
            title="No registered courses"
            description="Your registered courses will appear after enrolment is processed."
          />
        </div>
      ) : (
        <div className="space-y-8">
          {renderTable(sem1Courses, "Semester 1 Courses")}
          {renderTable(sem2Courses, "Semester 2 Courses")}

          {/* Bottom Summary Bar */}
          <div className="bg-primary text-white px-5 py-4 rounded-lg flex flex-wrap gap-x-6 gap-y-2 text-sm font-bold items-center shadow-md">
            <span>* Sem 1 credit hours: <span className="text-white font-mono">{sem1Credits}</span></span>
            <span className="hidden sm:inline border-r border-white/20 h-4" />
            <span>Sem 2 credit hours: <span className="text-white font-mono">{sem2Credits}</span></span>
            <span className="hidden sm:inline border-r border-white/20 h-4" />
            <span>Total annual credit hours: <span className="text-white font-mono">{totalCredits}</span></span>
            <span className="text-white/60 text-xs font-normal italic sm:ml-auto">
              (Credit hours are for regular courses only)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
