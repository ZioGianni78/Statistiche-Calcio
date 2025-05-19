import React, { useState, useEffect } from 'react'; // Import useState and useEffect
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { showSuccess, showError } from '@/utils/toast';
import { Trash2Icon, EditIcon } from 'lucide-react'; // Import EditIcon

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


// Define the schema for the form using Zod - Added penalties
const playerStatsFormSchema = z.object({
  player_name: z.string().min(1, { message: 'Il nome del calciatore è richiesto.' }),
  match_details: z.string().optional(), // New field for manual match details
  right_foot_goals: z.coerce.number().min(0, { message: 'I gol non possono essere negativi.' }).default(0),
  left_foot_goals: z.coerce.number().min(0, { message: 'I gol non possono essere negativi.' }).default(0),
  header_goals: z.coerce.number().min(0, { message: 'I gol non possono essere negativi.' }).default(0),
  penalties: z.coerce.number().min(0, { message: 'I rigori non possono essere negativi.' }).default(0), // Added penalties field
  assists: z.coerce.number().min(0, { message: 'Gli assist non possono essere negativi.' }).default(0),
  yellow_cards: z.coerce.number().min(0, { message: 'I cartellini non possono essere negativi.' }).default(0),
  red_cards: z.coerce.number().min(0, { message: 'I cartellini non possono essere negativi.' }).default(0),
  notes: z.string().optional(),
});

type PlayerStatsFormValues = z.infer<typeof playerStatsFormSchema>;

// Define type for Player Stat data fetched from DB - Added penalties
interface PlayerStat {
  id: string;
  created_at: string;
  player_name: string;
  match_details?: string; // New field for manual match details
  right_foot_goals: number;
  left_foot_goals: number;
  header_goals: number;
  penalties: number; // Added penalties field
  assists: number;
  yellow_cards: number;
  red_cards: number;
  notes?: string;
}


const PlayerStatsPage = () => {
  const queryClient = useQueryClient();
  const [editingStatId, setEditingStatId] = useState<string | null>(null); // State to track which stat is being edited

  const form = useForm<PlayerStatsFormValues>({
    resolver: zodResolver(playerStatsFormSchema),
    defaultValues: {
      player_name: '',
      match_details: '', // Default value for new field
      right_foot_goals: 0,
      left_foot_goals: 0,
      header_goals: 0,
      penalties: 0, // Added default value
      assists: 0,
      yellow_cards: 0,
      red_cards: 0,
      notes: '',
    },
  });

  // Fetch player stats for the list
  const { data: playerStats, isLoading: isLoadingPlayerStats, error: playerStatsError } = useQuery<PlayerStat[]>({
    queryKey: ['playerStats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('player_stats')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }
      return data || [];
    },
  });

  // Fetch unique player names for datalist suggestions
  const { data: uniquePlayerNames, isLoading: isLoadingUniqueNames, error: uniqueNamesError } = useQuery<string[]>({
    queryKey: ['uniquePlayerNames'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('player_stats')
        .select('player_name', { distinct: true }); // Select distinct player names

      if (error) {
        throw error;
      }
      // Extract just the names into a simple array of strings
      return data?.map(item => item.player_name) || [];
    },
    staleTime: 1000 * 60 * 5, // Cache unique names for 5 minutes
  });

  // Effect to populate form when editingStatId changes
  useEffect(() => {
    if (editingStatId && playerStats) {
      const statToEdit = playerStats.find(stat => stat.id === editingStatId);
      if (statToEdit) {
        // Reset form with data from the stat being edited
        form.reset({
          ...statToEdit,
          // Ensure numbers are numbers
          right_foot_goals: statToEdit.right_foot_goals,
          left_foot_goals: statToEdit.left_foot_goals,
          header_goals: statToEdit.header_goals,
          penalties: statToEdit.penalties, // Populate penalties field
          assists: statToEdit.assists,
          yellow_cards: statToEdit.yellow_cards,
          red_cards: statToEdit.red_cards,
        });
      }
    } else {
      // Reset form to default values when not editing
      form.reset({
        player_name: '',
        match_details: '',
        right_foot_goals: 0,
        left_foot_goals: 0,
        header_goals: 0,
        penalties: 0, // Reset penalties
        assists: 0,
        yellow_cards: 0,
        red_cards: 0,
        notes: '',
      });
    }
  }, [editingStatId, playerStats, form]);


  // Mutation for adding a new player stat entry
  const addPlayerStatMutation = useMutation({
    mutationFn: async (newStat: PlayerStatsFormValues) => {
      const { data, error } = await supabase.from('player_stats').insert([
        {
          player_name: newStat.player_name,
          match_details: newStat.match_details,
          right_foot_goals: newStat.right_foot_goals,
          left_foot_goals: newStat.left_foot_goals,
          header_goals: newStat.header_goals,
          penalties: newStat.penalties, // Include penalties in insert
          assists: newStat.assists,
          yellow_cards: newStat.yellow_cards,
          red_cards: newStat.red_cards,
          notes: newStat.notes,
        },
      ]).select();
      if (error) {
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playerStats'] });
      queryClient.invalidateQueries({ queryKey: ['uniquePlayerNames'] }); // Invalidate unique names cache too
      queryClient.invalidateQueries({ queryKey: ['totalPlayerStats'] }); // Invalidate total stats cache on Dashboard
      showSuccess('Statistica calciatore aggiunta con successo!');
      form.reset({
        player_name: form.getValues('player_name'), // Keep entered player name
        match_details: '', // Reset new field
        right_foot_goals: 0,
        left_foot_goals: 0,
        header_goals: 0,
        penalties: 0, // Reset penalties
        assists: 0,
        yellow_cards: 0,
        red_cards: 0,
        notes: '',
      });
    },
    onError: (error: any) => {
      console.error('Error inserting player stat:', error);
      showError(`Errore durante l'inserimento della statistica: ${error.message}`);
    },
  });

  // Mutation for updating an existing player stat entry
  const updatePlayerStatMutation = useMutation({
    mutationFn: async (updatedStat: PlayerStatsFormValues) => {
      if (!editingStatId) throw new Error("No stat ID provided for update.");
      const { data, error } = await supabase.from('player_stats').update({
        player_name: updatedStat.player_name,
        match_details: updatedStat.match_details,
        right_foot_goals: updatedStat.right_foot_goals,
        left_foot_goals: updatedStat.left_foot_goals,
        header_goals: updatedStat.header_goals,
        penalties: updatedStat.penalties, // Include penalties in update
        assists: updatedStat.assists,
        yellow_cards: updatedStat.yellow_cards,
        red_cards: updatedStat.red_cards,
        notes: updatedStat.notes,
      }).eq('id', editingStatId).select();
      if (error) {
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playerStats'] });
      queryClient.invalidateQueries({ queryKey: ['uniquePlayerNames'] }); // Invalidate unique names cache too
      queryClient.invalidateQueries({ queryKey: ['totalPlayerStats'] }); // Invalidate total stats cache on Dashboard
      showSuccess('Statistica calciatore modificata con successo!');
      setEditingStatId(null); // Exit editing mode
      form.reset({ // Reset form to default empty state after editing
        player_name: '',
        match_details: '',
        right_foot_goals: 0,
        left_foot_goals: 0,
        header_goals: 0,
        penalties: 0, // Reset penalties
        assists: 0,
        yellow_cards: 0,
        red_cards: 0,
        notes: '',
      });
    },
    onError: (error: any) => {
      console.error('Error updating player stat:', error);
      showError(`Errore durante la modifica della statistica: ${error.message}`);
    },
  });


  // Mutation for deleting a player stat entry
  const deletePlayerStatMutation = useMutation({
    mutationFn: async (statId: string) => {
      const { error } = await supabase.from('player_stats').delete().eq('id', statId);
      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playerStats'] });
      queryClient.invalidateQueries({ queryKey: ['uniquePlayerNames'] }); // Invalidate unique names cache too
      queryClient.invalidateQueries({ queryKey: ['totalPlayerStats'] }); // Invalidate total stats cache on Dashboard
      showSuccess('Statistica calciatore eliminata con successo!');
      if (editingStatId) { // If the deleted stat was being edited, exit editing mode
        setEditingStatId(null);
      }
    },
    onError: (error: any) => {
      console.error('Error deleting player stat:', error);
      showError(`Errore durante l'eliminazione della statistica: ${error.message}`);
    },
  });


  const onSubmit = async (values: PlayerStatsFormValues) => {
    console.log('Player Stats Form submitted with values:', values);
    if (editingStatId) {
      updatePlayerStatMutation.mutate(values);
    } else {
      addPlayerStatMutation.mutate(values);
    }
  };

  const handleDeletePlayerStat = (statId: string) => {
    deletePlayerStatMutation.mutate(statId);
  };

  const handleEditStat = (stat: PlayerStat) => {
    setEditingStatId(stat.id);
    // The useEffect hook will handle populating the form
  };

  const handleCancelEdit = () => {
    setEditingStatId(null);
    // The useEffect hook will handle resetting the form
  };


  if (isLoadingPlayerStats || isLoadingUniqueNames) {
    return <div className="container mx-auto py-8">Caricamento dati...</div>;
  }

  if (playerStatsError) {
    console.error('Error fetching player stats:', playerStatsError);
    return <div className="container mx-auto py-8 text-red-500">Errore nel caricamento delle statistiche: {playerStatsError.message}</div>;
  }

  if (uniqueNamesError) {
    console.error('Error fetching unique player names:', uniqueNamesError);
    // We can still render the page even if unique names fail, just without suggestions
    // return <div className="container mx-auto py-8 text-red-500">Errore nel caricamento dei nomi calciatori: {uniqueNamesError.message}</div>;
  }


  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Statistiche Calciatore</h1>

      {/* Form Card */}
      <Card className="mb-8 bg-blue-50 dark:bg-blue-900"> {/* Added background class here */}
        <CardHeader>
          <CardTitle>{editingStatId ? 'Modifica Statistica' : 'Aggiungi Statistica'}</CardTitle> {/* Dynamic title */}
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Calciatore - Added list attribute */}
              <FormField
                control={form.control}
                name="player_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Calciatore</FormLabel>
                    <FormControl>
                      {/* Associate input with datalist */}
                      <Input placeholder="Nome del calciatore" {...field} list="player-names-datalist" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Datalist for player name suggestions */}
              {uniquePlayerNames && (
                <datalist id="player-names-datalist">
                  {uniquePlayerNames.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              )}


              {/* Partita - New field */}
              <FormField
                control={form.control}
                name="match_details"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Partita</FormLabel>
                    <FormControl>
                      <Input placeholder="Es. vs Squadra B (Campionato)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Gol Destro */}
              <FormField
                control={form.control}
                name="right_foot_goals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gol Destro</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={event => field.onChange(+event.target.value)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Gol Sinistro */}
              <FormField
                control={form.control}
                name="left_foot_goals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gol Sinistro</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={event => field.onChange(+event.target.value)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Gol Testa */}
              <FormField
                control={form.control}
                name="header_goals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gol Testa</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={event => field.onChange(+event.target.value)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Rigori - New field */}
              <FormField
                control={form.control}
                name="penalties"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rigori</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={event => field.onChange(+event.target.value)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Assist */}
              <FormField
                control={form.control}
                name="assists"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assist</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={event => field.onChange(+event.target.value)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Cartellini Gialli */}
              <FormField
                control={form.control}
                name="yellow_cards"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cartellini Gialli</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={event => field.onChange(+event.target.value)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Cartellini Rossi */}
              <FormField
                control={form.control}
                name="red_cards"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cartellini Rossi</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={event => field.onChange(+event.target.value)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Note */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Note sulla statistica" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex space-x-2"> {/* Button container */}
                <Button type="submit" disabled={addPlayerStatMutation.isPending || updatePlayerStatMutation.isPending}>
                  {editingStatId ? (updatePlayerStatMutation.isPending ? 'Salvataggio...' : 'Salva Modifiche') : (addPlayerStatMutation.isPending ? 'Aggiunta...' : 'Aggiungi Statistica')} {/* Dynamic button text */}
                </Button>
                {editingStatId && ( // Show Cancel button only when editing
                  <Button type="button" variant="outline" onClick={handleCancelEdit}>
                    Annulla Modifica
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* List of player stats */}
      <Card className="bg-blue-50 dark:bg-blue-900"> {/* Added background class here */}
        <CardHeader>
          <CardTitle>Elenco Statistiche Calciatori</CardTitle>
        </CardHeader>
        <CardContent>
          {playerStats && playerStats.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Calciatore</TableHead>
                  <TableHead>Partita</TableHead>
                  <TableHead>Assist</TableHead> {/* Moved Assist header */}
                  <TableHead>Gol D</TableHead>
                  <TableHead>Gol S</TableHead>
                  <TableHead>Gol T</TableHead>
                  <TableHead>Rigori</TableHead>
                  <TableHead>Gialli</TableHead>
                  <TableHead>Rossi</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {playerStats.map((stat) => (
                  <TableRow key={stat.id}>
                    <TableCell className="font-medium">{stat.player_name}</TableCell>
                    <TableCell>{stat.match_details || '-'}</TableCell>
                    <TableCell>{stat.assists}</TableCell> {/* Moved Assist cell */}
                    <TableCell>{stat.right_foot_goals}</TableCell>
                    <TableCell>{stat.left_foot_goals}</TableCell>
                    <TableCell>{stat.header_goals}</TableCell>
                    <TableCell>{stat.penalties}</TableCell>
                    <TableCell>{stat.yellow_cards}</TableCell>
                    <TableCell>{stat.red_cards}</TableCell>
                    <TableCell>{stat.notes || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2"> {/* Container for action buttons */}
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleEditStat(stat)}> {/* Edit Button */}
                          <EditIcon className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon" className="h-8 w-8">
                              <Trash2Icon className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Sei assolutamente sicuro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Questa azione non può essere annullata. Verrà eliminata definitivamente la statistica selezionata.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annulla</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeletePlayerStat(stat.id)}>Elimina</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p>Nessuna statistica trovata. Aggiungi una statistica qui sopra.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PlayerStatsPage;