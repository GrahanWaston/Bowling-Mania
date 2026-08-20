import React from 'react';
import { Crown, Sparkles, AlertOctagon, Flame, Activity } from 'lucide-react';

export default function Scoreboard({ players = [], activePlayerIndex = 0 }) {
  if (!players || players.length === 0) return null;

  const highestScore = Math.max(...players.map(p => p.totalScore || 0));

  return (
    <div className="scoreboard-container">
      {/* Stadium LED Top Bar */}
      <div className="scoreboard-header">
        <div className="scoreboard-title">
          <div className="live-broadcast-tag">
            <span className="live-dot" />
            <span>LIVE</span>
          </div>
          <Sparkles size={16} className="text-yellow-400 animate-pulse" />
          <span className="league-title">XTREME COSMIC BOWL • LANE 10</span>
        </div>
        <div className="scoreboard-right-badges">
          <span className="usbc-badge">USBC SANCTIONED</span>
          <span className="match-format-badge">10-FRAME MATCH</span>
        </div>
      </div>

      {/* Main Scoreboard Matrix */}
      <div className="scoreboard-table-wrap">
        <table className="scoreboard-table">
          <thead>
            <tr>
              <th className="th-player">BOWLER</th>
              {Array.from({ length: 10 }, (_, i) => (
                <th key={i} className={`th-frame ${i === 9 ? 'th-frame-10' : ''}`}>
                  <span className="frame-num-label">{i + 1}</span>
                </th>
              ))}
              <th className="th-total">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player, pIdx) => {
              const isActive = pIdx === activePlayerIndex;
              const isLeader = player.totalScore > 0 && player.totalScore === highestScore;

              return (
                <tr key={player.id} className={`tr-player ${isActive ? 'tr-active' : ''}`}>
                  {/* Player Profile & Stats */}
                  <td className="td-player-info">
                    <div className="player-badge">
                      <div className="avatar-frame">
                        <span className="player-avatar">{player.avatar}</span>
                        {isActive && <span className="active-glow-ring" />}
                      </div>
                      <div className="player-details">
                        <div className="player-name-row">
                          <span className="player-name">{player.name}</span>
                          {isLeader && (
                            <span className="leader-badge" title="Pimpinan Skor">
                              <Crown size={12} className="text-yellow-400" /> #1
                            </span>
                          )}
                          {player.stats.strikes >= 3 && (
                            <span className="on-fire-badge" title="On Fire! 3+ Strikes">
                              <Flame size={12} className="text-orange-400 animate-bounce" /> HOT
                            </span>
                          )}
                          {player.stats.gutters >= 2 && (
                            <span className="cupu-pill" title="Langganan Gutter!">
                              <AlertOctagon size={10} /> CUPU
                            </span>
                          )}
                        </div>
                        <div className="player-sub-meta">
                          {player.isBot ? (
                            <span className="bot-tag">AI {player.botDifficulty.toUpperCase()}</span>
                          ) : (
                            <span className="human-tag">PRO BOWLER</span>
                          )}
                          <span className="meta-sep">•</span>
                          <span className="strike-stat">{player.stats.strikes}X</span>
                          <span className="spare-stat">{player.stats.spares}/</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Frames 1 through 9 */}
                  {player.frames.map((frame, fIdx) => {
                    const isCurrentFrame = isActive && player.currentFrameIndex === fIdx;

                    if (fIdx < 9) {
                      const r1 = frame.rolls[0];
                      const r2 = frame.rolls[1];

                      let r1Display = '';
                      let r2Display = '';

                      if (frame.isStrike) {
                        r2Display = 'X';
                      } else {
                        if (r1 !== undefined) r1Display = r1 === 0 ? '-' : r1;
                        if (r2 !== undefined) {
                          r2Display = frame.isSpare ? '/' : (r2 === 0 ? '-' : r2);
                        }
                      }

                      return (
                        <td key={fIdx} className={`td-frame ${isCurrentFrame ? 'current-frame' : ''}`}>
                          <div className="frame-rolls-row">
                            <span className={`roll-box roll-1 ${r1 === 0 ? 'box-gutter' : ''}`}>
                              {r1Display}
                            </span>
                            <span className={`roll-box roll-2 ${frame.isStrike ? 'box-strike' : frame.isSpare ? 'box-spare' : r2 === 0 ? 'box-gutter' : ''}`}>
                              {r2Display}
                            </span>
                          </div>
                          <div className="frame-score">
                            {frame.score !== null ? frame.score : ''}
                          </div>
                        </td>
                      );
                    } else {
                      // Frame 10 (3 roll slots)
                      const r1 = frame.rolls[0];
                      const r2 = frame.rolls[1];
                      const r3 = frame.rolls[2];

                      const formatRoll = (r, prevR, isThird = false) => {
                        if (r === undefined) return '';
                        if (r === 10) return 'X';
                        if (r === 0) return '-';
                        if (!isThird && prevR !== undefined && prevR !== 10 && prevR + r === 10) return '/';
                        if (isThird && prevR !== undefined && prevR !== 10 && prevR + r === 10) return '/';
                        return r;
                      };

                      const isR1Strike = r1 === 10;
                      const isR2Strike = r2 === 10;
                      const isR2Spare = !isR1Strike && r1 !== undefined && r2 !== undefined && r1 + r2 === 10;
                      const isR3Strike = r3 === 10;
                      const isR3Spare = isR1Strike && !isR2Strike && r2 !== undefined && r3 !== undefined && r2 + r3 === 10;

                      return (
                        <td key={fIdx} className={`td-frame td-frame-10 ${isCurrentFrame ? 'current-frame' : ''}`}>
                          <div className="frame-rolls-row frame-10-rolls">
                            <span className={`roll-box ${isR1Strike ? 'box-strike' : r1 === 0 ? 'box-gutter' : ''}`}>
                              {formatRoll(r1)}
                            </span>
                            <span className={`roll-box ${isR2Strike ? 'box-strike' : isR2Spare ? 'box-spare' : r2 === 0 ? 'box-gutter' : ''}`}>
                              {formatRoll(r2, r1)}
                            </span>
                            <span className={`roll-box ${isR3Strike ? 'box-strike' : isR3Spare ? 'box-spare' : r3 === 0 ? 'box-gutter' : ''}`}>
                              {formatRoll(r3, r2, true)}
                            </span>
                          </div>
                          <div className="frame-score">
                            {frame.score !== null ? frame.score : ''}
                          </div>
                        </td>
                      );
                    }
                  })}

                  {/* Total Cumulative Score Badge */}
                  <td className="td-total">
                    <div className={`total-score-badge ${isLeader ? 'leader-score' : ''}`}>
                      <span className="total-score-val">{player.totalScore}</span>
                      <span className="pts-label">PTS</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
