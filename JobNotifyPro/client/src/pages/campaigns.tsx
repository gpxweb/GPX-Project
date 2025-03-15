import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Campaign, insertCampaignSchema } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2, Send } from "lucide-react";
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

export default function Campaigns() {
  const [open, setOpen] = useState(false);
  const [testEmailOpen, setTestEmailOpen] = useState(false);
  const { toast } = useToast();
  const testEmailForm = useForm({
    defaultValues: {
      email: "",
    },
  });

  const { data: campaigns, isLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
  });

  const form = useForm({
    resolver: zodResolver(insertCampaignSchema),
    defaultValues: {
      name: "",
      subject: "",
      content: "",
      category: "", //This line remains, even though the field is removed from the form.
      sent: false,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Campaign) => {
      const res = await apiRequest("POST", "/api/campaigns", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      setOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Campaign created successfully",
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

  const testEmailMutation = useMutation({
    mutationFn: async (data: { email: string }) => {
      const res = await apiRequest("POST", "/api/test-email", data);
      return res.json();
    },
    onSuccess: () => {
      setTestEmailOpen(false);
      testEmailForm.reset();
      toast({
        title: "Success",
        description: "Test email sent successfully. Please check your inbox.",
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

  const sendMutation = useMutation({
    mutationFn: async (campaignId: number) => {
      const res = await apiRequest("POST", `/api/campaigns/${campaignId}/send`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast({
        title: "Success",
        description: "Campaign sent successfully",
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
        <h1 className="text-3xl font-bold">Campaigns</h1>
        <div className="flex gap-4">
          <Dialog open={testEmailOpen} onOpenChange={setTestEmailOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                Send Test Email
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Test Email</DialogTitle>
              </DialogHeader>
              <Form {...testEmailForm}>
                <form
                  onSubmit={testEmailForm.handleSubmit((data) =>
                    testEmailMutation.mutate(data)
                  )}
                  className="space-y-4"
                >
                  <FormField
                    control={testEmailForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
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
                    disabled={testEmailMutation.isPending}
                  >
                    {testEmailMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Send Test Email"
                    )}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                New Campaign
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Campaign</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit((data) =>
                    createMutation.mutate(data)
                  )}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Subject</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Content</FormLabel>
                        <FormControl>
                          <Textarea {...field} className="min-h-[200px]" />
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
                      "Create Campaign"
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
          { key: "name", title: "Name" },
          { key: "subject", title: "Subject" },
          { key: "category", title: "Category" },
          {
            key: "sent",
            title: "Status",
            render: (campaign: Campaign) => (
              <span
                className={campaign.sent ? "text-green-600" : "text-yellow-600"}
              >
                {campaign.sent ? "Sent" : "Draft"}
              </span>
            ),
          },
          {
            key: "actions",
            title: "Actions",
            render: (campaign: Campaign) =>
              !campaign.sent && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => sendMutation.mutate(campaign.id)}
                  disabled={sendMutation.isPending}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </Button>
              ),
          },
        ]}
        data={campaigns || []}
      />
    </div>
  );
}