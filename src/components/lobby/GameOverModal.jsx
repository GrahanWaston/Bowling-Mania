import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Crown, AlertOctagon, RotateCcw, Home, Trophy, Flame } from 'lucide-react';
import { ScoreEngine } from '../../engine/ScoreEngine';

export default function GameOverModal({
  players = [],
  onRematch,
  onBackToMenu
}) {
  // Sort players by total score descending
  const sortedPlayers = [...players].sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
  const winner = sortedPlayers[0];

  useEffect(() => {
    // Fire winner celebration confetti
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.5 },
      colors: ['#fbbf24', '#f59e0b', '#06b6d4', '#ec4899', '#ffffff']
    });
  }, []);

  return (
    <div className="game-over-backdrop">
      <div className="game-over-card">
        {/* Winner Banner */}
        <div className="winner-podium-header">
          <div className="trophy-bounce">🏆</div>
          <h1 className="game-over-title">MATCH SELESAI!</h1>
          <div className="winner-announcement">
            <Crown size={22} className="text-yellow-400 inline mr-2" />
            <span>JUARA 1: <strong className="text-yellow-300">{winner?.name}</strong> ({winner?.totalScore} Pts)</span>
          </div>
        </div>

        {/* Players Standings Table */}
        <div className="standings-table-wrap">
          <table className="standings-table">
            <thead>
              <tr>
                <th>RANK</th>
                <th>PEMAIN</th>
                <th>SKOR</th>
                <th>STRIKES</th>
                <th>SPARES</th>
                <th>GUTTER (CUPU)</th>
                <th>GELAR</th>
              </tr>
            </thead>
            <tbody>
              {sortedPlayers.map((player, rankIdx) => {
                const titleInfo = ScoreEngine.getPlayerTitle(player);
                const isRank1 = rankIdx === 0;
                const isLastRank = rankIdx === sortedPlayers.length - 1 && sortedPlayers.length > 1;

                return (
                  <tr key={player.id} className={`standing-row ${isRank1 ? 'row-winner' : ''} ${isLastRank ? 'row-last' : ''}`}>
                    <td className="rank-cell">
                      {rankIdx === 0 ? '🥇' : rankIdx === 1 ? '🥈' : rankIdx === 2 ? '🥉' : `#${rankIdx + 1}`}
                    </td>
                    <td className="player-name-cell">
                      <span className="standing-avatar">{player.avatar}</span>
                      <span className="standing-name">{player.name}</span>
                    </td>
                    <td className="score-cell font-mono font-bold text-cyan-300">{player.totalScore}</td>
                    <td className="stat-cell text-yellow-400">{player.stats.strikes}</td>
                    <td className="stat-cell text-green-400">{player.stats.spares}</td>
                    <td className="stat-cell text-red-400">
                      {player.stats.gutters > 0 ? `💩 ${player.stats.gutters}` : '-'}
                    </td>
                    <td className="title-cell">
                      <span className={`title-pill ${isLastRank && player.stats.gutters >= 2 ? 'pill-cupu' : 'pill-pro'}`}>
                        {titleInfo.title}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Actions Footer */}
        <div className="game-over-actions">
          <button className="rematch-btn" onClick={onRematch}>
            <RotateCcw size={18} />
            <span>Main Lagi (Rematch) 🎳</span>
          </button>
          <button className="menu-btn" onClick={onBackToMenu}>
            <Home size={18} />
            <span>Kembali ke Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
}
