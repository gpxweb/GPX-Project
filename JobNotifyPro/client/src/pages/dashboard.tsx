import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Job, Campaign, Subscriber } from "@shared/schema";
import { Loader2, Users, Briefcase, Mail } from "lucide-react";

export default function Dashboard() {
  const { data: jobs, isLoading: jobsLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  const { data: subscribers, isLoading: subscribersLoading } = useQuery<Subscriber[]>({
    queryKey: ["/api/subscribers"],
  });

  const { data: campaigns, isLoading: campaignsLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
  });

  if (jobsLoading || subscribersLoading || campaignsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  const recentJobs = jobs?.slice(0, 5) || [];
  const recentCampaigns = campaigns?.slice(0, 5) || [];

  return (
    <div className="container py-8 space-y-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobs?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscribers?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campaigns Sent</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns?.filter(c => c.sent).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[
                { key: "title", title: "Title" },
                { key: "company", title: "Company" },
                { key: "category", title: "Category" },
              ]}
              data={recentJobs}
              emptyMessage="No jobs posted yet"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[
                { key: "name", title: "Name" },
                { key: "category", title: "Category" },
                { 
                  key: "sent", 
                  title: "Status",
                  render: (campaign: Campaign) => (
                    <span className={campaign.sent ? "text-green-600" : "text-yellow-600"}>
                      {campaign.sent ? "Sent" : "Draft"}
                    </span>
                  )
                },
              ]}
              data={recentCampaigns}
              emptyMessage="No campaigns created yet"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
