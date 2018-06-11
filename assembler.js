class Assembler {
  error(lineNo, line, reason) {
    console.error(`Syntax Error: Line ${lineNo} ${reason || ''}\n${line}`);
  }

  parseInstruction(line) {
    const split = line.replace(',', '').split(' ');
    split[0] = split[0].toUpperCase();
    return split;
  }

  assemble(programText) {
    const program = programText.replace('\r', '').split('\n');
    const ops = [];

    for (let i = 0; i < program.length; i++) {
      const line = program[i];
      const split = this.parseInstruction(line);
      let nnn;
      let Vx;
      let Vy;
      let byte;
      const arg1 = split[1];
      const arg2 = split[2];

      if (split[1]) {
        nnn = parseInt(split[1], 16);
        if (split[1][0] === 'V') {
          Vx = parseInt(split[1][1], 16);
        }
      }

      if (split[2]) {
        byte = parseInt(split[2], 16);
        if (split[2][0] === 'V') {
          Vy = parseInt(split[2][1], 16);
        }
      }
      switch (split[0]) {
        case 'CLS': // 00E0
          ops.push(0x00E0);
          break;
        case 'RET': // 00E0
          ops.push(0x00EE);
          break;
        case 'JP': // 1nnn
          if (split[1] === 'V0' && split[2]) { // Bnnn
            nnn = parseInt(split[2], 16); // This is kind of hackish
            ops.push(0xB000 | nnn);
            break;
          } else if (nnn) {
            ops.push(0x1000 | nnn);
            break;
          }
          this.error(i, line, 'missing one or more arguments');
          return;
        case 'CALL': // 2nnn
          if (!nnn) {
            this.error(i, line, 'nnn missing');
            return;
          }
          ops.push(0x2000 | nnn);
          break;
        case 'SE':
          if (Vx && Vy) { // 5xy0
            ops.push(0x5000 | (Vx << 8) | (Vy << 4));
            break;
          } else if (Vx && byte) { // 3xkk
            ops.push(0x3000 | (Vx << 8) | byte);
            break;
          }
          this.error(i, line, 'missing one or more arguments');
          return;
        case 'SNE':
          if (Vx && Vy) { // 9xy0
            ops.push(0x9000 | (Vx << 8) | (Vy << 4));
            break;
          } else if (Vx && byte) { // 4xkk
            ops.push(0x4000 | (Vx << 8) | byte);
            break;
          }
          this.error(i, line, 'missing one or more arguments');
          return;
        case 'LD':
          if (Vx !== undefined && Vy !== undefined) { // 8xy0
            ops.push(0x8000 | (Vx << 8) | (Vy << 4));
            break;
          } else if (Vx !== undefined && byte !== undefined) { // 6xkk
            ops.push(0x6000 | (Vx << 8) | byte);
            break;
          } else if (arg1 === 'I') { // Annn
            ops.push(0xA000 | nnn);
            break;
          } else if (Vx !== undefined !== undefined && arg2 === 'DT') { // Fx07
            ops.push(0xF007 | (Vx << 8));
            break;
          } else if (Vx !== undefined && arg2 === 'K') { // Fx0A
            ops.push(0xF00A | (Vx << 8));
            break;
          } else if (Vx !== undefined && arg2 === '[I]') { // Fx65
            ops.push(0xF065 | (Vx << 8));
            break;
          } else if (arg1 === 'DT' && Vy !== undefined) { // Fx15
            ops.push(0xF018 | (Vx << 8));
            break;
          } else if (arg1 === 'ST' && Vy !== undefined) { // Fx18
            ops.push(0xF018 | (Vx << 8));
            break;
          } else if (arg1 === 'F' && Vy !== undefined) { // Fx29
            ops.push(0xF029 | (Vy << 8));
            break;
          } else if (arg1 === 'B' && Vx) { // Fx33
            ops.push(0xF033 | (Vx << 8));
            break;
          } else if (arg1 === '[I]' && Vx) { // Fx55
            ops.push(0xF055 | (Vx << 8));
            break;
          }
          this.error(i, line, 'missing one or more arguments');
          return;
        case 'ADD':
          if (Vx !== undefined && Vy) { // 8xy4
            ops.push(0x8004 | (Vx << 8) | (Vy << 4));
            break;
          } else if (Vx !== undefined && byte) { // 7xkk
            ops.push(0x7000 | (Vx << 8) | byte);
            break;
          } else if (split[1] === 'I' && Vx) {
            ops.push(0xF01E | (Vx << 8));
            break;
          }
          this.error(i, line, 'missing one or more arguments');
          return;
        case 'OR':
          if (Vx !== undefined && Vy) { // 8xy1
            ops.push(0x8001 | (Vx << 8) | (Vy << 4));
            break;
          }
          this.error(i, line, 'missing one or more arguments');
          return;
        case 'AND':
          if (Vx !== undefined && Vy) { // 8xy2
            ops.push(0x8002 | (Vx << 8) | (Vy << 4));
            break;
          }
          this.error(i, line, 'missing one or more arguments');
          return;
        case 'XOR':
          if (Vx !== undefined && Vy) { // 8xy3
            ops.push(0x8003 | (Vx << 8) | (Vy << 4));
            break;
          }
          this.error(i, line, 'missing one or more arguments');
          return;
        case 'SUB':
          if (Vx !== undefined && Vy) { // 8xy5
            ops.push(0x8005 | (Vx << 8) | (Vy << 4));
            break;
          }
          this.error(i, line, 'missing one or more arguments');
          return;
        case 'SHR':
          if (Vx !== undefined && Vy) { // 8xy6
            ops.push(0x8006 | (Vx << 8) | (Vy << 4));
            break;
          }
          this.error(i, line, 'missing one or more arguments');
          return;
        case 'SUBN':
          if (Vx !== undefined && Vy) { // 8xy7
            ops.push(0x8007 | (Vx << 8) | (Vy << 4));
            break;
          }
          this.error(i, line, 'missing one or more arguments');
          return;
        case 'SHL':
          if (Vx !== undefined && Vy) { // 8xyE
            ops.push(0x8007 | (Vx << 8) | (Vy << 4));
            break;
          }
          this.error(i, line, 'missing one or more arguments');
          return;
        case 'RND':
          if (Vx !== undefined && byte) { // Cxkk
            ops.push(0xC000 | (Vx << 8) | byte);
            break;
          }
          this.error(i, line, 'missing one or more arguments');
          return;
        case 'DRW':
          if (Vx !== undefined && Vy && split[3]) { // Dxyn
            const n = parseInt(split[3], 16);
            ops.push(0xD000 | (Vx << 8) | (Vy << 4) | n);
            break;
          }
          this.error(i, line, 'missing one or more arguments');
          return;
        case 'SKP':
          if (Vx !== undefined) { // Ex9E
            ops.push(0xE09E | (Vx << 8));
            break;
          }
          this.error(i, line, 'missing Vx');
          return;
        case 'SKNP':
          if (Vx !== undefined) { // ExA1
            ops.push(0xE0A1 | (Vx << 8));
            break;
          }
          this.error(i, line, 'missing Vx');
          return;
      }
    }

    return ops; // eslint-disable-line consistent-return
  }
}
module.exports = Assembler;
