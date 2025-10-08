import { useEffect, useState } from 'react';
import { Home, Trophy, Medal, Award } from 'lucide-react';
import { supabase, GameScore } from '../lib/supabase';

interface LeaderboardProps {
  onMenu: () => void;
}

interface LeaderboardEntry extends GameScore {
  player_name?: string;
}

export const Leaderboard = ({ onMenu }: LeaderboardProps) => {
  const [scores, setScores] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('game_scores')
      .select(`
        *,
        players (
          name
        )
      `)
      .order('score', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error loading leaderboard:', error);
    } else if (data) {
      const formattedData = data.map((entry: any) => ({
        ...entry,
        player_name: entry.players?.name || 'Anonymous',
      }));
      setScores(formattedData);
    }
    setLoading(false);
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 1:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 2:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center font-bold text-gray-500">{index + 1}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-400 to-orange-300 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-2xl w-full">
        <h2 className="text-4xl font-bold text-center mb-6 text-gray-800">Leaderboard</h2>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading scores...</p>
          </div>
        ) : scores.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No scores yet. Be the first to play!</p>
          </div>
        ) : (
          <div className="space-y-2 mb-6">
            {scores.map((score, index) => (
              <div
                key={score.id}
                className={`flex items-center gap-4 p-4 rounded-lg transition ${
                  index < 3
                    ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="flex-shrink-0">{getRankIcon(index)}</div>
                <div className="flex-1">
                  <div className="font-bold text-gray-800">{score.player_name}</div>
                  <div className="text-sm text-gray-500">
                    Level {score.level_reached} • {score.jumps_cleared} jumps
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-800">{score.score}</div>
                  <div className="text-xs text-gray-500">points</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={onMenu}
          className="w-full bg-gradient-to-r from-gray-500 to-gray-600 text-white font-bold py-3 px-6 rounded-lg hover:from-gray-600 hover:to-gray-700 transform transition hover:scale-105 shadow-lg flex items-center justify-center gap-2"
        >
          <Home className="w-5 h-5" />
          Main Menu
        </button>
      </div>
    </div>
  );
};
