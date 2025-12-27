import * as React from "react"
import { Link } from "react-router-dom"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  StatCard,
  Badge,
  StatusBadge,
  Button,
} from "@/components/ui"
import {
  FileText,
  FolderOpen,
  Users,
  TrendingUp,
  Plus,
  Calendar,
  Clock,
} from "lucide-react"

function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's an overview of your tenders.
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Tender
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Tenders"
          value="156"
          change={12.5}
          changeType="increase"
          icon={FileText}
        />
        <StatCard
          title="Active Proposals"
          value="24"
          change={-3.2}
          changeType="decrease"
          icon={FolderOpen}
        />
        <StatCard
          title="Team Members"
          value="8"
          icon={Users}
        />
        <StatCard
          title="Win Rate"
          value="68%"
          change={5.3}
          changeType="increase"
          icon={TrendingUp}
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tenders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Tenders</CardTitle>
            <CardDescription>Your latest tender submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Website Redesign RFP", status: "in-review", deadline: "Mar 15" },
                { name: "Mobile App Development", status: "approved", deadline: "Apr 1" },
                { name: "Cloud Migration Project", status: "draft", deadline: "Mar 20" },
                { name: "Security Audit Services", status: "submitted", deadline: "Feb 28" },
              ].map((tender, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{tender.name}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {tender.deadline}
                    </div>
                  </div>
                  <StatusBadge status={tender.status} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Deadlines</CardTitle>
            <CardDescription>Don't miss these important dates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Security Audit - Final Submission", date: "Feb 28", days: 3 },
                { name: "Website RFP - Q&A Deadline", date: "Mar 10", days: 14 },
                { name: "Cloud Migration - Proposal Due", date: "Mar 20", days: 24 },
                { name: "Mobile App - Presentation", date: "Apr 1", days: 36 },
              ].map((deadline, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{deadline.name}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {deadline.date}
                    </div>
                  </div>
                  <Badge variant={deadline.days <= 7 ? "destructive" : "outline"}>
                    <Clock className="h-3 w-3 mr-1" />
                    {deadline.days} days
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Browse Tenders
            </Button>
            <Button variant="outline">
              <FolderOpen className="h-4 w-4 mr-2" />
              View Proposals
            </Button>
            <Button variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Manage Team
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default DashboardPage
