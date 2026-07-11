import type { SupabaseClient } from "@supabase/supabase-js";
import { calculateWeightedScore, resolveGrade } from "@/lib/services/grade-service";
import type { AssessmentRow, Database, GradeEntryRow } from "@/types/database";

export function calculateFinalScore(
  assessments: AssessmentRow[],
  grades: GradeEntryRow[],
) {
  const assessmentById = new Map(
    assessments.map((assessment) => [assessment.id, assessment]),
  );

  return grades.reduce((total, grade) => {
    const assessment = assessmentById.get(grade.assessment_id);

    if (!assessment) {
      return total;
    }

    return (
      total +
      calculateWeightedScore({
        rawScore: grade.raw_score,
        maximumScore: assessment.maximum_score,
        weightPercentage: assessment.weight_percentage,
      })
    );
  }, 0);
}

export async function upsertCourseResult({
  enrollmentId,
  assessments,
  grades,
  supabase,
  submittedBy,
}: {
  enrollmentId: string;
  assessments: AssessmentRow[];
  grades: GradeEntryRow[];
  supabase: SupabaseClient<Database>;
  submittedBy: string;
}) {
  const finalScore = calculateFinalScore(assessments, grades);
  const grade = resolveGrade(finalScore);

  return supabase.from("course_results").upsert(
    {
      enrollment_id: enrollmentId,
      continuous_assessment_score: finalScore,
      final_score: finalScore,
      letter_grade: grade.letterGrade,
      grade_point: grade.gradePoint,
      result_status: "submitted",
      submitted_by: submittedBy,
      submitted_at: new Date().toISOString(),
    },
    { onConflict: "enrollment_id" },
  );
}
