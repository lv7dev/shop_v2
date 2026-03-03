import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAdminFacets } from "@/services/facets";
import { DataTableSearch } from "@/components/admin/data-table-search";
import { DataTablePagination } from "@/components/admin/data-table-pagination";

const FacetDeleteButton = dynamic(
  () => import("@/components/admin/facet-actions").then((mod) => mod.FacetDeleteButton)
);

export const metadata: Metadata = {
  title: "Manage Facets",
};

export default async function AdminFacetsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const perPage = Math.max(1, Number(params.per_page) || 10);
  const search = params.q || undefined;

  const { data: facets, total } = await getAdminFacets({
    page,
    perPage,
    search,
  });

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Facets</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage product attributes like Size, Color, Brand
          </p>
        </div>
        <Button asChild size="sm" className="gap-2">
          <Link href="/dashboard/facets/new">
            <Plus className="size-4" />
            Add Facet
          </Link>
        </Button>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <DataTableSearch placeholder="Search facets..." />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Values</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {facets.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-8 text-center text-muted-foreground"
                >
                  No facets found.
                </TableCell>
              </TableRow>
            ) : (
              facets.map((facet) => (
                <TableRow key={facet.id}>
                  <TableCell className="font-medium">{facet.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{facet.slug}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {facet.values.slice(0, 5).map((val) => (
                        <Badge key={val.id} variant="secondary" className="text-xs">
                          {val.value}
                          {val._count.products > 0 && (
                            <span className="ml-1 text-[10px] text-muted-foreground">
                              ({val._count.products})
                            </span>
                          )}
                        </Badge>
                      ))}
                      {facet.values.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{facet.values.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="size-8" asChild>
                        <Link href={`/dashboard/facets/${facet.id}/edit`}>
                          <Pencil className="size-3.5" />
                        </Link>
                      </Button>
                      <FacetDeleteButton facetId={facet.id} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <DataTablePagination total={total} page={page} perPage={perPage} />
      </div>
    </div>
  );
}
