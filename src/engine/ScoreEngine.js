// Official 10-Frame Bowling Score Engine & Game Rules

export class ScoreEngine {
  /**
   * Create an initial blank player score record
   */
  static createInitialPlayer(id, name, avatar = '🎳', isBot = false, botDifficulty = 'medium') {
    return {
      id,
      name,
      avatar,
      isBot,
      botDifficulty,
      frames: Array.from({ length: 10 }, (_, i) => ({
        frameNumber: i + 1,
        rolls: [], // array of numbers or null (e.g. [10] or [7, 3])
        score: null, // cumulative score up to this frame
        isStrike: false,
        isSpare: false,
        isGutter: false,
        isComplete: false
      })),
      currentFrameIndex: 0, // 0 to 9
      currentRollIndex: 0,  // 0 to 1 (or 0 to 2 for frame 10)
      totalScore: 0,
      stats: {
        strikes: 0,
        spares: 0,
        gutters: 0,
        cupuScore: 0,
        pinsKnocked: 0
      },
      isFinished: false
    };
  }

  /**
   * Record a roll for a player and recalculate scores
   * @param {Object} player - player score object
   * @param {number} pinsHit - number of pins knocked down in this roll (0-10)
   * @returns {Object} updated player, rollType ('STRIKE' | 'SPARE' | 'GUTTER' | 'OPEN'), isFrameComplete, isGameOver
   */
  static recordRoll(player, pinsHit) {
    const updated = JSON.parse(JSON.stringify(player));
    const fIdx = updated.currentFrameIndex;
    const currentFrame = updated.frames[fIdx];
    const isFrame10 = fIdx === 9;

    let rollType = 'OPEN';
    if (pinsHit === 0) {
      rollType = 'GUTTER';
      updated.stats.gutters++;
      updated.stats.cupuScore += 10;
    } else {
      updated.stats.pinsKnocked += pinsHit;
    }

    currentFrame.rolls.push(pinsHit);

    if (!isFrame10) {
      // Frames 1-9
      if (currentFrame.rolls.length === 1) {
        if (pinsHit === 10) {
          // STRIKE!
          currentFrame.isStrike = true;
          currentFrame.isComplete = true;
          rollType = 'STRIKE';
          updated.stats.strikes++;
          updated.currentFrameIndex++;
          updated.currentRollIndex = 0;
        } else {
          updated.currentRollIndex = 1;
        }
      } else if (currentFrame.rolls.length === 2) {
        // Second roll
        const frameTotal = currentFrame.rolls[0] + currentFrame.rolls[1];
        if (frameTotal === 10) {
          currentFrame.isSpare = true;
          rollType = 'SPARE';
          updated.stats.spares++;
        }
        currentFrame.isComplete = true;
        updated.currentFrameIndex++;
        updated.currentRollIndex = 0;
      }
    } else {
      // 10th Frame
      const rolls = currentFrame.rolls;
      if (rolls.length === 1) {
        if (pinsHit === 10) {
          currentFrame.isStrike = true;
          rollType = 'STRIKE';
          updated.stats.strikes++;
        }
        updated.currentRollIndex = 1;
      } else if (rolls.length === 2) {
        if (rolls[0] === 10 && rolls[1] === 10) {
          rollType = 'STRIKE';
          updated.stats.strikes++;
        } else if (rolls[0] < 10 && rolls[0] + rolls[1] === 10) {
          currentFrame.isSpare = true;
          rollType = 'SPARE';
          updated.stats.spares++;
        }

        // Check if gets 3rd roll
        if (rolls[0] === 10 || rolls[0] + rolls[1] === 10) {
          // Earned 3rd roll
          updated.currentRollIndex = 2;
        } else {
          // No bonus roll
          currentFrame.isComplete = true;
          updated.isFinished = true;
        }
      } else if (rolls.length === 3) {
        if (pinsHit === 10) {
          rollType = 'STRIKE';
          updated.stats.strikes++;
        }
        currentFrame.isComplete = true;
        updated.isFinished = true;
      }
    }

    // Recalculate cumulative scores across all frames
    this.calculateScores(updated);

    return {
      player: updated,
      rollType,
      isFrameComplete: currentFrame.isComplete,
      isGameOver: updated.isFinished
    };
  }

  /**
   * Recalculate official USBC cumulative frame scores
   */
  static calculateScores(player) {
    // Flatten all rolls sequentially
    const allRolls = [];
    player.frames.forEach((frame, fIdx) => {
      frame.rolls.forEach((r, rIdx) => {
        allRolls.push({ frameIndex: fIdx, rollIndex: rIdx, pins: r });
      });
    });

    let runningTotal = 0;
    let rollPointer = 0;

    for (let f = 0; f < 10; f++) {
      const frame = player.frames[f];
      if (f < 9) {
        // Frames 1-9
        if (frame.rolls.length === 0) {
          frame.score = null;
          continue;
        }

        if (frame.rolls[0] === 10) {
          // Strike: 10 + next 2 rolls
          if (allRolls.length > rollPointer + 2) {
            const bonus1 = allRolls[rollPointer + 1].pins;
            const bonus2 = allRolls[rollPointer + 2].pins;
            runningTotal += 10 + bonus1 + bonus2;
            frame.score = runningTotal;
          } else {
            frame.score = null; // score pending next rolls
          }
          rollPointer += 1;
        } else if (frame.rolls.length === 2) {
          const sum = frame.rolls[0] + frame.rolls[1];
          if (sum === 10) {
            // Spare: 10 + next 1 roll
            if (allRolls.length > rollPointer + 2) {
              const bonus = allRolls[rollPointer + 2].pins;
              runningTotal += 10 + bonus;
              frame.score = runningTotal;
            } else {
              frame.score = null; // score pending next roll
            }
          } else {
            // Open frame
            runningTotal += sum;
            frame.score = runningTotal;
          }
          rollPointer += 2;
        } else {
          frame.score = null;
          rollPointer += 1;
        }
      } else {
        // Frame 10
        if (frame.rolls.length === 0) {
          frame.score = null;
        } else {
          const sum = frame.rolls.reduce((a, b) => a + b, 0);
          if (frame.isComplete) {
            runningTotal += sum;
            frame.score = runningTotal;
          } else {
            frame.score = null;
          }
        }
      }
    }

    // Set player total score to latest calculated frame score or current sum
    const completedScores = player.frames.map(f => f.score).filter(s => s !== null);
    if (completedScores.length > 0) {
      player.totalScore = completedScores[completedScores.length - 1];
    } else {
      player.totalScore = player.stats.pinsKnocked;
    }
  }

  /**
   * Determine standing pins for next roll
   * Returns maximum possible pins remaining in this frame
   */
  static getPinsRemaining(player) {
    const fIdx = player.currentFrameIndex;
    const currentFrame = player.frames[fIdx];
    if (!currentFrame || currentFrame.rolls.length === 0) return 10;

    if (fIdx < 9) {
      return 10 - currentFrame.rolls[0];
    } else {
      // 10th frame
      const r = currentFrame.rolls;
      if (r.length === 1) {
        return r[0] === 10 ? 10 : 10 - r[0];
      }
      if (r.length === 2) {
        if (r[1] === 10 || r[0] + r[1] === 10) return 10;
        return 10 - r[1];
      }
      return 10;
    }
  }

  /**
   * Determine title/award for player post-game
   */
  static calculateTotalScore(player) {
    if (!player) return 0;
    if (typeof player.totalScore === 'number') return player.totalScore;
    if (player.stats?.pinsKnocked) return player.stats.pinsKnocked;
    return 0;
  }

  static getConsecutiveStrikes(player) {
    if (!player || !player.frames) return 0;
    let consecutive = 0;
    for (let i = player.currentFrameIndex; i >= 0; i--) {
      const frame = player.frames[i];
      if (frame && frame.isStrike) {
        consecutive++;
      } else if (frame && frame.rolls && frame.rolls.length > 0) {
        break;
      }
    }
    return consecutive;
  }

  static getPlayerTitle(player) {
    if (!player) return { title: "CASUAL ROLLER", desc: "Main santai menikmati disco beat!" };
    if (player.totalScore === 300) return { title: "🌟 DEWA BOWLING SEMESTA 🌟", desc: "Perfect 300 Game! Legendaris!" };
    if (player.totalScore >= 200) return { title: "👑 RAJA STRIKE DISCO", desc: "Skill tingkat pro turnamen!" };
    if (player.totalScore >= 140) return { title: "🎳 PRO BOWLER", desc: "Permainan solid dan konsisten!" };
    if (player.stats && (player.stats.gutters >= 6 || player.totalScore < 50)) {
      return { title: "🤡 RAJA CUPU TONGKRONGAN 💩", desc: "Gutter master sejati, langganan selokan!" };
    }
    if (player.stats && player.stats.gutters >= 3) {
      return { title: "🐔 CALON CUPU BERBAKAT", desc: "Sering melenceng tapi tetep pede!" };
    }
    return { title: "✨ CASUAL ROLLER", desc: "Main santai menikmati disco beat!" };
  }
}
