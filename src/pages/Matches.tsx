import React, { useState, useEffect } from 'react'; // Import useState and useEffect
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Trash2Icon, EditIcon } from 'lucide-react'; // Import Trash2Icon and EditIcon
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { showSuccess, showError } from '@/utils/toast';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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


// Define the schema for the form using Zod
const matchFormSchema = z.object({
  match_date: z.date({
    required_error: 'La data della partita è richiesta.',
  }),
  home_team_id: z.string().min(1, { message: 'La squadra di casa è richiesta.' }),
  away_team_id: z.string().min(1, { message: 'La squadra ospite è richiesta.' }),
  competition: z.string().optional(),
  home_goals: z.coerce.number().min(0, { message: 'I gol non possono essere negativi.' }),
  away_goals: z.coerce.number().min(0, { message: 'I gol non possono essere negativi.' }),
  notes: z.string().optional(),
});

type MatchFormValues = z.infer<typeof matchFormSchema>;

// Define type for Match data fetched from DB
interface Match {
  id: string;
  match_date: string; // Supabase returns timestamp as string
  home_team_id: string;
  away_team_id: string;
  competition?: string;
  home_goals: number;
  away_goals: number;
  notes?: string;
}


const MatchesPage = () => {
  const queryClient = useQueryClient();
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null); // State to track which match is being edited

  const form = useForm<MatchFormValues>({
    resolver: zodResolver(matchFormSchema),
    defaultValues: {
      home_goals: 0,
      away_goals: 0,
      competition: '',
      notes: '',
      home_team_id: '',
      away_team_id: '',
      match_date: undefined, // Ensure match_date is undefined initially
    },
  });

  // Fetch matches for the list
  const { data: matches, isLoading: isLoadingMatches, error: matchesError } = useQuery<Match[]>({
    queryKey: ['matches'],
    queryFn: async () => {
      const { data, error } = await supabase.from('matches').select('*').order('match_date', { ascending: false });
      if (error) {
        throw error;
      }
      return data || [];
    },
  });

  // Effect to populate form when editingMatchId changes
  useEffect(() => {
    if (editingMatchId && matches) {
      const matchToEdit = matches.find(match => match.id === editingMatchId);
      if (matchToEdit) {
        // Reset form with data from the match being edited
        form.reset({
          ...matchToEdit,
          match_date: new Date(matchToEdit.match_date), // Convert string date back to Date object
          home_goals: matchToEdit.home_goals, // Ensure numbers are numbers
          away_goals: matchToEdit.away_goals, // Ensure numbers are numbers
        });
      }
    } else {
      // Reset form to default values when not editing
      form.reset({
        home_goals: 0,
        away_goals: 0,
        competition: '',
        notes: '',
        home_team_id: '',
        away_team_id: '',
        match_date: undefined,
      });
    }
  }, [editingMatchId, matches, form]);


  // Mutation for adding a new match
  const addMatchMutation = useMutation({
    mutationFn: async (newMatch: MatchFormValues) => {
      const { data, error } = await supabase.from('matches').insert([
        {
          match_date: newMatch.match_date.toISOString(),
          home_team_id: newMatch.home_team_id,
          away_team_id: newMatch.away_team_id,
          competition: newMatch.competition,
          home_goals: newMatch.home_goals,
          away_goals: newMatch.away_goals,
          notes: newMatch.notes,
        },
      ]).select();
      if (error) {
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      showSuccess('Partita aggiunta con successo!');
      form.reset({ // Reset form but keep team names for quick entry
        home_goals: 0,
        away_goals: 0,
        competition: '',
        notes: '',
        match_date: undefined,
        home_team_id: form.getValues('home_team_id'),
        away_team_id: form.getValues('away_team_id'),
      });
    },
    onError: (error: any) => {
      console.error('Error inserting match:', error);
      showError(`Errore durante l'inserimento della partita: ${error.message}`);
    },
  });

  // Mutation for updating an existing match
  const updateMatchMutation = useMutation({
    mutationFn: async (updatedMatch: MatchFormValues) => {
      if (!editingMatchId) throw new Error("No match ID provided for update.");
      const { data, error } = await supabase.from('matches').update({
        match_date: updatedMatch.match_date.toISOString(),
        home_team_id: updatedMatch.home_team_id,
        away_team_id: updatedMatch.away_team_id,
        competition: updatedMatch.competition,
        home_goals: updatedMatch.home_goals,
        away_goals: updatedMatch.away_goals,
        notes: updatedMatch.notes,
      }).eq('id', editingMatchId).select();
      if (error) {
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      showSuccess('Partita modificata con successo!');
      setEditingMatchId(null); // Exit editing mode
      form.reset({ // Reset form to default empty state after editing
        home_goals: 0,
        away_goals: 0,
        competition: '',
        notes: '',
        home_team_id: '',
        away_team_id: '',
        match_date: undefined,
      });
    },
    onError: (error: any) => {
      console.error('Error updating match:', error);
      showError(`Errore durante la modifica della partita: ${error.message}`);
    },
  });


  // Mutation for deleting a match
  const deleteMatchMutation = useMutation({
    mutationFn: async (matchId: string) => {
      const { error } = await supabase.from('matches').delete().eq('id', matchId);
      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] }); // Invalidate cache to refetch matches
      showSuccess('Partita eliminata con successo!');
      if (editingMatchId) { // If the deleted match was being edited, exit editing mode
        setEditingMatchId(null);
      }
    },
    onError: (error: any) => {
      console.error('Error deleting match:', error);
      showError(`Errore durante l'eliminazione della partita: ${error.message}`);
    },
  });


  const onSubmit = async (values: MatchFormValues) => {
    console.log('Form submitted with values:', values);

    if (values.home_team_id.trim().toLowerCase() === values.away_team_id.trim().toLowerCase()) {
      form.setError('away_team_id', {
        type: 'manual',
        message: 'La squadra ospite deve essere diversa dalla squadra di casa.',
      });
      showError('La squadra ospite deve essere diversa dalla squadra di casa.');
      return;
    }

    if (editingMatchId) {
      updateMatchMutation.mutate(values);
    } else {
      addMatchMutation.mutate(values);
    }
  };

  const handleDeleteMatch = (matchId: string) => {
    deleteMatchMutation.mutate(matchId);
  };

  const handleEditMatch = (match: Match) => {
    setEditingMatchId(match.id);
    // The useEffect hook will handle populating the form
  };

  const handleCancelEdit = () => {
    setEditingMatchId(null);
    // The useEffect hook will handle resetting the form
  };


  if (isLoadingMatches) {
    return <div className="container mx-auto py-8">Caricamento partite...</div>;
  }

  if (matchesError) {
    console.error('Error fetching matches:', matchesError);
    return <div className="container mx-auto py-8 text-red-500">Errore nel caricamento delle partite: {matchesError.message}</div>;
  }


  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Gestione Partite</h1>

      {/* Form Card */}
      <Card className="mb-8 bg-blue-50 dark:bg-blue-900">
        <CardHeader>
          <CardTitle>{editingMatchId ? 'Modifica Partita' : 'Aggiungi Nuova Partita'}</CardTitle> {/* Dynamic title */}
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Data Partita */}
              <FormField
                control={form.control}
                name="match_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data Partita</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-[240px] pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground',
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>Seleziona una data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Squadra Casa - Changed to Input */}
              <FormField
                control={form.control}
                name="home_team_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Squadra Casa</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome squadra di casa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Squadra Ospite - Changed to Input */}
              <FormField
                control={form.control}
                name="away_team_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Squadra Ospite</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome squadra ospite" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Competizione */}
              <FormField
                control={form.control}
                name="competition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Competizione</FormLabel>
                    <FormControl>
                      <Input placeholder="Es. Campionato, Coppa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Gol Casa */}
              <FormField
                control={form.control}
                name="home_goals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gol Casa</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={event => field.onChange(+event.target.value)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Gol Ospite */}
              <FormField
                control={form.control}
                name="away_goals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gol Ospite</FormLabel>
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
                      <Textarea placeholder="Note sulla partita" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex space-x-2"> {/* Button container */}
                <Button type="submit" disabled={addMatchMutation.isPending || updateMatchMutation.isPending}>
                  {editingMatchId ? (updateMatchMutation.isPending ? 'Salvataggio...' : 'Salva Modifiche') : (addMatchMutation.isPending ? 'Aggiunta...' : 'Aggiungi Partita')} {/* Dynamic button text */}
                </Button>
                {editingMatchId && ( // Show Cancel button only when editing
                  <Button type="button" variant="outline" onClick={handleCancelEdit}>
                    Annulla Modifica
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* List of matches */}
      <Card className="bg-blue-50 dark:bg-blue-900">
        <CardHeader>
          <CardTitle>Elenco Partite</CardTitle>
        </CardHeader>
        <CardContent>
          {matches && matches.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Squadra Casa</TableHead>
                  <TableHead>Squadra Ospite</TableHead>
                  <TableHead>Risultato</TableHead>
                  <TableHead>Competizione</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matches.map((match) => (
                  <TableRow key={match.id}>
                    <TableCell className="font-medium">{format(new Date(match.match_date), 'PPP')}</TableCell>
                    <TableCell>{match.home_team_id}</TableCell>
                    <TableCell>{match.away_team_id}</TableCell>
                    <TableCell>{`${match.home_goals} - ${match.away_goals}`}</TableCell>
                    <TableCell>{match.competition || '-'}</TableCell>
                    <TableCell>{match.notes || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2"> {/* Container for action buttons */}
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleEditMatch(match)}> {/* Edit Button */}
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
                                Questa azione non può essere annullata. Verrà eliminata definitivamente la partita selezionata.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annulla</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteMatch(match.id)}>Elimina</AlertDialogAction>
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
            <p>Nessuna partita trovata. Aggiungi una partita qui sopra.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MatchesPage;