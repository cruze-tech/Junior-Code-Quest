export default class CodeInterpreter {
    parse(code) {
        try {
            const lines = code.trim().split('\n').map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith('//'));
            const actions = this.processBlock(lines);
            return { success: true, actions };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    processBlock(lines) {
        let actions = [];
        let i = 0;
        while (i < lines.length) {
            const line = lines[i];
            const repeatMatch = line.match(/^repeat\((\d+)\)\s*\{$/);
            
            if (repeatMatch) {
                const repeatCount = parseInt(repeatMatch[1], 10);
                const blockEnd = this.findBlockEnd(lines, i);
                if (blockEnd === -1) {
                    throw new Error(`Syntax Error: Missing closing '}' for repeat on line ${i + 1}.`);
                }
                const blockLines = lines.slice(i + 1, blockEnd);
                const blockActions = this.processBlock(blockLines);

                for (let j = 0; j < repeatCount; j++) {
                    actions.push(...blockActions);
                }
                i = blockEnd; // Move pointer past the repeat block
            } else if (line === '}') {
                 throw new Error(`Syntax Error: Unexpected '}' on line ${i + 1}.`);
            } else {
                actions.push(this.parseSingleCommand(line, i + 1));
            }
            i++;
        }
        return actions;
    }
    
    findBlockEnd(lines, startIndex) {
        let openBraces = 1;
        for (let i = startIndex + 1; i < lines.length; i++) {
            if (lines[i].includes('{')) openBraces++;
            if (lines[i] === '}') openBraces--;
            if (openBraces === 0) return i;
        }
        return -1;
    }

    parseSingleCommand(line, lineNumber) {
        const commandMatch = line.match(/^(moveForward|turnLeft|turnRight)\(\s*\)$/);
        if (commandMatch) {
            return commandMatch[1];
        }
        throw new Error(`Syntax Error: Unknown command "${line}" on line ${lineNumber}.`);
    }
}