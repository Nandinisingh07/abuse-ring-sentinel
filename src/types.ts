export interface SHAPReason {
  feature: string;
  shap_value: number;
  feature_value: number;
}

export interface SHAPLocalExplanation {
  risk_score: number;
  top_reasons: SHAPReason[];
}

export interface SHAPGlobalFeature {
  feature: string;
  importance: number;
}

export interface AccountSchema {
  user_id: string;
  risk_score: number;
  risk_tier: 'LOW' | 'REVIEW' | 'HOLD';
  cluster_id: number;
  cluster_size: number;
  cluster_fraud_rate: number;
  account_degree: number;
  purchase_value: number;
  actual_label: number;
  status: 'Pending' | 'Approved' | 'Escalated' | 'Dismissed';
  shap_explanation?: SHAPLocalExplanation | null;
}

export interface ClusterSchema {
  cluster_id: number;
  size: number;
  fraud_rate: number;
  member_count: number;
}

export interface ClusterMember {
  user_id: string;
  risk_score: number;
  risk_tier: 'LOW' | 'REVIEW' | 'HOLD';
  purchase_value: number;
}

export interface ClusterDetailSchema extends ClusterSchema {
  members: ClusterMember[];
}

export interface AuditLogEntrySchema {
  id: number;
  user_id: string;
  action: 'approve' | 'escalate' | 'dismiss';
  risk_score: number;
  cluster_id: number;
  reviewer: string;
  timestamp: string;
}

export interface ConfusionMatrix {
  true_negative: number;
  false_positive: number;
  false_negative: number;
  true_positive: number;
}

export interface PRCurvePoint {
  threshold: number;
  precision: number;
  recall: number;
}

export interface MetricsSchema {
  threshold_used: number;
  precision: number;
  recall: number;
  f1_score: number;
  confusion_matrix: ConfusionMatrix;
  test_set_size: number;
  test_fraud_count: number;
  pr_curve: PRCurvePoint[];
}

export interface CostCurvePoint {
  threshold: number;
  false_positives: number;
  false_negatives: number;
  true_positives: number;
  fp_cost: number;
  fn_cost: number;
  total_cost: number;
}

export interface CostAssumptions {
  review_cost_per_false_positive: number;
  avg_fraud_amount_per_false_negative: number;
  chargeback_fee_per_false_negative: number;
  fn_cost_per_case: number;
}

export interface CostCurveSchema {
  cost_assumptions: CostAssumptions;
  optimal_threshold: number;
  optimal_total_cost: number;
  curve: CostCurvePoint[];
}
