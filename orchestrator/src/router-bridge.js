#!/usr/bin/env node
/**
 * Node.js Router Bridge for FastMCP
 * This script allows Python FastMCP to call Node.js router functions
 */

import { ResumeRunRouter } from '../agents/index.js';

const router = new ResumeRunRouter();

// Get command line arguments
const [,, functionName, ...args] = process.argv;

if (!functionName) {
    console.error('Usage: node router-bridge.js <functionName> [args...]');
    process.exit(1);
}

async function callFunction() {
    try {
        let result;
        const argsObj = args.length > 0 ? JSON.parse(args[0]) : {};

        switch (functionName) {
            case 'listRuns':
                result = await router.listRuns();
                break;
            case 'getRun':
                result = await router.getRun(argsObj.runId);
                break;
            case 'createRun':
                result = await router.createRun(argsObj);
                break;
            default:
                throw new Error(`Unknown function: ${functionName}`);
        }

        console.log(JSON.stringify({ result }));
    } catch (error) {
        console.error(JSON.stringify({ error: error.message }));
        process.exit(1);
    }
}

callFunction();
