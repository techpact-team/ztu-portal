import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { requirePortalAccess } from "@/lib/auth/guards";
import { getStudentPortalData } from "@/features/students/student-data";

export default async function StudentResultsPage() {
  const access = await requirePortalAccess("student");

  if (access.status === "not_configured") {
    return null;
  }

  const data = await getStudentPortalData(access.context);

  const sem1Results = data.results.filter(r => r.semester === 1);
  const sem2Results = data.results.filter(r => r.semester === 2);

  const calcGpa = (resultsList: typeof data.results) => {
    const valid = resultsList.flatMap(r => r.gradePoint ?? []);
    if (valid.length === 0) return null;
    return valid.reduce((a, b) => a + b, 0) / valid.length;
  };

  const sem1Gpa = calcGpa(sem1Results);
  const sem2Gpa = calcGpa(sem2Results);
  const overallGpa = data.gpa;

  // Determine Academic Status dynamically for representation
  const failCount = data.results.filter(r => r.letterGrade === "F").length;
  const statusLabel = failCount > 0 ? "REFERRED" : "PASS";

  const renderTable = (resultsList: typeof data.results, title: string) => {
    if (resultsList.length === 0) return null;

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
                <th className="px-4 py-3 text-center">Type</th>
                <th className="px-4 py-3 text-center">Final Grade</th>
                <th className="px-4 py-3 text-center">Letter Grade</th>
                <th className="px-4 py-3 text-center">Grade Point</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {resultsList.map((result, idx) => (
                <tr key={result.courseCode} className="border-b border-border last:border-b-0 hover:bg-[#F4F7FB] transition text-sm">
                  <td className="px-4 py-3.5 text-center font-medium text-muted-foreground">{idx + 1}.</td>
                  <td className="px-4 py-3.5">
                    <span className="inline-block bg-primary/10 border border-primary/20 text-primary text-xs font-bold px-2 py-1 rounded font-mono">
                      {result.courseCode}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-medium text-navy">{result.courseTitle}</td>
                  <td className="px-4 py-3.5 text-center text-muted-foreground font-semibold">RC</td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white text-xs font-bold font-mono">
                      {result.finalScore !== null ? Math.round(result.finalScore) : "-"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center font-bold text-navy">{result.letterGrade ?? "N/A"}</td>
                  <td className="px-4 py-3.5 text-center font-medium text-muted-foreground font-mono">
                    {result.gradePoint?.toFixed(2) ?? "0.00"}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold uppercase text-primary">
                      {result.status}
                    </span>
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
        title="My Grades"
        description="Final semester results appear here after approval by the Registrar."
      />

      {data.results.length === 0 ? (
        <div className="rounded-lg border border-border bg-white p-8">
          <EmptyState
            title="No published results"
            description="The Registrar has not approved final semester results yet."
          />
        </div>
      ) : (
        <div className="space-y-8">
          {renderTable(sem1Results, "Semester 1 Courses")}
          {renderTable(sem2Results, "Semester 2 Courses")}

          {/* Bottom Summary Bar */}
          <div className="bg-primary text-white px-5 py-4 rounded-lg flex flex-wrap gap-x-8 gap-y-2 text-sm font-bold items-center shadow-md">
            <span>Semester 1 GPA: <span className="text-white font-mono">{sem1Gpa ? sem1Gpa.toFixed(2) : "0.00"}</span></span>
            <span className="hidden sm:inline border-r border-white/20 h-4" />
            <span>Semester 2 GPA: <span className="text-white font-mono">{sem2Gpa ? sem2Gpa.toFixed(2) : "0.00"}</span></span>
            <span className="hidden sm:inline border-r border-white/20 h-4" />
            <span>End of Year GPA: <span className="text-white font-mono">{overallGpa ? overallGpa.toFixed(2) : "0.00"}</span></span>
            <span className="hidden sm:inline border-r border-white/20 h-4" />
            <div className="flex items-center gap-2">
              <span>End of Year Result:</span>
              <span className={`px-2 py-0.5 rounded text-[11px] uppercase ${statusLabel === "PASS" ? "bg-primary" : "bg-danger"}`}>
                {statusLabel}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
