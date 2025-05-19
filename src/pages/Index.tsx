import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';

// Define types for fetched data
interface Match {
  id: string;
  match_date: string; // Supabase returns timestamp as string
  home_team_id: string;
  away_team_id: string;
  competition?: string;
  home_goals: number;
  away_goals: number;
}

// Updated interface to match the columns returned by the player_total_stats view
interface PlayerTotalStats {
  player_name: string;
  total_right_foot_goals: number;
  total_left_foot_goals: number;
  total_header_goals: number;
  total_penalties: number; // Added total penalties
  total_assists: number;
  total_yellow_cards: number;
  total_red_cards: number;
}


const Dashboard = () => {
  // Fetch latest matches
  const { data: latestMatches, isLoading: isLoadingMatches, error: matchesError } = useQuery<Match[]>({
    queryKey: ['latestMatches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .order('match_date', { ascending: false })
        .limit(5); // Get the last 5 matches

      if (error) {
        throw error;
      }
      return data || [];
    },
  });

  // Fetch total player stats - Querying the new player_total_stats view
  const { data: totalPlayerStats, isLoading: isLoadingStats, error: statsError } = useQuery<PlayerTotalStats[]>({
    queryKey: ['totalPlayerStats'],
    queryFn: async () => {
      // Querying the player_total_stats view created in Supabase
      const { data, error } = await supabase
        .from('player_total_stats') // Querying the view
        .select('*'); // Selecting all columns from the view

      if (error) {
        throw error;
      }
      // Data from the view should already be aggregated and have the correct column names
      // We still need to ensure numbers are treated as numbers, though Supabase often handles this for views
      const formattedData = data?.map(item => ({
        player_name: item.player_name,
        total_right_foot_goals: Number(item.total_right_foot_goals || 0),
        total_left_foot_goals: Number(item.total_left_foot_goals || 0),
        total_header_goals: Number(item.total_header_goals || 0),
        total_penalties: Number(item.total_penalties || 0), // Ensure penalties is a number
        total_assists: Number(item.total_assists || 0),
        total_yellow_cards: Number(item.total_yellow_cards || 0),
        total_red_cards: Number(item.total_red_cards || 0),
      })) || [];
      return formattedData;
    },
  });


  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {/* Latest Matches Section */}
      <Card className="mb-8 bg-blue-50 dark:bg-blue-900">
        <CardHeader>
          <CardTitle>Ultime Partite</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingMatches ? (
            <p>Caricamento ultime partite...</p>
          ) : matchesError ? (
            <p className="text-red-500">Errore nel caricamento delle partite: {matchesError.message}</p>
          ) : latestMatches && latestMatches.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Partita</TableHead>
                  <TableHead>Risultato</TableHead>
                  <TableHead>Competizione</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {latestMatches.map((match) => (
                  <TableRow key={match.id}>
                    <TableCell className="font-medium">{format(new Date(match.match_date), 'PPP')}</TableCell>
                    <TableCell>{`${match.home_team_id} vs ${match.away_team_id}`}</TableCell>
                    <TableCell>{`${match.home_goals} - ${match.away_goals}`}</TableCell>
                    <TableCell>{match.competition || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p>Nessuna partita recente trovata.</p>
          )}
        </CardContent>
      </Card>

      {/* Total Player Stats Section */}
      <Card className="bg-blue-50 dark:bg-blue-900"> {/* Added background class here */}
        <CardHeader>
          <CardTitle>Riepilogo Statistiche Calciatori</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingStats ? (
            <p>Caricamento statistiche calciatori...</p>
          ) : statsError ? (
            <p className="text-red-500">Errore nel caricamento delle statistiche: {statsError.message}</p>
          ) : totalPlayerStats && totalPlayerStats.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Calciatore</TableHead>
                  <TableHead>Assist</TableHead> {/* Moved Assist header */}
                  <TableHead>Gol D</TableHead>
                  <TableHead>Gol S</TableHead>
                  <TableHead>Gol T</TableHead>
                  <TableHead>Rigori</TableHead>
                  <TableHead>Gialli</TableHead>
                  <TableHead>Rossi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {totalPlayerStats.map((stat) => (
                  <TableRow key={stat.player_name}>
                    <TableCell className="font-medium">{stat.player_name}</TableCell>
                    <TableCell>{stat.total_assists}</TableCell> {/* Moved Assist cell */}
                    {/* Accessing data using the column names from the view */}
                    <TableCell>{stat.total_right_foot_goals}</TableCell>
                    <TableCell>{stat.total_left_foot_goals}</TableCell>
                    <TableCell>{stat.total_header_goals}</TableCell>
                    <TableCell>{stat.total_penalties}</TableCell>
                    <TableCell>{stat.total_yellow_cards}</TableCell>
                    <TableCell>{stat.total_red_cards}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p>Nessuna statistica calciatore trovata.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;