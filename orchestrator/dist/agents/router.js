import { randomUUID } from 'crypto';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { complete as groqComplete } from './providers/groq';
import { complete as claudeComplete } from './providers/claude';
import { complete as geminiComplete } from './providers/gemini';
import { finalizerOutputSchema, judgeOutputSchema, refinerDiffSchema, refinerOutputSchema, reviewerOutputSchema, runConfigSchema, runSummarySchema, swotOutputSchema } from './schemas';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_ROOT = path.resolve(__dirname, '..', 'data', 'runs');
const RESUME_ROOT = path.resolve(__dirname, '..', 'resume');
const INCLUDE_DIR = path.join(RESUME_ROOT, 'includes');
const BUILD_SCRIPT = path.resolve(__dirname, '..', 'scripts', 'build-resume.sh');
const providers = {
    groq: groqComplete,
    claude: claudeComplete,
    gemini: geminiComplete
};
function nowIso() {
    return new Date().toISOString();
}
async function ensureDir(dir) {
    await fs.mkdir(dir, { recursive: true });
}
async function readRoleTemplate(role) {
    const filePath = path.join(__dirname, 'roles', `${role}.md`);
    return fs.readFile(filePath, 'utf8');
}
async function loadResumeContext() {
    const result = { main: '', includes: {} };
    try {
        result.main = await fs.readFile(path.join(RESUME_ROOT, 'cv.tex'), 'utf8');
    }
    catch (error) {
        throw new Error('Missing resume/cv.tex. Please add the base resume.');
    }
    try {
        const entries = await fs.readdir(INCLUDE_DIR, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isFile() && entry.name.endsWith('.tex')) {
                const content = await fs.readFile(path.join(INCLUDE_DIR, entry.name), 'utf8');
                result.includes[entry.name] = content;
            }
        }
    }
    catch (error) {
        // includes optional; ignore if directory absent
    }
    return result;
}
function buildPrompt(role, context) {
    const base = `Job Description:\n${context.jd.trim()}\n\nMain Resume (cv.tex):\n${context.resume.main.trim()}\n\nIncludes:\n${Object.entries(context.resume.includes)
        .map(([file, content]) => `--- ${file} ---\n${content.trim()}`)
        .join('\n\n')}`;
    switch (role) {
        case 'reviewer':
            return {
                system: '',
                user: `${base}\n\nReturn Reviewer JSON.`
            };
        case 'swot':
            return {
                system: JSON.stringify(context.reviewer ?? {}),
                user: `${base}\n\nReviewer JSON is in the system prompt.`
            };
        case 'refiner':
            return {
                system: JSON.stringify({ reviewer: context.reviewer, swot: context.swot }),
                user: `${base}\n\nProduce diffs adhering to the schema.`
            };
        case 'judge':
            return {
                system: JSON.stringify({ reviewer: context.reviewer, swot: context.swot }),
                user: `${base}\n\nRefiner output:\n${JSON.stringify(context.refiner)}\n\nJudge per schema.`
            };
        case 'finalizer':
            return {
                system: '',
                user: `${base}\n\nRefiner output:\n${JSON.stringify(context.refiner)}\nJudge output:\n${JSON.stringify(context.judge)}`
            };
        default:
            throw new Error(`Unsupported role ${role}`);
    }
}
function normalizeLineEndings(text) {
    return text.replace(/\r?\n/g, '\n');
}
function annotateContent(content) {
    const trimmed = normalizeLineEndings(content).trim();
    const annotated = trimmed.startsWith('% [agent:finalizer]')
        ? trimmed
        : `% [agent:finalizer]\n${trimmed}`;
    return annotated.split(/\n/);
}
function applyInsert(lines, index, fragment) {
    const snippet = annotateContent(fragment);
    lines.splice(index, 0, ...snippet);
}
function applyReplace(lines, start, end, fragment) {
    const snippet = annotateContent(fragment);
    lines.splice(start, Math.max(0, end - start), ...snippet);
}
function applyDelete(lines, start, end) {
    const count = Math.max(0, end - start);
    lines.splice(start, count);
}
function findAnchor(lines, anchor) {
    if (anchor.startsWith('line:')) {
        const lineNumber = Number(anchor.split(':')[1]);
        const idx = Math.max(0, Math.min(lines.length, lineNumber - 1));
        return { start: idx, end: idx + 1 };
    }
    if (anchor.startsWith('regex:')) {
        const pattern = anchor.slice('regex:'.length);
        const regex = new RegExp(pattern, 'm');
        const text = lines.join('\n');
        const match = regex.exec(text);
        if (!match || match.index === undefined) {
            throw new Error(`Regex anchor not found: ${pattern}`);
        }
        const before = text.slice(0, match.index).split('\n').length - 1;
        const matchLines = match[0].split('\n').length;
        return { start: before, end: before + matchLines };
    }
    if (anchor.startsWith('SECTION:')) {
        const key = anchor.slice('SECTION:'.length).trim();
        const idx = lines.findIndex((line) => line.includes(`SECTION:${key}`));
        if (idx === -1) {
            throw new Error(`Section anchor not found: ${key}`);
        }
        return { start: idx + 1, end: idx + 1 };
    }
    throw new Error(`Unsupported anchor format: ${anchor}`);
}
async function applyDiff(targetPath, diff, dryRun) {
    const original = await fs.readFile(targetPath, 'utf8');
    const normalized = normalizeLineEndings(original);
    const lines = normalized.split('\n');
    const location = findAnchor(lines, diff.anchor);
    const preview = buildPreview(original, diff, location);
    if (dryRun) {
        return { updated: false, preview };
    }
    const before = original;
    switch (diff.patch_type) {
        case 'insert':
            applyInsert(lines, location.end, diff.content);
            break;
        case 'replace':
            applyReplace(lines, location.start, location.end, diff.content);
            break;
        case 'delete':
            applyDelete(lines, location.start, location.end);
            break;
        default:
            throw new Error(`Unknown patch type ${diff.patch_type}`);
    }
    let nextContent = lines.join('\n');
    if (!nextContent.endsWith('\n')) {
        nextContent = `${nextContent}\n`;
    }
    await fs.writeFile(targetPath, nextContent, 'utf8');
    return { updated: true, preview, backup: before };
}
function buildPreview(original, diff, location) {
    const header = `# Diff for ${diff.target_file} (${diff.patch_type} @ ${diff.anchor})`;
    const contextLines = original.split(/\r?\n/).slice(Math.max(0, location.start - 3), location.end + 3);
    return `${header}\n${contextLines.join('\n')}\n---\n${diff.content}`;
}
async function runBuild(runId) {
    await ensureDir(path.join(DATA_ROOT, runId));
    const logPath = path.join(DATA_ROOT, runId, 'build.log');
    const pdfPath = path.join(DATA_ROOT, runId, 'final.pdf');
    const child = spawn(BUILD_SCRIPT, [runId], {
        cwd: path.resolve(__dirname, '..'),
        stdio: ['ignore', 'pipe', 'pipe']
    });
    const chunks = [];
    child.stdout.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    child.stderr.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    const exitCode = await new Promise((resolve) => {
        child.on('close', resolve);
    });
    await fs.writeFile(logPath, Buffer.concat(chunks));
    if (exitCode === 0) {
        return { status: 'OK', logPath, pdfPath };
    }
    return { status: 'FAILED', logPath, pdfPath: null };
}
async function readJsonFile(filePath) {
    try {
        const text = await fs.readFile(filePath, 'utf8');
        return JSON.parse(text);
    }
    catch (error) {
        return null;
    }
}
export class ResumeRunRouter {
    async createRun(configInput) {
        const config = runConfigSchema.parse(configInput);
        const runId = randomUUID();
        const runDir = path.join(DATA_ROOT, runId);
        await ensureDir(runDir);
        const resume = await loadResumeContext();
        const initialState = {
            id: runId,
            status: 'running',
            config,
            artifacts: [
                ...['reviewer', 'swot', 'refiner', 'judge', 'finalizer'].map((role) => ({
                    role,
                    status: 'pending'
                }))
            ],
            createdAt: nowIso(),
            updatedAt: nowIso(),
            pdfPath: null,
            logPath: null,
            diffSummary: null
        };
        await fs.writeFile(path.join(runDir, 'config.json'), JSON.stringify(config, null, 2));
        await this.writeState(runDir, initialState);
        try {
            const reviewer = await this.invokeReviewer(runDir, initialState, resume);
            const swot = await this.invokeSwot(runDir, initialState, resume, reviewer);
            const { refiner, diffPreview } = await this.invokeRefiner(runDir, initialState, resume, reviewer, swot);
            const judge = await this.invokeJudge(runDir, initialState, resume, reviewer, swot, refiner);
            if (judge.status === 'REVISE') {
                const { refiner: secondRefiner, diffPreview: diffPreview2 } = await this.invokeRefiner(runDir, initialState, resume, reviewer, swot, refiner, judge);
                const secondJudge = await this.invokeJudge(runDir, initialState, resume, reviewer, swot, secondRefiner, judge);
                if (secondJudge.status === 'REVISE') {
                    initialState.status = 'needs_review';
                    initialState.diffSummary = diffPreview2;
                    await this.finalizeState(runDir, initialState);
                    return this.readSummary(runDir);
                }
                initialState.diffSummary = diffPreview2;
                const finalOutput = await this.invokeFinalizer(runDir, initialState, resume, secondRefiner, secondJudge, config.dryRun);
                initialState.pdfPath = finalOutput.build.pdf_path;
                initialState.logPath = finalOutput.build.log_path;
                initialState.status = finalOutput.build.status === 'OK' ? 'completed' : 'needs_review';
                initialState.diffSummary = diffPreview2;
                await this.finalizeState(runDir, initialState);
                return this.readSummary(runDir);
            }
            initialState.diffSummary = diffPreview;
            const finalOutput = await this.invokeFinalizer(runDir, initialState, resume, refiner, judge, config.dryRun);
            initialState.pdfPath = finalOutput.build.pdf_path;
            initialState.logPath = finalOutput.build.log_path;
            initialState.status = finalOutput.build.status === 'OK' ? 'completed' : 'needs_review';
            await this.finalizeState(runDir, initialState);
            return this.readSummary(runDir);
        }
        catch (error) {
            initialState.status = 'failed';
            initialState.updatedAt = nowIso();
            await this.writeState(runDir, initialState);
            throw error;
        }
    }
    async listRuns() {
        await ensureDir(DATA_ROOT);
        const entries = await fs.readdir(DATA_ROOT);
        const summaries = [];
        for (const id of entries) {
            const summary = await this.readSummary(path.join(DATA_ROOT, id));
            if (summary)
                summaries.push(summary);
        }
        return summaries.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    }
    async getRun(runId) {
        const summary = await this.readSummary(path.join(DATA_ROOT, runId));
        if (!summary) {
            throw new Error(`Run ${runId} not found`);
        }
        return summary;
    }
    async invokeReviewer(runDir, state, resume) {
        return this.invokeLLM('reviewer', reviewerOutputSchema, runDir, state, {
            resume,
            reviewer: undefined,
            jd: state.config.jobDescription
        });
    }
    async invokeSwot(runDir, state, resume, reviewer) {
        return this.invokeLLM('swot', swotOutputSchema, runDir, state, {
            resume,
            reviewer,
            jd: state.config.jobDescription
        });
    }
    async invokeRefiner(runDir, state, resume, reviewer, swot, prevRefiner, judge) {
        const refiner = await this.invokeLLM('refiner', refinerOutputSchema, runDir, state, {
            resume,
            reviewer,
            swot,
            refiner: prevRefiner,
            judge,
            jd: state.config.jobDescription
        });
        const diffPreview = refiner.diffs
            .map((diff) => `File: ${diff.target_file}\nType: ${diff.patch_type}\nAnchor: ${diff.anchor}\nContent:\n${diff.content}\n---`)
            .join('\n');
        return { refiner, diffPreview };
    }
    async invokeJudge(runDir, state, resume, reviewer, swot, refiner, previousJudge) {
        return this.invokeLLM('judge', judgeOutputSchema, runDir, state, {
            resume,
            reviewer,
            swot,
            refiner,
            judge: previousJudge,
            jd: state.config.jobDescription
        });
    }
    async invokeFinalizer(runDir, state, resume, refiner, judge, dryRun) {
        const artifacts = state.artifacts.find((a) => a.role === 'finalizer');
        if (artifacts)
            artifacts.status = 'running';
        await this.writeState(runDir, state);
        const applied = [];
        const previews = [];
        for (const diff of refiner.diffs) {
            const targetPath = path.resolve(__dirname, '..', diff.target_file);
            try {
                refinerDiffSchema.parse(diff);
                const result = await applyDiff(targetPath, diff, dryRun);
                previews.push(result.preview);
                if (result.updated && !dryRun && typeof result.backup === 'string') {
                    applied.push({ path: targetPath, backup: result.backup });
                }
            }
            catch (error) {
                previews.push(`Failed to apply ${diff.target_file}: ${error.message}`);
            }
        }
        let buildResult = dryRun ? { status: 'OK', logPath: 'dry-run', pdfPath: null } : { status: 'OK', logPath: path.join(runDir, 'build.log'), pdfPath: path.join(runDir, 'final.pdf') };
        if (!dryRun) {
            buildResult = await runBuild(state.id);
            if (buildResult.status === 'FAILED' && applied.length > 0) {
                const lastChange = applied[applied.length - 1];
                await fs.writeFile(lastChange.path, lastChange.backup, 'utf8');
                applied.pop();
            }
        }
        const finalOutput = finalizerOutputSchema.parse({
            applied: dryRun ? 0 : applied.length,
            skipped: dryRun ? refiner.diffs.length : refiner.diffs.length - applied.length,
            build: {
                status: buildResult.status,
                log_path: buildResult.logPath,
                pdf_path: buildResult.pdfPath
            }
        });
        await fs.writeFile(path.join(runDir, 'finalizer.json'), JSON.stringify(finalOutput, null, 2));
        if (artifacts) {
            artifacts.status = finalOutput.build.status === 'OK' ? 'succeeded' : 'failed';
            artifacts.output = finalOutput;
            artifacts.storedPath = path.join(runDir, 'finalizer.json');
        }
        state.diffSummary = previews.length > 0 ? previews.join('\n\n') : null;
        state.updatedAt = nowIso();
        await this.writeState(runDir, state);
        return finalOutput;
    }
    async invokeLLM(role, schema, runDir, state, context) {
        const artifact = state.artifacts.find((item) => item.role === role);
        if (!artifact) {
            throw new Error(`Artifact for role ${role} missing`);
        }
        artifact.status = 'running';
        state.updatedAt = nowIso();
        await this.writeState(runDir, state);
        const promptParts = buildPrompt(role, context);
        const roleTemplate = await readRoleTemplate(role);
        const providerId = state.config.providers[role];
        const provider = providers[providerId];
        if (!provider) {
            throw new Error(`Provider ${providerId} not implemented`);
        }
        const systemSections = [roleTemplate.trim()];
        if (promptParts.system && promptParts.system.trim().length > 0) {
            systemSections.push(promptParts.system.trim());
        }
        systemSections.push('Follow the schema strictly.');
        const prompt = {
            system: systemSections.filter(Boolean).join('\n\n'),
            user: promptParts.user
        };
        const options = {
            model: this.resolveModel(providerId, role),
            temperature: 0.2,
            max_tokens: 2048,
            timeoutMs: 60000
        };
        const response = await provider(prompt, options);
        let parsed;
        try {
            parsed = JSON.parse(response.content);
        }
        catch (error) {
            throw new Error(`Role ${role} returned invalid JSON: ${error.message}`);
        }
        const validated = schema.parse(parsed);
        const artifactPath = path.join(runDir, `${role}.json`);
        await fs.writeFile(artifactPath, JSON.stringify(validated, null, 2));
        artifact.status = 'succeeded';
        artifact.output = validated;
        artifact.storedPath = artifactPath;
        state.updatedAt = nowIso();
        await this.writeState(runDir, state);
        return validated;
    }
    resolveModel(providerId, role) {
        const defaults = {
            groq: 'llama3-70b-8192',
            claude: 'claude-3-sonnet-20240229',
            gemini: 'gemini-1.5-pro'
        };
        return defaults[providerId] ?? 'gpt-4o-mini';
    }
    async writeState(runDir, state) {
        const summary = {
            id: state.id,
            status: state.status,
            config: state.config,
            artifacts: state.artifacts,
            createdAt: state.createdAt,
            updatedAt: nowIso(),
            pdfPath: state.pdfPath ?? null,
            logPath: state.logPath ?? null,
            diffSummary: state.diffSummary ?? null
        };
        await fs.writeFile(path.join(runDir, 'summary.json'), JSON.stringify(summary, null, 2));
    }
    async finalizeState(runDir, state) {
        state.updatedAt = nowIso();
        await this.writeState(runDir, state);
    }
    async readSummary(runDir) {
        const summary = await readJsonFile(path.join(runDir, 'summary.json'));
        if (!summary) {
            throw new Error(`No summary at ${runDir}`);
        }
        return runSummarySchema.parse(summary);
    }
}
export default ResumeRunRouter;
