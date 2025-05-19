import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { showSuccess, showError } from '@/utils/toast';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

// Define the schema for the form using Zod
const loginFormSchema = z.object({
  id: z.string().min(1, { message: 'L\'ID è richiesto.' }),
  password: z.string().min(1, { message: 'La password è richiesta.' }),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      id: '',
      password: '',
    },
  });

  const onSubmit = (values: LoginFormValues) => {
    // Get ID and password from environment variables
    const correctId = import.meta.env.VITE_APP_SINGLE_USER_ID;
    const correctPassword = import.meta.env.VITE_APP_SINGLE_PASSWORD;

    // Check if environment variables are set
    if (!correctId || !correctPassword) {
      console.error("VITE_APP_SINGLE_USER_ID or VITE_APP_SINGLE_PASSWORD not set in environment variables.");
      showError("Errore di configurazione: ID o Password non impostati.");
      return;
    }

    // Check if entered ID and password match the environment variables
    if (values.id === correctId && values.password === correctPassword) {
      // Simulate successful login
      localStorage.setItem('isLoggedIn', 'true');
      showSuccess('Accesso effettuato con successo!');
      navigate('/'); // Redirect to the dashboard or home page
    } else {
      showError('ID o password errati.');
      // Optionally reset the form or specific fields on failure
      form.reset({ id: values.id, password: '' }); // Keep ID, clear password
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white to-blue-100 dark:from-gray-900 dark:to-blue-900">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Accedi</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* ID Field */}
              <FormField
                control={form.control}
                name="id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID</FormLabel>
                    <FormControl>
                      <Input placeholder="Inserisci il tuo ID" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password Field */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Inserisci la password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full">
                Accedi
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;