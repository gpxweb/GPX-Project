import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Subscriber, insertSubscriberSchema } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function Subscribers() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const { data: subscribers, isLoading: subscribersLoading } = useQuery<Subscriber[]>({
    queryKey: ["/api/subscribers"],
  });

  const form = useForm({
    resolver: zodResolver(insertSubscriberSchema),
    defaultValues: {
      email: "",
      categories: [],
      active: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Subscriber) => {
      const res = await apiRequest("POST", "/api/subscribers", {
        ...data,
        categories: [], // Ensure categories is always an empty array
        active: true,  // Ensure active is always true
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscribers"] });
      setOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Subscriber added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("csv", file);
      const res = await fetch("/api/subscribers/upload-csv", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscribers"] });
      toast({
        title: "Success",
        description: "Subscribers imported successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  if (subscribersLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Subscribers</h1>
        <div className="flex gap-4">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Subscriber
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Subscriber</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit((data) => createMutation.mutate(data))}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Add Subscriber"
                    )}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Card className="w-96">
            <CardHeader>
              <CardTitle className="text-sm">Import Subscribers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="csv-upload">Upload CSV File</Label>
                  <Input
                    id="csv-upload"
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    disabled={uploadMutation.isPending}
                  />
                </div>
                {uploadMutation.isPending && (
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <DataTable
        columns={[
          { key: "email", title: "Email" },
          {
            key: "active",
            title: "Status",
            render: (subscriber: Subscriber) => (
              <span
                className={
                  subscriber.active ? "text-green-600" : "text-red-600"
                }
              >
                {subscriber.active ? "Active" : "Inactive"}
              </span>
            ),
          },
        ]}
        data={subscribers || []}
      />
    </div>
  );
}