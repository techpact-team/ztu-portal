"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { StudentCourseView, StudentAssessmentView } from "@/features/students/student-data";

type AssessmentsListProps = {
  courses: StudentCourseView[];
  assessments: StudentAssessmentView[];
};

export function AssessmentsList({ courses, assessments }: AssessmentsListProps) {
  const [expandedCourses, setExpandedCourses] = useState<Record<string, boolean>>({});

  const toggleCourse = (courseCode: string) => {
    setExpandedCourses((prev) => ({
      ...prev,
      [courseCode]: !prev[courseCode],
    }));
  };

  const sem1Courses = courses.filter((c) => c.semester === 1);
  const sem2Courses = courses.filter((c) => c.semester === 2);

  const renderSemesterSection = (coursesList: StudentCourseView[], title: string) => {
    if (coursesList.length === 0) return null;

    return (
      <div className="space-y-4">
        <div className="bg-primary/10 border border-primary/20 px-4 py-2 rounded">
          <h2 className="text-sm font-bold uppercase tracking-wider text-navy">{title}</h2>
        </div>
        <div className="space-y-2">
          {coursesList.map((course, idx) => {
            const courseAssessments = assessments.filter(
              (a) => a.courseCode === course.courseCode
            );
            const isExpanded = !!expandedCourses[course.courseCode];

            return (
              <div
                key={course.courseCode}
                className="border border-border bg-white rounded-lg overflow-hidden shadow-sm transition"
              >
                {/* Course Header */}
                <button
                  type="button"
                  onClick={() => toggleCourse(course.courseCode)}
                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#F4F7FB] transition text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground">{idx + 1}.</span>
                    <span className="bg-primary/10 border border-primary/20 text-primary text-xs font-bold px-2 py-1 rounded font-mono">
                      {course.courseCode}
                    </span>
                    <span className="font-semibold text-navy text-sm sm:text-base">
                      {course.courseTitle}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full uppercase">
                      RC
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {/* Assessments Sub-table */}
                {isExpanded && (
                  <div className="border-t border-border bg-[#F4F7FB]/50 px-5 py-4">
                    {courseAssessments.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">
                        No continuous assessments recorded for this course.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-border text-xs font-bold text-muted-foreground uppercase tracking-wider">
                              <th className="py-2">Assessment Name</th>
                              <th className="py-2 text-center">Score</th>
                              <th className="py-2 text-center">Score (%)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {courseAssessments.map((a) => {
                              const scorePercentage =
                                a.rawScore !== null
                                  ? (a.rawScore / a.maximumScore) * 100
                                  : null;

                              return (
                                <tr key={a.assessmentName} className="border-b border-border/50 last:border-b-0 text-sm">
                                  <td className="py-3 font-medium text-navy">
                                    {a.assessmentName} ({a.assessmentType})
                                  </td>
                                  <td className="py-3 text-center font-mono font-medium">
                                    {a.rawScore !== null
                                      ? `${a.rawScore.toFixed(1)} / ${a.maximumScore.toFixed(1)}`
                                      : "Pending"}
                                  </td>
                                  <td className="py-3 text-center font-mono">
                                    {scorePercentage !== null ? (
                                      <span className="font-bold text-primary">
                                        {scorePercentage.toFixed(1)}%
                                      </span>
                                    ) : (
                                      <span className="text-muted-foreground">-</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {renderSemesterSection(sem1Courses, "Semester 1 Continuous Assessments")}
      {renderSemesterSection(sem2Courses, "Semester 2 Continuous Assessments")}
    </div>
  );
}
