// Bot AI for Bowling Matches with different personality profiles

export class BotAI {
  /**
   * Generate throw parameters for a bot turn based on its difficulty
   * @param {string} difficulty - 'cupu' | 'medium' | 'pro'
   * @param {number} pinsRemaining - count of standing pins (1 to 10)
   * @param {Array<number>} standingPinIds - list of remaining pin numbers
   */
  static generateThrow(difficulty = 'medium', pinsRemaining = 10, standingPinIds = []) {
    let ballX = 0;
    let power = 16;
    let angle = 0;
    let spin = 0;

    if (difficulty === 'cupu') {
      // 60% chance of extreme mistake (gutter), low power
      const willGutter = Math.random() < 0.55;
      if (willGutter) {
        ballX = (Math.random() > 0.5 ? 1 : -1) * (0.35 + Math.random() * 0.1);
        angle = (ballX > 0 ? 0.045 : -0.045) + (Math.random() - 0.5) * 0.02;
        spin = (Math.random() - 0.5) * 0.8;
        power = 11 + Math.random() * 3;
      } else {
        // Weak hit, hits 2-5 pins
        ballX = (Math.random() - 0.5) * 0.3;
        angle = (Math.random() - 0.5) * 0.03;
        spin = (Math.random() - 0.5) * 0.4;
        power = 12 + Math.random() * 3;
      }
    } else if (difficulty === 'pro') {
      // Aim for the 1-3 pocket (right hand strike pocket ~ x: +0.05 to +0.08)
      if (pinsRemaining === 10) {
        // Strike shot
        ballX = 0.18 + (Math.random() - 0.5) * 0.04;
        angle = -0.018 + (Math.random() - 0.5) * 0.005;
        spin = -0.45 + (Math.random() - 0.5) * 0.1; // hook curve into the 1-3 pocket
        power = 20 + Math.random() * 2;
      } else {
        // Spare targeting
        const targetPinId = standingPinIds[0] || 1;
        const targetX = (targetPinId % 2 === 0 ? -0.15 : 0.15) * (Math.random() * 0.5 + 0.5);
        ballX = targetX + (Math.random() - 0.5) * 0.05;
        angle = (targetX - ballX) * 0.05;
        spin = 0;
        power = 18 + Math.random() * 2;
      }
    } else {
      // Medium / Casual Player
      if (pinsRemaining === 10) {
        ballX = (Math.random() - 0.5) * 0.18;
        angle = (Math.random() - 0.5) * 0.02;
        spin = (Math.random() - 0.5) * 0.3;
        power = 16 + Math.random() * 3;
      } else {
        ballX = (Math.random() - 0.5) * 0.25;
        angle = (Math.random() - 0.5) * 0.025;
        spin = (Math.random() - 0.5) * 0.2;
        power = 15 + Math.random() * 3;
      }
    }

    return {
      ballX,
      power,
      angle,
      spin,
      delayMs: 1200 + Math.random() * 1000 // natural thinking delay
    };
  }
}
