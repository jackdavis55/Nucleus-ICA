// Schema-aligned TypeScript contract for the database migrations.
// Replace with CLI-generated types after applying the migration to a linked Supabase project.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Table<Row, Insert = Partial<Row>, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

type Owned = { id: string; owner_id: string; created_at: string; updated_at: string };

export type Database = {
  public: {
    Tables: {
      methodology_versions: Table<{ id: string; version: string; title: string; description: string | null; status: "draft" | "published" | "retired"; published_at: string | null; created_at: string }>;
      methodology_questions: Table<{ id: string; methodology_version_id: string; question_key: string; stage_key: string; stage_name: string; question_text: string; why_text: string; answer_options: Json; branching_rules: Json; sort_order: number }>;
      individuals: Table<Owned & { display_name: string; employee_id: string | null; role: "Director" | "Manager" | "Technician" | "Operator" | "Engineer" | "Officer" | null; reference_code: string | null; notes: string | null; status: "active" | "archived" }>;
      incidents: Table<Owned & { reference: string; title: string; occurred_on: string | null; description: string | null; site: string | null; status: "open" | "under_review" | "closed" | "archived" }>;
      assessments: Table<Owned & { individual_id: string; incident_id: string; methodology_version_id: string; reference: string; status: "draft" | "in_progress" | "completed" | "archived"; revision_number: number; completed_at: string | null; archived_at: string | null }>;
      assessment_answers: Table<{ id: string; owner_id: string; assessment_id: string; methodology_version_id: string; methodology_question_id: string; question_key: string; question_snapshot: Json; answer_state: "yes" | "partly" | "no" | "unknown" | "not_applicable" | "disputed" | "not_yet_assessed"; answer_value: string | null; explanation: string | null; additional_comments: string | null; assessor_rationale: string | null; conditional_context: Json; updated_at: string }>;
      findings: Table<Owned & { assessment_id: string; finding_type: string; title: string; interpretation: string; basis: Json; uncertainty: string | null; status: string }>;
      evidence_items: Table<{ id: string; owner_id: string; assessment_id: string; answer_id: string | null; finding_id: string | null; evidence_type: string; source: string | null; description: string; evidence_date: string | null; relevance: string | null; limitations: string | null; position: "supports" | "challenges" | "context" | "undetermined"; confidentiality: "restricted" | "sensitive" | "general"; status: "active" | "withdrawn"; created_at: string }>;
      assessment_factors: Table<Owned & { assessment_id: string; category: string; factor_name: string; presence: string; relevance: string; influence: string | null; supporting_evidence: string | null; counter_evidence: string | null; assessor_rationale: string | null }>;
      finding_classifications: Table<{ id: string; owner_id: string; assessment_id: string; finding_id: string; classification_system: "reason_human_performance" | "just_culture_response"; classification: string; rationale: string | null; status: string; created_at: string }>;
      recommendations: Table<Owned & { assessment_id: string; title: string; rationale: string | null; status: string; selected: boolean }>;
      recommendation_findings: Table<{ owner_id: string; assessment_id: string; recommendation_id: string; finding_id: string }>;
      assessment_revisions: Table<{ id: string; owner_id: string; assessment_id: string; revision_number: number; change_reason: string; snapshot: Json; created_at: string }>;
      narrative_versions: Table<{ id: string; owner_id: string; assessment_id: string; version_number: number; generated_text: string; basis: Json; assessor_edited_text: string | null; created_at: string }>;
    };
    Views: Record<string, never>;
    Functions: {
      assessment_is_editable: { Args: { p_assessment_id: string }; Returns: boolean };
      save_recommendations: { Args: { p_assessment_id: string; p_recommendations: Json }; Returns: undefined };
      begin_assessment: { Args: { p_assessment_id: string }; Returns: undefined };
      complete_assessment: { Args: { p_assessment_id: string }; Returns: undefined };
      reopen_assessment: { Args: { p_assessment_id: string }; Returns: number };
      archive_assessment: { Args: { p_assessment_id: string }; Returns: undefined };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
