import { describe, expect, it } from 'vitest';
import {
  ALGORITHM_METADATA,
  CLINICAL_BENCHMARK_TEST_CASES,
  RISK_SCORING_MODELS,
  assessPatientRisk
} from './predictionEngine';

describe('clinical decision-support benchmark suite', () => {
  it.each(CLINICAL_BENCHMARK_TEST_CASES)(
    '$id: $title matches the expected clinical classification',
    (testCase) => {
      const result = assessPatientRisk(
        testCase.patient,
        RISK_SCORING_MODELS.GUIDELINE_ENSEMBLE
      );

      expect(result.overallRiskLevel).toBe(testCase.expectedRisk);
      expect(result.hypertension.category).toBe(testCase.expectedHtCategory);
      expect(result.diabetes.category).toBe(testCase.expectedDbCategory);
      expect(result.modelUsed).toBe(RISK_SCORING_MODELS.GUIDELINE_ENSEMBLE);
    }
  );

  it('exposes only defined deterministic scoring strategies', () => {
    expect(Object.values(RISK_SCORING_MODELS)).toHaveLength(3);
    expect(Object.values(RISK_SCORING_MODELS)).not.toContain(undefined);
    expect(ALGORITHM_METADATA.type).toContain('Deterministic');
  });

  it('defaults to the guideline ensemble strategy', () => {
    const result = assessPatientRisk(CLINICAL_BENCHMARK_TEST_CASES[0].patient);
    expect(result.modelUsed).toBe(RISK_SCORING_MODELS.GUIDELINE_ENSEMBLE);
  });
});
