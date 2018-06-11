class Interpreter {
  constructor() {
    this.memory = new Array(0xFFF);
    this.registers = new Array(16);
    this.I = 0;
    this.delayTimer = 0;
    this.soundTimer = 0;
    this.PC = 0;
    this.SP = 0;
    this.stack = Array(12);
    this.keys = new Array(16);
    this.waitingForKey = false;
    this.waitingRegister = 0;
    this.screen = [[]];
    this.delayInterval = null;
    this.soundInterval = null;
  }

  loadFont() {
    const font = [
      0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
      0x20, 0x60, 0x20, 0x20, 0x70, // 1
      0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
      0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
      0x90, 0x90, 0xF0, 0x10, 0x10, // 4
      0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
      0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
      0xF0, 0x10, 0x20, 0x40, 0x40, // 7
      0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
      0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
      0xF0, 0x90, 0xF0, 0x90, 0x90, // A
      0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
      0xF0, 0x80, 0x80, 0x80, 0xF0, // C
      0xE0, 0x90, 0x90, 0x90, 0xE0, // D
      0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
      0xF0, 0x80, 0xF0, 0x80, 0x80, // F
    ];
    for (let i = 0; i < font.length; i++) {
      this.memory[i] = font[i];
    }
  }

  timerFunc(timer) {
    if (timer > 0) {
      timer -= 1;
    }
  }

  clearScreen() {
    for (let y = 0; y < 32; y++) {
      this.screen[y] = new Array(64);
      this.screen[y].fill(0);
    }
  }

  initialize() {
    this.I = 0;
    this.delayTimer = 0;
    this.soundTimer = 0;
    this.PC = 0;
    this.SP = 0;
    this.waitingForKey = false;
    this.waitingRegister = 0;

    // Fill arrays with zeros
    this.memory.fill(0);
    this.registers.fill(0);
    this.stack.fill(0);
    this.keys.fill(0);

    // Clear screen
    this.clearScreen();

    // Put font in memory
    this.loadFont();

    // Clear timers if they already exist
    if (this.delayInterval) clearInterval(this.delayInterval);
    if (this.soundInterval) clearInterval(this.soundInterval);

    // Start timers (60 Hz = ~16.7ms)
    this.delayInterval = setInterval(() => {
      if (this.delayTimer > 0) {
        this.delayTimer--;
        // console.log(this.delayTimer);
      }
    }, 17);
    this.soundInterval = setInterval(() => {
      if (this.soundTimer > 0) {
        this.soundTimer--;
        // console.log(this.soundTimer);
      }
    }, 17);
  }

  // Maybe learn to write an assembler for this?
  loadProgram(program) {
    for (let x = 0; x < program.length; x += 1) {
      this.memory[0x200 + x] = program[x];
    }
  }

  step() {
    // We're waiting on a key input due to opcode LD Vx, K
    if (this.waitingForKey) {
      if (this.keys.some(k => k !== 0)) {
        for (let i = 0; i < this.keys.length; i++) {
          if (this.keys[i]) {
            this.registers[this.waitingRegister] = i;
            // console.log(`Key ${this.registers[this.waitingRegister]}`);
            break;
          }
        }
        this.waitingForKey = false;
      }
      return;
    }

    const instr = (this.memory[this.PC] << 8) + this.memory[this.PC + 1];
    this.PC = this.PC + 2;
    const nnn = instr & 0xFFF;
    const n = instr & 0xF;
    const x = (instr & 0xF00) >> 8;
    const y = (instr & 0xF0) >> 4;
    const kk = instr & 0xFF;
    const op = (instr & 0xF000) >> 12;
    console.log(`OpCode: ${instr.toString(16).toUpperCase()} nnn: ${nnn.toString(16)} n: ${n.toString(16)} x: ${x.toString(16)} y: ${y.toString(16)} kk: ${kk.toString(16)} op: ${op.toString(16)}`);

    if (op === 0x0) {
      if (kk === 0xE0) {
        this.clearScreen();
        return;
      }
      // Return from subroutine
      if (kk === 0xEE) {
        this.PC = this.stack[this.SP];
        this.SP = this.SP - 1;
        return;
      }

      // Originally used to call Telmac 1800 programs.
      // We're not a Telmac 1800 so we can't do that.
      console.error('SYS addr command not supported!');
    }
    // 1NNN - JP nnn
    if (op === 0x1) {
      this.PC = nnn;
      return;
    }
    // CALL addr
    if (op === 0x2) {
      this.SP = this.SP + 1;
      this.stack[this.SP] = this.PC;
      this.PC = nnn;
      return;
    }
    // SE Vx, byte
    if (op === 0x3) {
      if (this.registers[x] === kk) {
        this.PC = this.PC + 2;
      }
      return;
    }
    // SN Vx, byte
    if (op === 0x4) {
      if (this.registers[x] !== kk) {
        this.PC = this.PC + 2;
      }
      return;
    }
    // SE Vx, Vy
    if (op === 0x5) {
      if (this.registers[x] === this.registers[y]) {
        this.PC = this.PC + 2;
      }
      return;
    }
    // LD Vx, byte
    if (op === 0x6) {
      this.registers[x] = kk;
      return;
    }
    // ADD Vx, byte
    if (op === 0x7) {
      this.registers[x] = (this.registers[x] + kk) & 0xFF;
      return;
    }
    // Load, bitwise operations, some math
    if (op === 0x8) {
      switch (n) {
        case 0x0: // LD Vx, Vy
          this.registers[y] = this.registers[x];
          break;
        case 0x1: // OR Vx, Vy
          this.registers[x] = this.registers[x] | this.registers[y];
          break;
        case 0x2: // AND Vx, Vy
          this.registers[x] = this.registers[x] & this.registers[y];
          break;
        case 0x3: // XOR Vx, Vy
          this.registers[x] = this.registers[x] ^ this.registers[y];
          break;
        case 0x4: // ADD Vx, Vy
          this.registers[x] = this.registers[x] + this.registers[y];
          this.registers[0xF] = this.registers[x] > 0xFF ? 1 : 0;
          this.registers[x] = this.registers[x] & 0xFF;
          break;
        case 0x5: // SUB Vx, Vy
          const before = this.registers[x];
          this.registers[x] = (this.registers[x] - this.registers[y]) & 0xFF;
          // this.registers[0xF] = this.registers[x] > this.registers[y] ? 1 : 0;
          this.registers[0xF] = this.registers[x] > before ? 1 : 0;
          break;
        case 0x6: // SHR Vx {, Vy}
          // Is this supposed to update Vy too?
          // Documentation and other interpreters seem to disagree here
          this.registers[0xF] = this.registers[y] & 0x1;
          this.registers[y] = this.registers[y] >> 1;
          this.registers[x] = this.registers[y];
          break;
        case 0x7: // SUBN Vx, Vy
          this.registers[0xF] = this.registers[y] > this.registers[x] ? 1 : 0;
          this.registers[x] = (this.registers[y] - this.registers[x]) & 0xFF;
          break;
        case 0xE: // SHL Vx {, Vy}
          this.registers[0xF] = (this.registers[x] >> 7) & 0x1;
          this.registers[x] = (this.registers[x] * 2) & 0xFF;
          break;
        default:
          console.log(`Unknown OpCode 8xy${n.toString(16)}`);
      }
      return;
    }
    // SNE Vx, Vy
    if (op === 0x9) {
      if (this.registers[x] !== this.registers[y]) {
        this.PC = this.PC + 2;
      }
      return;
    }
    // LD I, addr
    if (op === 0xA) {
      this.I = nnn;
      return;
    }
    // JP V0, addr
    if (op === 0xB) {
      this.PC = (nnn + this.registers[0]) & 0xFFF;
      return;
    }
    // RND Vx, byte
    if (op === 0xC) {
      const rand = Math.floor(Math.random() * Math.max(256));
      this.registers[x] = rand & kk;
      return;
    }
    // DRW Vx, Vy, nibble
    if (op === 0xD) {
      // TODO: Make this readable
      // Draw n bytes starting at x,y from location I
      for (let i = 0; i < n; i++) {
        for (let s = 0; s < 8; s++) {
          const before = this.screen[(this.registers[y] + i) & 0x1F][(this.registers[x] + s) & 0x3F];
          this.screen[(this.registers[y] + i) & 0x1F][(this.registers[x] + s) & 0x3F] ^= (this.memory[this.I + i] >> (7 - s)) & 0x1;
          if (before === 1 && (this.screen[(this.registers[y] + i) & 0x1F][(this.registers[x] + s) & 0x3F] === 0)) this.registers[0xF] = 1;
        }
      }
      return;
    }

    // Skips
    if (op === 0xE) {
      // SKP Vx
      if (kk === 0x9E) {
        if (this.keys[x] === 1) this.PC = this.PC + 2;    
        return;
      }
      // SKNP Vx
      if (kk === 0xA1) {
        if (this.keys[x] !== 1) this.PC = this.PC + 2;
        return;
      }
    }

    if (op === 0xF) {
      // LD Vx, DT
      if (kk === 0x07) {
        this.registers[x] = this.delayTimer;
        return;
      }
      // LD Vx, K
      if (kk === 0x0A) {
        // Wait for keypress
        this.waitingForKey = true;
        this.waitingRegister = x;
        return;
      }
      // LD DT, Vx
      if (kk === 0x15) {
        this.delayTimer = this.registers[x];
        return;
      }
      // LD ST, Vx
      if (kk === 0x18) {
        this.soundTimer = this.registers[x];
        return;
      }
      // ADD I, Vx
      if (kk === 0x1E) {
        this.I = (this.I + this.registers[x]) & 0xFFF;
        return;
      }
      // LD F, Vx
      if (kk === 0x29) {
        // Set I to location of sprite for digit x
        this.I = this.registers[x] * 5;
        return;
      }
      // LD B, Vx
      if (kk === 0x33) {
        this.memory[this.I] = Math.floor(((this.registers[x]) / (10 ** 2)) % 10);
        this.memory[this.I + 1] = Math.floor(((this.registers[x]) / 10) % 10);
        this.memory[this.I + 2] = this.registers[x] & 0x1;
        return;
      }
      // LD [I], Vx
      if (kk === 0x55) {
        for (let i = 0; i < x; i++) {
          this.memory[this.I + i] = this.registers[i];
        }
        return;
      }
      // LD Vx, [I]
      if (kk === 0x65) {
        for (let i = 0; i < x; i++) {
          this.registers[i] = this.memory[this.I + i];
        }
        return;
      }
    }
    console.error(`Unmapped opcode! ${instr.toString(16).toUpperCase()}`);
  }

  setKeyDown(val) {
    this.keys[val & 0xF] = 1;
  }

  setKeyUp(val) {
    this.keys[val & 0xF] = 0;
  }

  // Debug functions
  numToHex(num) {
    return `${'0x00'.substring(0, 4 - num.toString(16).length) + num.toString(16).toUpperCase()}`;
  }

  setPC(PC) {
    this.PC = PC;
  }

  listRegs() {
    let out = '';
    for (let i = 0; i < this.registers.length; i += 1) {
      out += `${i > 0 && i % 9 !== 0 ? ' ' : ''}V${i.toString(16).toUpperCase()}: ${this.numToHex(this.registers[i])}${i % 8 === 0 && i > 0 ? '\n' : ''}`;
    }
    out += ` I: 0x${this.I.toString(16).toUpperCase()}`;
    console.log(out);
  }

  getScreenBuffer() {
    const ret = [];
    for (let y = 0; y < this.screen.length; y++) {
      for (let x = 0; x < this.screen[0].length; x++) {
        let color = 1;
        if (this.screen[y][x] === 1) color = 255;
        ret.push(color); // R
        ret.push(color); // G
        ret.push(color); // B
        ret.push(255);   // A
      }
    }
    return ret;
  }

  outputScreen() {
    let out = '';
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 64; x++) {
        out += `${this.screen[y][x].toString(16)}`;
      }
      out += '\n';
    }
    console.log(out);
  }

  listMemoryAt(address, number) {
    let out = '';
    let written = 0;
    for (let x = address; x < address + number && x < this.memory.length; x++) {
      out += `${this.numToHex(this.memory[x])} `;
      written++;
      if (written % 8 === 0) {
        console.log(out);
        out = '';
      }
    }
    if (out !== '') {
      console.log(out);
    }
  }
}
module.exports = Interpreter;
