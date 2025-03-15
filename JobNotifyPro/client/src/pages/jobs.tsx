import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Job, insertJobSchema } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2, Download } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Jobs() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const { data: jobs, isLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  const form = useForm({
    resolver: zodResolver(insertJobSchema),
    defaultValues: {
      title: "",
      company: "",
      description: "",
      category: "",
      location: "",
      url: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Job) => {
      const res = await apiRequest("POST", "/api/jobs", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      setOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Job posted successfully",
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

  const importJobsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", "/api/jobberway/jobs");
      const jobberwayJobs = await response.json();

      // Import each job
      for (const jobberwayJob of jobberwayJobs) {
        await apiRequest("POST", "/api/jobs", {
          title: jobberwayJob.title,
          company: jobberwayJob.company,
          description: jobberwayJob.description,
          category: jobberwayJob.category || "General",
          location: jobberwayJob.location || "Remote",
          url: jobberwayJob.url,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({
        title: "Success",
        description: "Jobs imported successfully from Jobberway",
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Jobs</h1>
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => importJobsMutation.mutate()}
            disabled={importJobsMutation.isPending}
          >
            {importJobsMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Import from Jobberway
              </>
            )}
          </Button>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                New Job
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Job</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit((data) => createMutation.mutate(data))}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Application URL</FormLabel>
                        <FormControl>
                          <Input {...field} type="url" />
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
                      "Create Job"
                    )}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <DataTable
        columns={[
          { key: "title", title: "Title" },
          { key: "company", title: "Company" },
          { key: "category", title: "Category" },
          { key: "location", title: "Location" },
          {
            key: "url",
            title: "URL",
            render: (job: Job) => (
              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Apply
              </a>
            ),
          },
        ]}
        data={jobs || []}
      />
    </div>
  );
}