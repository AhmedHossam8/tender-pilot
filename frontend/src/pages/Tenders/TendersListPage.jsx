import * as React from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

// UI Components
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  StatusBadge,
} from "@/components/ui";

import {
  EmptyState,
  LoadingSpinner,
  ConfirmDialog,
} from "@/components/common";

import { Eye, Edit, Trash2, Plus } from "lucide-react";

// Sample JSON data
const sampleTenders = [
  { id: 1, title: "Website Redesign", status: "in-review" },
  { id: 2, title: "Mobile App Development", status: "approved" },
  { id: 3, title: "Cloud Migration", status: "draft" },
  { id: 4, title: "Security Audit", status: "submitted" },
  { id: 5, title: "Data Analytics Platform", status: "rejected" },
];

function TenderListPage() {
  const { t, i18n } = useTranslation();
  const [tenders, setTenders] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [confirmDialogOpen, setConfirmDialogOpen] = React.useState(false);
  const [selectedTender, setSelectedTender] = React.useState(null);

  // Simulate fetching data
  React.useEffect(() => {
    setTimeout(() => {
      setTenders(sampleTenders);
      setLoading(false);
    }, 500); // simulate delay
  }, []);

  const handleDelete = (tender) => {
    setTenders((prev) => prev.filter((t) => t.id !== tender.id));
    toast.success(t("Tender deleted successfully!"));
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="xl" />
      </div>
    );

  return (
    <div
      className={`p-8 min-h-screen bg-background ${i18n.language === "ar" ? "rtl" : "ltr"
        }`}
    >
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{t("Tenders")}</h1>
        <Link to="/tenders/create">
          <Button>
            <Plus className="h-4 w-4 ml-2 rtl:ml-0 rtl:mr-2" />
            {t("Create Tender")}
          </Button>
        </Link>
      </div>

      {tenders.length === 0 ? (
        <EmptyState
          title={t("No tenders found")}
          description={t("Get started by creating your first tender.")}
          actionLabel={t("Create Tender")}
          action={() => toast.info(t("Redirect to create tender"))}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t("All Tenders")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("Title")}</TableHead>
                  <TableHead>{t("Status")}</TableHead>
                  <TableHead className="text-right">{t("Actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenders.map((tender) => (
                  <TableRow key={tender.id}>
                    <TableCell className="font-medium">{tender.title}</TableCell>
                    <TableCell>
                      <StatusBadge status={tender.status || "draft"} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link to={`/tenders/${tender.id}`}>
                          <Button size="icon" variant="ghost">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link to={`/tenders/${tender.id}/edit`}>
                          <Button size="icon" variant="ghost">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          size="icon"
                          variant="destructive"
                          onClick={() => {
                            setSelectedTender(tender);
                            setConfirmDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        title={t("Delete Tender?")}
        description={t(
          "This action cannot be undone. Are you sure you want to delete this tender?"
        )}
        confirmLabel={t("Delete")}
        variant="destructive"
        onConfirm={() => {
          if (selectedTender) handleDelete(selectedTender);
          setConfirmDialogOpen(false);
        }}
      />
    </div>
  );
}

export default TenderListPage;
