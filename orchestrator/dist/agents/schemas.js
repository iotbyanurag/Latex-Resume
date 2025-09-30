import { z } from 'zod';
export const roleNames = [
    'reviewer',
    'swot',
    'refiner',
    'judge',
    'finalizer'
];
export const reviewerOutputSchema = z.object({
    ats_keywords: z.array(z.string()).max(200),
    coverage: z.object({
        must_have_pct: z.number().min(0).max(100),
        nice_to_have_pct: z.number().min(0).max(100)
    }),
    section_issues: z
        .array(z.object({
        section: z.string(),
        issue: z.string(),
        evidence: z.string()
    }))
        .max(50),
    bullet_suggestions: z
        .array(z.object({
        section: z.string(),
        latex_fragment: z.string(),
        rationale: z.string()
    }))
        .max(50)
});
export const swotOutputSchema = z.object({
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    opportunities: z.array(z.string()),
    threats: z.array(z.string()),
    positioning_statement: z.string()
});
const diffPatchTypes = z.enum(['insert', 'replace', 'delete']);
export const refinerDiffSchema = z.object({
    target_file: z.string().min(1),
    patch_type: diffPatchTypes,
    anchor: z.string().min(1),
    content: z.string().min(1),
    rationale: z.string().min(1)
});
export const refinerOutputSchema = z.object({
    diffs: z.array(refinerDiffSchema).max(40)
});
export const judgeOutputSchema = z.object({
    status: z.enum(['PASS', 'REVISE']),
    reasons: z.array(z.string()),
    numeric_scores: z.object({
        clarity: z.number().min(0).max(10),
        brevity: z.number().min(0).max(10),
        impact: z.number().min(0).max(10),
        ats_fit: z.number().min(0).max(10)
    }),
    flagged: z.array(z.object({
        file: z.string(),
        reason: z.string(),
        suggestion: z.string()
    }))
});
export const finalizerOutputSchema = z.object({
    applied: z.number().int().nonnegative(),
    skipped: z.number().int().nonnegative(),
    build: z.object({
        status: z.enum(['OK', 'FAILED']),
        log_path: z.string(),
        pdf_path: z.string().nullable()
    })
});
export const roleSchemaMap = {
    reviewer: reviewerOutputSchema,
    swot: swotOutputSchema,
    refiner: refinerOutputSchema,
    judge: judgeOutputSchema,
    finalizer: finalizerOutputSchema
};
export const providerNameSchema = z.enum(['groq', 'claude', 'gemini']);
export const providerMapSchema = z.object({
    reviewer: providerNameSchema,
    swot: providerNameSchema,
    refiner: providerNameSchema,
    judge: providerNameSchema,
    finalizer: providerNameSchema
});
export const runConfigSchema = z.object({
    jobDescription: z.string().min(10),
    dryRun: z.boolean(),
    providers: providerMapSchema
});
export const runArtifactSchema = z.object({
    role: z.enum(roleNames),
    status: z.enum(['pending', 'running', 'succeeded', 'failed']),
    output: z.unknown().optional(),
    error: z.string().optional(),
    storedPath: z.string().optional()
});
export const runSummarySchema = z.object({
    id: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    status: z.enum(['pending', 'running', 'needs_review', 'failed', 'completed']),
    config: runConfigSchema,
    artifacts: z.array(runArtifactSchema),
    pdfPath: z.string().nullable().optional(),
    logPath: z.string().nullable().optional(),
    diffSummary: z.string().nullable().optional()
});
