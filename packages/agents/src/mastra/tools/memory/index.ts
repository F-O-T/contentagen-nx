import {
   getInstructionsTool,
   getInstructionsToolInstructions,
} from "./get-instructions-tool";

// Re-export for convenience
export {
   getInstructionsTool,
   getInstructionsToolInstructions,
} from "./get-instructions-tool";

// Combined instructions for all memory tools
export function getAllMemoryToolInstructions(): string {
   return `
# MEMORY TOOLS
These tools help you access persistent memories and instructions.

${getInstructionsToolInstructions()}
`;
}

// All memory tools as an object for agent registration
export const memoryTools = {
   getInstructionMemories: getInstructionsTool,
};
